import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CourtColumn = ({ title, players, onQueueWinner, onQueueLoser, onQueueGameResult, onPlayerClick, queueBlocks = [], isPriority = false, onUpdatePairing, ghostPlayer = null, shouldHighlightFirstEmptySlot = false, shouldHighlightRemainingSlots = false, shouldHighlightVictoryButtons = false }) => {
  const playerCount = players.length;
  const courtNumber = parseInt(title.replace('Court ', '')) || 0;

  // State for pairing inference
  const [clickOrder, setClickOrder] = useState([]);
  // Use pairing index from first player if available, otherwise default to 0
  const initialPairingIndex = players.length > 0 && players[0].pairingIndex !== undefined ? players[0].pairingIndex : 0;
  const [currentPairingIndex, setCurrentPairingIndex] = useState(initialPairingIndex);
  const [previousPairing, setPreviousPairing] = useState(null);
  const [hoveredPair, setHoveredPair] = useState(null);
  const [playingTime, setPlayingTime] = useState('');
  const [playingTimeMs, setPlayingTimeMs] = useState(0);
  
  // Reset click order and hover state when players change
  useEffect(() => {
    setClickOrder([]);
    setHoveredPair(null);
    // Don't reset pairing index if we're in the middle of rotating
    // Use ref to avoid stale closure issues in Firefox
    if (!isRotatingRef.current) {
      // Set pairing index from players or reset to 0
      const pairingFromPlayers = players.length > 0 && players[0].pairingIndex !== undefined ? players[0].pairingIndex : 0;
      setCurrentPairingIndex(pairingFromPlayers);
    }
  }, [players.map(p => p.playerNumber).join(',')]);

  // Update playing time for games in progress
  useEffect(() => {
    if (playerCount === 4 && players[0]?.startTime) {
      const updateTime = () => {
        // Use the earliest start time if players started at different times
        const earliestStartTime = Math.min(...players.map(p => p.startTime || Date.now()));
        const now = Date.now();
        const diff = now - earliestStartTime;
        setPlayingTimeMs(diff); // Store raw milliseconds
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) {
          setPlayingTime('< 1 Min');
        } else if (minutes === 1) {
          setPlayingTime('1 Min');
        } else {
          setPlayingTime(`${minutes} Mins`);
        }
      };

      updateTime(); // Initial update
      const interval = setInterval(updateTime, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    } else {
      setPlayingTime('');
      setPlayingTimeMs(0);
    }
  }, [playerCount, players]);

  // Generate all possible pairings from 4 players
  const generatePairings = (playerList) => {
    if (playerList.length !== 4) return [];
    const [a, b, c, d] = playerList;
    return [
      { pair1: [a, b], pair2: [c, d] },
      { pair1: [a, c], pair2: [b, d] },
      { pair1: [a, d], pair2: [b, c] }
    ];
  };
  
  const allPairings = generatePairings(players);
  const currentPairing = allPairings[currentPairingIndex] || null;
  
  // Handle player click for pairing inference
  const handlePlayerClick = (player) => {
    if (clickOrder.length < 2) {
      setClickOrder(prev => [...prev, player]);
      
      // If this is the second click, infer the pairing
      if (clickOrder.length === 1) {
        const firstPlayer = clickOrder[0];
        const pair1 = [firstPlayer, player];
        const remainingPlayers = players.filter(p => 
          p.playerNumber !== firstPlayer.playerNumber && 
          p.playerNumber !== player.playerNumber
        );
        
        // Find which pairing index matches this inference
        const inferredPairingIndex = allPairings.findIndex(pairing => {
          const pair1Numbers = pairing.pair1.map(p => p.playerNumber).sort();
          const clickNumbers = pair1.map(p => p.playerNumber).sort();
          return JSON.stringify(pair1Numbers) === JSON.stringify(clickNumbers);
        });
        
        if (inferredPairingIndex !== -1) {
          setCurrentPairingIndex(inferredPairingIndex);
        }
      }
    }
  };
  
  // Handle pair winner selection
  const handlePairWinner = (winningPair) => {
    const losingPair = currentPairing?.pair1 === winningPair ? currentPairing.pair2 : currentPairing.pair1;

    // Reset hover state when game ends
    setHoveredPair(null);

    // Queue all players as one atomic action
    const winnerNames = winningPair.map(p => p.playerName || `Player #${p.playerNumber}`).join(' & ');
    const allPlayers = [...winningPair, ...losingPair];
    onQueueGameResult?.(allPlayers, winningPair, `${winnerNames} win`);
  };
  
  // State for rotation animation
  const [isRotating, setIsRotating] = useState(false);
  const isRotatingRef = useRef(false);

  // Rotate to next pairing option
  const rotatePairing = () => {
    setIsRotating(true);
    isRotatingRef.current = true;
    setPreviousPairing(currentPairing);
    const newIndex = (currentPairingIndex + 1) % allPairings.length;
    setCurrentPairingIndex(newIndex);

    setTimeout(() => {
      setIsRotating(false);
      isRotatingRef.current = false;
    }, 700);

    // Update the global state with the new pairing index
    if (onUpdatePairing) {
      onUpdatePairing(courtNumber, newIndex);
    }
  };

  // Get position for player based on their position in pairing
  const getPlayerPosition = (playerNumber) => {
    if (!currentPairing) return { x: 0, y: 0 };

    // Find where this player is in the current pairing
    if (currentPairing.pair1[0].playerNumber === playerNumber) {
      return { x: 0, y: 0 }; // Top pair - left player (centered for now)
    }
    if (currentPairing.pair1[1].playerNumber === playerNumber) {
      return { x: 0, y: 0 }; // Top pair - right player (stacked for now)
    }
    if (currentPairing.pair2[0].playerNumber === playerNumber) {
      return { x: 0, y: 100 }; // Bottom left
    }
    if (currentPairing.pair2[1].playerNumber === playerNumber) {
      return { x: 160, y: 100 }; // Bottom right
    }

    return { x: 0, y: 0 };
  };

  // Get movement info for a player
  const getPlayerMovement = (player) => {
    if (!previousPairing || !currentPairing) return { hasMoved: false };
    
    // Find player's position in previous pairing
    let prevPosition = null;
    if (previousPairing.pair1.some(p => p.playerNumber === player.playerNumber)) {
      prevPosition = { pair: 1, index: previousPairing.pair1.findIndex(p => p.playerNumber === player.playerNumber) };
    } else if (previousPairing.pair2.some(p => p.playerNumber === player.playerNumber)) {
      prevPosition = { pair: 2, index: previousPairing.pair2.findIndex(p => p.playerNumber === player.playerNumber) };
    }
    
    // Find player's position in current pairing
    let currentPosition = null;
    if (currentPairing.pair1.some(p => p.playerNumber === player.playerNumber)) {
      currentPosition = { pair: 1, index: currentPairing.pair1.findIndex(p => p.playerNumber === player.playerNumber) };
    } else if (currentPairing.pair2.some(p => p.playerNumber === player.playerNumber)) {
      currentPosition = { pair: 2, index: currentPairing.pair2.findIndex(p => p.playerNumber === player.playerNumber) };
    }
    
    if (!prevPosition || !currentPosition) return { hasMoved: false };
    
    const hasMoved = prevPosition.pair !== currentPosition.pair || prevPosition.index !== currentPosition.index;
    
    if (!hasMoved) return { hasMoved: false };
    
    // Calculate movement direction
    let x = 0, y = 0;
    
    // Horizontal movement (between positions in same row)
    if (prevPosition.pair === currentPosition.pair) {
      // Moving within same pair (left-right)
      x = prevPosition.index === 0 ? 30 : -30; // Come from left or right
    } else {
      // Moving between pairs (up-down)
      y = prevPosition.pair === 1 ? 40 : -40; // Come from above or below
      
      // Also add some horizontal movement for diagonal feel
      if (prevPosition.index !== currentPosition.index) {
        x = prevPosition.index === 0 ? 20 : -20;
      }
    }
    
    return { hasMoved: true, x, y };
  };
  
  // Check if there are players from this court already in queue (indicating game ended)
  const playersInQueueFromThisCourt = queueBlocks
    .filter(block => block.sourceCourt === courtNumber && !block.closed)
    .flatMap(block => block.players).length;
  
  const isDeclaringResults = playerCount > 0 && playerCount < 4 && playersInQueueFromThisCourt > 0;
  const isWaitingForPlayers = playerCount > 0 && playerCount < 4 && playersInQueueFromThisCourt === 0;
  const isPlaying = playerCount === 4 && playersInQueueFromThisCourt === 0;
  const showQueueButtons = isPlaying || isDeclaringResults;
  
  return (
    <div className={`court ${isWaitingForPlayers ? 'court--waiting' : ''} ${isPlaying ? 'court--playing' : ''} ${isDeclaringResults ? 'court--declaring' : ''} ${isPriority ? 'court--priority' : ''}`}>
      {isPriority && (
        <div className="court__priority-arrow">
          <i className="fas fa-arrow-down"></i>
        </div>
      )}
      <div className="court__header">
        <h3 className="court__title">{title}</h3>
        <div className="court__status">
          {playerCount === 0 && <span className="court__status-text">Empty</span>}
          {isWaitingForPlayers && (
            <span className="court__status-text court__status-text--waiting">
              {4 - playerCount} More Player{4 - playerCount !== 1 ? 's' : ''}
            </span>
          )}
          {isPlaying && <span className="court__status-text court__status-text--playing">{playingTime ? `Playing ${playingTime}` : 'Playing'}</span>}
          {isDeclaringResults && <span className="court__status-text court__status-text--declaring">Declaring Result</span>}
        </div>
      </div>

      <div className="court__content">
        {isPlaying && currentPairing && (
        <div className="court__pairing-container">
          {/* Render all players in stable order, only animating positions */}
          {players.map((player) => {
            const position = getPlayerPosition(player.playerNumber);
            const isPair1 = currentPairing.pair1.some(p => p.playerNumber === player.playerNumber);
            const isPair2 = currentPairing.pair2.some(p => p.playerNumber === player.playerNumber);

            return (
              <motion.div
                key={`court-player-${player.playerNumber}`}
                className={`court__pair-player court__pair-player--absolute ${
                  isPair1 && hoveredPair === 1 ? 'winning' :
                  isPair1 && hoveredPair === 2 ? 'losing' :
                  isPair2 && hoveredPair === 2 ? 'winning' :
                  isPair2 && hoveredPair === 1 ? 'losing' : ''
                } ${
                  isPair1 && currentPairing.pair1[0].playerNumber === player.playerNumber ? 'court__pair-player--top-left' :
                  isPair1 && currentPairing.pair1[1].playerNumber === player.playerNumber ? 'court__pair-player--top-right' :
                  isPair2 && currentPairing.pair2[0].playerNumber === player.playerNumber ? 'court__pair-player--bottom-left' :
                  isPair2 && currentPairing.pair2[1].playerNumber === player.playerNumber ? 'court__pair-player--bottom-right' : ''
                }`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%'
                }}
                animate={{
                  x: position.x,
                  y: position.y,
                  transform: isPair1 ?
                    (currentPairing.pair1[0].playerNumber === player.playerNumber ? 'translate(calc(-50% - 75px), calc(-50% - 65px))' :
                     currentPairing.pair1[1].playerNumber === player.playerNumber ? 'translate(calc(-50% + 75px), calc(-50% - 65px))' :
                     'translate(-50%, calc(-50% - 65px))') :
                    (currentPairing.pair2[0].playerNumber === player.playerNumber ? 'translate(calc(-50% - 75px), calc(-50% + 65px))' :
                     currentPairing.pair2[1].playerNumber === player.playerNumber ? 'translate(calc(-50% + 75px), calc(-50% + 65px))' :
                     'translate(-50%, calc(-50% + 65px))')
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  mass: 0.8
                }}
              >
                <button
                  type="button"
                  className="player-card__name-button"
                  onClick={() => onPlayerClick?.(player)}
                >
                  {player.playerName || `Player #${player.playerNumber}`}
                </button>
              </motion.div>
            );
          })}

          {/* Win buttons - positioned in center */}
          <motion.button
            type="button"
            className={`queue-btn winner court__pair-win-btn court__pair-win-btn--top ${hoveredPair === 2 ? 'losing' : ''} ${shouldHighlightVictoryButtons ? 'help-pulse' : ''}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, calc(-50% - 65px))',
              transformOrigin: 'center center'
            }}
            onClick={() => handlePairWinner(currentPairing.pair1)}
            onMouseEnter={() => setHoveredPair(1)}
            onMouseLeave={() => setHoveredPair(null)}
          >
            <i className="fas fa-trophy"></i>
          </motion.button>

          <div className="court__vs-divider" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transformOrigin: 'center center'
          }}>
            <span>vs</span>
          </div>

          <motion.button
            type="button"
            className={`queue-btn winner court__pair-win-btn court__pair-win-btn--bottom ${hoveredPair === 1 ? 'losing' : ''} ${shouldHighlightVictoryButtons ? 'help-pulse' : ''}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, calc(-50% + 65px))',
              transformOrigin: 'center center'
            }}
            onClick={() => handlePairWinner(currentPairing.pair2)}
            onMouseEnter={() => setHoveredPair(2)}
            onMouseLeave={() => setHoveredPair(null)}
          >
            <i className="fas fa-trophy"></i>
          </motion.button>
        </div>
        )}

        {!isPlaying && (
        <div className="court__pairing-container court__pairing-container--empty">
          {/* Always show 4 slots in 2x2 layout */}
          {[0, 1, 2, 3].map((slotIndex) => {
            const player = players[slotIndex];
            const isGhostSlot = !player && ghostPlayer && slotIndex === players.length;

            // Calculate position for each slot
            const slotPosition = {
              0: 'translate(calc(-50% - 75px), calc(-50% - 65px))',
              1: 'translate(calc(-50% + 75px), calc(-50% - 65px))',
              2: 'translate(calc(-50% - 75px), calc(-50% + 65px))',
              3: 'translate(calc(-50% + 75px), calc(-50% + 65px))'
            }[slotIndex];

            const positionClass = {
              0: 'court__pair-player--top-left',
              1: 'court__pair-player--top-right',
              2: 'court__pair-player--bottom-left',
              3: 'court__pair-player--bottom-right'
            }[slotIndex];

            return (
              <div
                key={`slot-${slotIndex}`}
                className="court__slot"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: slotPosition
                }}
              >
                {player ? (
                  <div className={`court__pair-player court__pair-player--waiting ${positionClass}`}>
                    <button
                      type="button"
                      className="player-card__name-button"
                      onClick={() => onPlayerClick?.(player)}
                    >
                      {player.playerName || `Player #${player.playerNumber}`}
                    </button>
                  </div>
                ) : isGhostSlot ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="ghost"
                      className={`court__slot-ghost ${positionClass}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      {ghostPlayer.playerName || `Player #${ghostPlayer.playerNumber}`}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className={`court__slot-empty ${positionClass} ${
                    (shouldHighlightFirstEmptySlot && slotIndex === players.length) ||
                    (shouldHighlightRemainingSlots && slotIndex >= players.length)
                      ? 'help-pulse' : ''
                  }`}>
                    <span>Empty</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* VS divider - always show */}
          <div className="court__vs-divider" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.3
          }}>
            <span>vs</span>
          </div>
        </div>
        )}
      </div>

      {isPlaying && (
        <div className={`court__help-text ${playingTimeMs < 60000 ? 'court__help-text--new-game' : ''}`}>
          {playingTimeMs < 60000 ? (
            <>NEW GAME</>
          ) : (
            <>When finished, click winning pair</>
          )}
        </div>
      )}

      <div className="court__footer">
        {isPlaying ? (
          <button
            type="button"
            className="court__footer court__footer--button"
            onClick={rotatePairing}
          >
            <i className="fas fa-sync-alt"></i> Rotate Pairing
          </button>
        ) : playerCount === 0 ? (
          <span className="court__footer-text">
            <i className="fas fa-user-plus"></i> Add players from queue
          </span>
        ) : (
          <span className="court__footer-text">
            <i className="fas fa-users"></i> {4 - playerCount} more needed
          </span>
        )}
      </div>
    </div>
  );
};

const CourtsArea = ({ players, courtCount, onQueueWinner, onQueueLoser, onQueueGameResult, onPlayerClick, queueBlocks, priorityCourtNum, onUpdatePairing, hoveredPlayer, hoveredTargetCourt, shouldHighlightFirstEmptySlot, shouldHighlightRemainingSlots, shouldHighlightVictoryButtons }) => {
  const courts = Array.from({ length: courtCount }, (_, i) => {
    const num = i + 1;
    return {
      num,
      players: players.filter((p) => p.onCourt && p.courtNumber === num),
    };
  });

  return (
    <div className="courts-area">
      {courts.map((c) => (
        <CourtColumn
          key={c.num}
          title={`Court ${c.num}`}
          players={c.players}
          onQueueWinner={onQueueWinner}
          onQueueLoser={onQueueLoser}
          onQueueGameResult={onQueueGameResult}
          onPlayerClick={onPlayerClick}
          queueBlocks={queueBlocks}
          isPriority={c.num === priorityCourtNum}
          onUpdatePairing={onUpdatePairing}
          ghostPlayer={c.num === hoveredTargetCourt ? hoveredPlayer : null}
          shouldHighlightFirstEmptySlot={shouldHighlightFirstEmptySlot && c.num === 1}
          shouldHighlightRemainingSlots={shouldHighlightRemainingSlots && c.num === 1}
          shouldHighlightVictoryButtons={shouldHighlightVictoryButtons && c.num === 1}
        />
      ))}
    </div>
  );
};

export default CourtsArea;
