import { useState, useEffect } from 'react';

const STORAGE_KEY = 'badminton-session-state';

export const createPlayer = (index) => ({
  onCourt: true,
  lastState: 'firstGame',
  playerNumber: index + 1,
  playerName: `Player #${index + 1}`,
  courtNumber: 0, // 0 = Unknown Court
  benched: false,
});

// Load state from localStorage
const loadStateFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

// Save state to localStorage
const saveStateToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// Clear localStorage
const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

// Each queue block:
// { id: number, sourceCourt: number, closed: boolean, players: Array<{playerNumber, playerName, lastState}> }
export default function useBadmintonSession() {
  // Try to load saved state
  const savedState = loadStateFromStorage();

  const [courtCount, setCourtCount] = useState(savedState?.courtCount ?? 4);
  const [playerCount, setPlayerCount] = useState(savedState?.playerCount ?? 20);
  const [sessionStarted, setSessionStarted] = useState(savedState?.sessionStarted ?? false);
  const [players, setPlayers] = useState(savedState?.players ?? []);
  const [queueBlocks, setQueueBlocks] = useState(savedState?.queueBlocks ?? []);
  const [undoStack, setUndoStack] = useState(savedState?.undoStack ?? []);
  const [nextGamePlayers, setNextGamePlayers] = useState(savedState?.nextGamePlayers ?? []);

  // Auto-save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      courtCount,
      playerCount,
      sessionStarted,
      players,
      queueBlocks,
      undoStack,
      nextGamePlayers
    };
    saveStateToStorage(stateToSave);
  }, [courtCount, playerCount, sessionStarted, players, queueBlocks, undoStack, nextGamePlayers]);

  const setCounts = ({ courtCount: cc, playerCount: pc }) => {
    if (typeof cc === 'number') setCourtCount(Math.max(1, cc));
    if (typeof pc === 'number') setPlayerCount(Math.max(0, pc));
  };

  // Undo stack functions
  const saveStateToUndoStack = (actionDescription) => {
    const stateSnapshot = {
      players: [...players],
      queueBlocks: queueBlocks.map(block => ({
        ...block,
        players: [...block.players]
      })),
      action: actionDescription,
      timestamp: Date.now()
    };
    
    setUndoStack(prev => {
      const newStack = [...prev, stateSnapshot];
      // Keep max 20 undo actions
      return newStack.slice(-20);
    });
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const lastState = undoStack[undoStack.length - 1];
    setPlayers(lastState.players);
    setQueueBlocks(lastState.queueBlocks);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const clearUndoStack = () => {
    setUndoStack([]);
  };

  const startSession = () => {
    // Start everyone as new arrivals in the queue
    const initialPlayers = Array.from({ length: playerCount }, (_, i) => createPlayer(i));
    const initialQueue = {
      id: 1,
      sourceCourt: -1, // New arrivals
      closed: false,
      timestamp: Date.now(),
      players: initialPlayers.map(player => ({
        playerNumber: player.playerNumber,
        playerName: player.playerName,
        lastState: 'waiting'
      }))
    };
    
    setPlayers([]);
    setQueueBlocks([initialQueue]);
    setSessionStarted(true);
    clearUndoStack();
  };

  const addPlayer = () => {
    saveStateToUndoStack(`Add Player #${Math.max(0, ...players.map(p => p.playerNumber), ...queueBlocks.flatMap(block => block.players.map(p => p.playerNumber))) + 1}`);
    
    // Calculate next player number based on all players (on court + in queue)
    const allPlayerNumbers = [
      ...players.map(p => p.playerNumber),
      ...queueBlocks.flatMap(block => block.players.map(p => p.playerNumber))
    ];
    const nextPlayerNumber = Math.max(0, ...allPlayerNumbers) + 1;
    
    const newPlayer = {
      playerNumber: nextPlayerNumber,
      playerName: `Player #${nextPlayerNumber}`,
      lastState: 'waiting'
    };

    // Add new arrivals to the queue - respecting chronological order
    setQueueBlocks((prev) => {
      // Find where benched blocks start (if any)
      const firstBenchedIndex = prev.findIndex(block => block.benchedType);
      const nonBenchedBlocks = firstBenchedIndex === -1 ? prev : prev.slice(0, firstBenchedIndex);

      // Check if the LAST non-benched block is a new arrivals block
      const lastNonBenchedBlock = nonBenchedBlocks[nonBenchedBlocks.length - 1];
      const canAddToLastBlock = lastNonBenchedBlock &&
                               lastNonBenchedBlock.sourceCourt === -1 &&
                               !lastNonBenchedBlock.closed &&
                               !lastNonBenchedBlock.benchedType;

      if (canAddToLastBlock) {
        // Add to the existing new arrivals block at the end
        return prev.map(block =>
          block.id === lastNonBenchedBlock.id
            ? { ...block, players: [...block.players, newPlayer] }
            : block
        );
      } else {
        // Create new arrivals block - always goes after all regular blocks but before benched
        const nextQueueId = Math.max(0, ...prev.map(b => b.id || 0)) + 1;
        const newBlock = {
          id: nextQueueId,
          sourceCourt: -1,
          closed: false,
          timestamp: Date.now(),
          players: [newPlayer]
        };

        if (firstBenchedIndex === -1) {
          // No benched blocks, add at the end
          return [...prev, newBlock];
        } else {
          // Insert before benched blocks
          return [
            ...prev.slice(0, firstBenchedIndex),
            newBlock,
            ...prev.slice(firstBenchedIndex)
          ];
        }
      }
    });
  };

  const resetSession = () => {
    setPlayers([]);
    setQueueBlocks([]);
    setSessionStarted(false);
    clearUndoStack();
    clearStorage(); // Clear localStorage when starting new session
  };

  // keep names in sync everywhere (on court + queued)
  const updatePlayerName = (playerNumber, name) => {
    const clean = (name ?? '').trim();
    saveStateToUndoStack(`Update Player #${playerNumber} name`);

    setPlayers((prev) =>
      prev.map((p) =>
        p.playerNumber === playerNumber ? { ...p, playerName: clean } : p
      )
    );

    setQueueBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        players: b.players.map((qp) =>
          qp.playerNumber === playerNumber ? { ...qp, playerName: clean } : qp
        ),
      }))
    );
  };

  // --- CORE: cohort queues by source court, 4 max, close on 4 ---
  const enqueuePlayerWithState = (player, state) => {
    saveStateToUndoStack(`Queue Player #${player.playerNumber} as ${state}`);
    
    const sourceCourt = player.courtNumber ?? 0; // 0 = Unknown Court

    // Get all players currently on the same court
    const playersFromSameCourt = players.filter(
      (p) => p.onCourt && p.courtNumber === sourceCourt
    );

    // Find open block for this source court to count existing winners
    const openBlock = queueBlocks.find(
      (b) => !b.closed && b.sourceCourt === sourceCourt
    );
    const existingWinners = openBlock?.players.filter(p => p.lastState === 'winner').length || 0;

    // Determine if we should auto-queue remaining players
    const shouldAutoQueue = state === 'winner' && 
                           existingWinners === 1 && 
                           playersFromSameCourt.length === 3; // Current player + 2 remaining

    let playersToQueue = [{ player, state }];
    
    if (shouldAutoQueue) {
      // Get the 2 remaining players on court (excluding current player)
      const remainingPlayers = playersFromSameCourt.filter(
        p => p.playerNumber !== player.playerNumber
      );
      
      playersToQueue = [
        { player, state: 'winner' },
        ...remainingPlayers.map(p => ({ player: p, state: 'loser' }))
      ];
    }

    // Remove players being queued from the players array (they'll be in queueBlocks)
    setPlayers((prev) => {
      const playerNumbersToQueue = playersToQueue.map(({ player }) => player.playerNumber);
      return prev.filter(p => !playerNumbersToQueue.includes(p.playerNumber));
    });

    setQueueBlocks((prev) => {
      const blocks = prev.map((b) => ({ ...b, players: [...b.players] }));

      // Find an OPEN block for THIS sourceCourt with enough space
      let target = blocks.find(
        (b) => !b.closed && b.sourceCourt === sourceCourt && 
        (b.players.length + playersToQueue.length) <= 4
      );

      // If none, start a new block for that source court
      if (!target) {
        const nextId = (blocks[blocks.length - 1]?.id || 0) + 1;
        target = { id: nextId, sourceCourt, closed: false, players: [], timestamp: Date.now() };
        blocks.push(target);
      }

      // Add all players to the queue
      playersToQueue.forEach(({ player: playerToQueue, state: playerState }) => {
        target.players.push({
          playerNumber: playerToQueue.playerNumber,
          playerName: playerToQueue.playerName,
          lastState: playerState,
        });
      });

      // Close when reaching 4
      if (target.players.length >= 4) {
        target.closed = true;
      }

      return blocks;
    });
  };

  // Queue game results as one atomic action
  const queueGameResult = (allPlayers, winningPair, actionDescription) => {
    saveStateToUndoStack(actionDescription);
    
    const winnersSet = new Set(winningPair.map(p => p.playerNumber));
    
    // Remove all players from court first
    setPlayers((prev) => {
      const playerNumbersToQueue = allPlayers.map(p => p.playerNumber);
      return prev.filter(p => !playerNumbersToQueue.includes(p.playerNumber));
    });

    // Get source court from first player
    const sourceCourt = allPlayers[0]?.courtNumber ?? 0;
    
    // Add to queue blocks
    setQueueBlocks((prev) => {
      const blocks = prev.map((b) => ({ ...b, players: [...b.players] }));

      // Find an OPEN block for THIS sourceCourt with enough space
      let target = blocks.find(
        (b) => !b.closed && b.sourceCourt === sourceCourt && 
        (b.players.length + allPlayers.length) <= 4
      );

      // If none, start a new block for that source court
      if (!target) {
        const nextId = (blocks[blocks.length - 1]?.id || 0) + 1;
        target = { id: nextId, sourceCourt, closed: false, players: [], timestamp: Date.now() };
        blocks.push(target);
      }

      // Add all players to the queue with their results
      allPlayers.forEach((player) => {
        const isWinner = winnersSet.has(player.playerNumber);
        target.players.push({
          playerNumber: player.playerNumber,
          playerName: player.playerName,
          lastState: isWinner ? 'winner' : 'loser',
        });
      });

      // Close when reaching 4
      if (target.players.length >= 4) {
        target.closed = true;
      }

      return blocks;
    });
  };

  // Track processing to prevent race conditions
  const [processingAssignment, setProcessingAssignment] = useState(false);

  const assignCourtFromQueue = (blockId, playerNumber, courtNum) => {
    // Prevent rapid clicks
    if (processingAssignment) {
      return;
    }

    // Check court occupancy before processing
    const currentCourtPlayers = players.filter(p => p.onCourt && p.courtNumber === courtNum);
    if (currentCourtPlayers.length >= 4) {
      console.warn('Court is already full:', courtNum);
      return;
    }

    setProcessingAssignment(true);

    // Small delay to ensure state consistency
    setTimeout(() => {
      saveStateToUndoStack(`Assign Player #${playerNumber} to Court ${courtNum}`);

      // Always remove from Next Game first if they're in it
      setNextGamePlayers((prev) => prev.filter(p => p.playerNumber !== playerNumber));

      // Find and extract the player info first
      let playerInfo = null;

      // Find the player in the current queue blocks
      const currentBlock = queueBlocks.find(b => b.id === blockId);
      if (currentBlock) {
        playerInfo = currentBlock.players.find(p => p.playerNumber === playerNumber);
      }

      if (!playerInfo) {
        console.error('Player not found in queue:', playerNumber, blockId);
        setProcessingAssignment(false);
        return;
      }

      // Remove player from queue
      setQueueBlocks((prev) => {
        return prev.map((block) =>
          block.id === blockId
            ? {
                ...block,
                players: block.players.filter(p => p.playerNumber !== playerNumber)
              }
            : block
        );
      });

      // Create new player object and add to court
      const newPlayer = {
        onCourt: true,
        lastState: playerInfo.lastState,
        playerNumber: playerInfo.playerNumber,
        playerName: playerInfo.playerName,
        courtNumber: courtNum,
        benched: false,
        startTime: Date.now(),  // Track when they started playing
        pairingIndex: 0,  // Track pairing rotation state (0, 1, or 2)
      };

      setPlayers((prev) => [...prev, newPlayer]);

      // Reset processing flag after a short delay
      setTimeout(() => setProcessingAssignment(false), 300);
    }, 50);
  };

  const updatePairingIndex = (courtNumber, pairingIndex) => {
    // Update the pairing index for all players on the specified court
    setPlayers((prev) => prev.map(player =>
      player.onCourt && player.courtNumber === courtNumber
        ? { ...player, pairingIndex }
        : player
    ));
  };

  const setBenchedStatus = (player, status) => {
    saveStateToUndoStack(`Set ${player.playerName || `#${player.playerNumber}`} as ${status}`);

    // Find which queue block contains the player
    let blockId = null;
    for (const block of queueBlocks) {
      if (block.players.some(p => p.playerNumber === player.playerNumber)) {
        blockId = block.id;
        break;
      }
    }

    if (!blockId) {
      console.error('Player not found in any queue block');
      return;
    }

    // Remove player from their current block
    setQueueBlocks((prev) => {
      return prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              players: block.players.filter(p => p.playerNumber !== player.playerNumber)
            }
          : block
      );
    });

    // If status is 'ready', return player to active queue
    if (status === 'ready') {
      // Add to returning players block or create one
      setQueueBlocks((prev) => {
        const returningBlock = prev.find(block => block.sourceCourt === -3 && !block.benchedType);

        if (returningBlock) {
          // Add to existing returning players block
          return prev.map(block =>
            block.id === returningBlock.id
              ? {
                  ...block,
                  players: [...block.players, {
                    playerNumber: player.playerNumber,
                    playerName: player.playerName,
                    lastState: 'ready'
                  }]
                }
              : block
          );
        } else {
          // Create returning players block
          return [...prev, {
            id: Date.now(),
            sourceCourt: -3,  // Special code for returning players
            closed: false,
            timestamp: Date.now(),
            players: [{
              playerNumber: player.playerNumber,
              playerName: player.playerName,
              lastState: 'ready'
            }]
          }];
        }
      });
      return;
    }

    // Add player to appropriate benched block
    const benchedType = status; // 'resting' or 'left'

    // Check if benched block already exists
    setQueueBlocks((prev) => {
      const existingBenchBlock = prev.find(block => block.benchedType === benchedType);

      if (existingBenchBlock) {
        // Add to existing benched block
        return prev.map(block =>
          block.benchedType === benchedType
            ? {
                ...block,
                players: [...block.players, {
                  playerNumber: player.playerNumber,
                  playerName: player.playerName,
                  lastState: status
                }]
              }
            : block
        );
      } else {
        // Create new benched block
        return [...prev, {
          id: Date.now(),
          sourceCourt: -1,  // They haven't come from a court
          benchedType: benchedType,  // New field for benched status
          closed: false,
          timestamp: Date.now(),
          players: [{
            playerNumber: player.playerNumber,
            playerName: player.playerName,
            lastState: status
          }]
        }];
      }
    });
  };

  // Add player to Next Game staging area
  const addToNextGame = (player) => {
    setNextGamePlayers((prev) => {
      // Check if already in next game
      if (prev.some(p => p.playerNumber === player.playerNumber)) {
        return prev;
      }
      // Check if full (4 players max)
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, player];
    });
  };

  // Remove player from Next Game
  const removeFromNextGame = (playerNumber) => {
    setNextGamePlayers((prev) => prev.filter(p => p.playerNumber !== playerNumber));
  };

  // Clear all players from Next Game
  const clearNextGame = () => {
    setNextGamePlayers([]);
  };


  const substitutePlayer = (courtPlayer, queuePlayer) => {
    saveStateToUndoStack(`Substitute ${courtPlayer.playerName || `#${courtPlayer.playerNumber}`} with ${queuePlayer.playerName || `#${queuePlayer.playerNumber}`}`);

    // Find which queue block contains the queue player
    let blockId = null;
    for (const block of queueBlocks) {
      if (block.players.some(p => p.playerNumber === queuePlayer.playerNumber)) {
        blockId = block.id;
        break;
      }
    }

    if (!blockId) {
      console.error('Queue player not found in any block');
      return;
    }

    // Remove queue player from queue
    setQueueBlocks((prev) => {
      return prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              players: block.players.filter(p => p.playerNumber !== queuePlayer.playerNumber)
            }
          : block
      );
    });

    // Remove court player from court
    setPlayers((prev) => prev.filter(p => p.playerNumber !== courtPlayer.playerNumber));

    // Add queue player to court with same court number as the player being substituted
    const newCourtPlayer = {
      onCourt: true,
      lastState: queuePlayer.lastState,
      playerNumber: queuePlayer.playerNumber,
      playerName: queuePlayer.playerName,
      courtNumber: courtPlayer.courtNumber,
      benched: false,
      startTime: Date.now(),  // Track when they started playing
      pairingIndex: 0,  // Reset pairing when substituting
    };

    setPlayers((prev) => [...prev, newCourtPlayer]);

    // Add court player to queue (mark as substitution, not from a game ending)
    const newQueueBlock = {
      id: Date.now(),
      sourceCourt: -2,  // Special value for substitutions (not -1 for new arrivals, not a court number)
      closed: false,
      timestamp: Date.now(),
      players: [{
        playerNumber: courtPlayer.playerNumber,
        playerName: courtPlayer.playerName,
        lastState: 'ready'  // They're ready to play again
      }]
    };

    setQueueBlocks((prev) => [...prev, newQueueBlock]);
  };

  return {
    // state
    courtCount,
    playerCount,
    sessionStarted,
    players,
    queueBlocks,
    undoStack,
    nextGamePlayers,
    // actions
    setCounts,
    startSession,
    addPlayer,
    resetSession,
    updatePlayerName,
    enqueuePlayerWithState,
    queueGameResult,
    assignCourtFromQueue,
    substitutePlayer,
    setBenchedStatus,
    updatePairingIndex,
    undo,
    canUndo: undoStack.length > 0,
    // Next Game actions
    addToNextGame,
    removeFromNextGame,
    clearNextGame,
  };
}
