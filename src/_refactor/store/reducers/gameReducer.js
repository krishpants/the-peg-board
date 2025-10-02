/**
 * Game Reducer - All state transitions in one place
 */

import { createPlayer, createQueueBlock, resetQueueBlockCounter, createPlannedGame } from '../gameStore';

export const gameReducer = (state, action) => {
  switch (action.type) {
    // ============ SESSION ACTIONS ============
    case 'START_SESSION': {
      const { courtCount, playerCount } = action.payload;

      // Reset queue block counter for new session
      resetQueueBlockCounter();
      const newState = {
        ...state,
        config: {
          ...state.config,
          courtCount,
          maxPlayers: 999, // No real limit, just a high number
          sessionStarted: true,
        },
        players: {},
        playerStatus: {},
        courts: {},
        queueBlocks: {},
        queueBlockOrder: [],
        plannedGames: {},
        plannedGameOrder: [],
      };

      // Initialize courts
      for (let i = 1; i <= courtCount; i++) {
        newState.courts[i] = {
          playerIds: [],
          pairingIndex: 0,
          startTime: null,
        };
      }

      // Create initial players and put them in a single new_players block
      const initialBlock = createQueueBlock('new_players', null, 0);
      newState.queueBlocks[initialBlock.id] = initialBlock;
      newState.queueBlockOrder = [initialBlock.id];

      for (let i = 1; i <= playerCount; i++) {
        const player = createPlayer(i);
        newState.players[i] = player;
        newState.playerStatus[i] = {
          location: 'queue',
          queueBlockId: initialBlock.id,
        };
        initialBlock.playerIds.push(i);
      }

      return newState;
    }

    case 'RESET_SESSION': {
      // Reset queue block counter when resetting session
      resetQueueBlockCounter();

      return {
        ...state,
        config: {
          ...state.config,
          sessionStarted: false,
        },
        players: {},
        playerStatus: {},
        courts: {},
        queueBlocks: {},
        queueBlockOrder: [],
        plannedGames: {},
        plannedGameOrder: [],
      };
    }

    // ============ PLAYER ACTIONS ============
    case 'ADD_PLAYER': {
      const playerNumber = Object.keys(state.players).length + 1;
      if (playerNumber > state.config.maxPlayers) {
        return state; // Max players reached
      }

      const player = createPlayer(playerNumber);

      // Find or create appropriate new_players block
      let targetBlockId = null;

      // Check if the last block is a new_players block that's not closed
      if (state.queueBlockOrder.length > 0) {
        const lastBlockId = state.queueBlockOrder[state.queueBlockOrder.length - 1];
        const lastBlock = state.queueBlocks[lastBlockId];
        if (lastBlock && lastBlock.type === 'new_players' && !lastBlock.closed) {
          targetBlockId = lastBlockId;
        }
      }

      // Create new new_players block if needed
      if (!targetBlockId) {
        // Find the maximum display order among non-planned blocks and increment
        const maxDisplayOrder = Math.max(
          ...Object.values(state.queueBlocks)
            .filter(b => b.type !== 'planned_game')
            .map(b => b.displayOrder || 0),
          -1 // Start at -1 so first block gets 0
        );
        const newBlock = createQueueBlock('new_players', null, maxDisplayOrder + 1);
        targetBlockId = newBlock.id;

        return {
          ...state,
          players: {
            ...state.players,
            [playerNumber]: player,
          },
          playerStatus: {
            ...state.playerStatus,
            [playerNumber]: {
              location: 'queue',
              queueBlockId: targetBlockId,
            },
          },
          queueBlocks: {
            ...state.queueBlocks,
            [targetBlockId]: {
              ...newBlock,
              playerIds: [playerNumber],
            },
          },
          queueBlockOrder: [...state.queueBlockOrder, targetBlockId],
        };
      }

      // Add to existing new_players block
      const block = state.queueBlocks[targetBlockId];
      const updatedBlock = {
        ...block,
        playerIds: [...block.playerIds, playerNumber],
      };

      return {
        ...state,
        players: {
          ...state.players,
          [playerNumber]: player,
        },
        playerStatus: {
          ...state.playerStatus,
          [playerNumber]: {
            location: 'queue',
            queueBlockId: targetBlockId,
          },
        },
        queueBlocks: {
          ...state.queueBlocks,
          [targetBlockId]: updatedBlock,
        },
      };
    }

    case 'UPDATE_PLAYER_NAME': {
      const { playerId, name } = action.payload;
      if (!state.players[playerId]) return state;

      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            name: name.trim(),
          },
        },
      };
    }

    case 'BULK_UPDATE_PLAYER_NAMES': {
      const { updates } = action.payload;
      const updatedPlayers = { ...state.players };

      Object.entries(updates).forEach(([playerNumber, name]) => {
        const playerId = parseInt(playerNumber, 10);
        if (updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            name: name
          };
        }
      });

      return {
        ...state,
        players: updatedPlayers
      };
    }

    // ============ COURT ACTIONS ============
    case 'ROTATE_PAIRING': {
      const { courtNumber } = action.payload;
      const court = state.courts[courtNumber];

      if (!court || court.playerIds.length !== 4) {
        return state; // Can only rotate full courts
      }

      return {
        ...state,
        courts: {
          ...state.courts,
          [courtNumber]: {
            ...court,
            pairingIndex: (court.pairingIndex + 1) % 3
          }
        }
      };
    }
    case 'ASSIGN_TO_COURT': {
      const { playerId, courtNumber } = action.payload;
      const player = state.players[playerId];
      const court = state.courts[courtNumber];

      if (!player || !court || court.playerIds.length >= 4) {
        return state; // Invalid assignment
      }

      const newState = {
        ...state,
        queueBlocks: { ...state.queueBlocks },
        plannedGames: { ...state.plannedGames }
      };

      // Remove player from their current location
      const status = state.playerStatus[playerId];
      let previousQueueBlockId = null;
      let previousQueueBlock = null;

      if (status) {
        if (status.queueBlockId) {
          // Store the queue block info before removing player
          previousQueueBlockId = status.queueBlockId;
          previousQueueBlock = { ...newState.queueBlocks[status.queueBlockId] };

          // Remove from queue block
          const block = { ...newState.queueBlocks[status.queueBlockId] };
          block.playerIds = block.playerIds.filter(id => id !== playerId);

          // If this empties the block, remove it entirely
          if (block.playerIds.length === 0) {
            delete newState.queueBlocks[status.queueBlockId];
            newState.queueBlockOrder = state.queueBlockOrder.filter(id => id !== status.queueBlockId);
          } else {
            newState.queueBlocks[status.queueBlockId] = block;
          }
        }

        // Remove from any planned games and delete empty ones
        Object.keys(newState.queueBlocks).forEach(blockId => {
          const block = newState.queueBlocks[blockId];
          if (block.type === 'planned_game' && block.playerIds.includes(playerId)) {
            const updatedIds = block.playerIds.map(id => id === playerId ? null : id);

            // Check if all slots are now empty
            if (updatedIds.every(id => id === null)) {
              // Delete the empty planned game
              delete newState.queueBlocks[blockId];
              newState.queueBlockOrder = newState.queueBlockOrder.filter(id => id !== blockId);

              // Clear UI selection if it was this game
              if (state.ui && state.ui.selectedPlannedGameSlot?.blockId === blockId) {
                newState.ui = {
                  ...state.ui,
                  selectedPlannedGameSlot: null,
                };
              }
            } else {
              // Just update the player IDs
              newState.queueBlocks[blockId] = {
                ...block,
                playerIds: updatedIds,
              };
            }
          }
        });
      }

      // Add to court
      newState.courts = {
        ...state.courts,
        [courtNumber]: {
          ...court,
          playerIds: [...court.playerIds, playerId],
          startTime: court.playerIds.length === 3 ? Date.now() : court.startTime,
        },
      };

      // Update player status (preserve any state like winner/loser and queue block reference)
      newState.playerStatus = {
        ...state.playerStatus,
        [playerId]: {
          ...state.playerStatus[playerId],
          location: 'court',
          courtNumber,
          queueBlockId: null,
          previousQueueBlockId: previousQueueBlockId,
          previousQueueBlock: previousQueueBlock, // Store block metadata for recreation
        },
      };

      return newState;
    }

    case 'REMOVE_FROM_COURT': {
      const { playerId } = action.payload;
      const status = state.playerStatus[playerId];

      if (!status || status.location !== 'court') {
        return state; // Player not on court
      }

      const courtNumber = status.courtNumber;
      const court = state.courts[courtNumber];

      if (!court) {
        return state;
      }

      const newState = {
        ...state,
        queueBlocks: { ...state.queueBlocks },
        queueBlockOrder: [...state.queueBlockOrder],
      };

      // Remove player from court
      newState.courts = {
        ...state.courts,
        [courtNumber]: {
          ...court,
          playerIds: court.playerIds.filter(id => id !== playerId),
          startTime: null, // Reset start time if game hasn't started
        },
      };

      // Restore player to queue
      let restoredQueueBlockId = null;

      if (status.previousQueueBlockId && newState.queueBlocks[status.previousQueueBlockId]) {
        // Block still exists - add player back to it
        restoredQueueBlockId = status.previousQueueBlockId;
        newState.queueBlocks[restoredQueueBlockId] = {
          ...newState.queueBlocks[restoredQueueBlockId],
          playerIds: [...newState.queueBlocks[restoredQueueBlockId].playerIds, playerId],
        };
      } else if (status.previousQueueBlock) {
        // Block was deleted - recreate it
        restoredQueueBlockId = status.previousQueueBlockId;
        newState.queueBlocks[restoredQueueBlockId] = {
          ...status.previousQueueBlock,
          playerIds: [playerId],
        };
        // Add back to queue order in appropriate position
        newState.queueBlockOrder.push(restoredQueueBlockId);
      } else {
        // No previous block info - create new block based on player state
        const blockId = generateQueueBlockId();
        restoredQueueBlockId = blockId;

        newState.queueBlocks[blockId] = {
          id: blockId,
          type: status.state === 'winner' || status.state === 'loser' ? 'game_ended' : 'returning_players',
          sourceCourt: courtNumber,
          playerIds: [playerId],
          timestamp: Date.now(),
          displayOrder: Object.keys(newState.queueBlocks).length,
        };
        newState.queueBlockOrder.push(blockId);
      }

      // Update player status
      newState.playerStatus = {
        ...state.playerStatus,
        [playerId]: {
          ...status,
          location: 'queue',
          queueBlockId: restoredQueueBlockId,
          courtNumber: null,
          previousQueueBlockId: null,
          previousQueueBlock: null,
        },
      };

      return newState;
    }

    case 'COMPLETE_GAME': {
      const { courtNumber, winningPair, losingPair } = action.payload;
      const court = state.courts[courtNumber];

      if (!court || court.playerIds.length !== 4) {
        return state; // Invalid game completion
      }

      let newState = { ...state };

      // Clear the court
      newState.courts = {
        ...state.courts,
        [courtNumber]: {
          ...court,
          playerIds: [],
          pairingIndex: 0,
          startTime: null
        }
      };

      // Create a single game_ended block with all 4 players
      // Find the maximum display order among non-planned blocks and increment
      const maxDisplayOrder = Math.max(
        ...Object.values(newState.queueBlocks)
          .filter(b => b.type !== 'planned_game')
          .map(b => b.displayOrder || 0),
        -1 // Start at -1 so first block gets 0
      );
      const gameEndedBlock = createQueueBlock('game_ended', courtNumber, maxDisplayOrder + 1);
      gameEndedBlock.playerIds = [...winningPair, ...losingPair];
      gameEndedBlock.closed = true; // Game ended blocks are always closed

      // Add the block to state
      newState.queueBlocks = {
        ...newState.queueBlocks,
        [gameEndedBlock.id]: gameEndedBlock
      };
      newState.queueBlockOrder = [...newState.queueBlockOrder, gameEndedBlock.id];

      // Check all planned games - if they contain any players still on court,
      // keep them at the back of the queue
      Object.values(newState.queueBlocks).forEach(block => {
        if (block.type === 'planned_game' && block.closed && block.displayOrder != null) {
          // Check if this planned game contains any players still on court
          const hasPlayingPlayer = block.playerIds.some(playerId => {
            if (!playerId) return false;
            // Check if this player is still on any court
            return Object.values(newState.courts).some(court =>
              court.playerIds.includes(playerId)
            );
          });

          if (hasPlayingPlayer) {
            // Push this planned game to the back of the queue
            // Find the highest display order among non-planned blocks
            const maxQueuePosition = Math.max(
              ...Object.values(newState.queueBlocks)
                .filter(b => b.type !== 'planned_game')
                .map(b => b.displayOrder || 0),
              0
            );
            block.displayOrder = maxQueuePosition + 0.5;
          }
        }
      });

      // Update player status - mark winners and losers
      const updatedPlayerStatus = { ...state.playerStatus };
      winningPair.forEach(playerId => {
        updatedPlayerStatus[playerId] = {
          location: 'queue',
          queueBlockId: gameEndedBlock.id,
          state: 'winner'  // Changed from lastState to state
        };
      });
      losingPair.forEach(playerId => {
        updatedPlayerStatus[playerId] = {
          location: 'queue',
          queueBlockId: gameEndedBlock.id,
          state: 'loser'  // Changed from lastState to state
        };
      });

      newState.playerStatus = updatedPlayerStatus;

      return newState;
    }

    case 'QUEUE_PLAYER': {
      const { playerId, state: playerState } = action.payload;
      const player = state.players[playerId];
      if (!player) return state;

      const status = state.playerStatus[playerId];
      const sourceCourt = status?.courtNumber || -1;

      // Find or create appropriate queue block
      let targetBlockId = null;

      // Look for open block from same source
      for (const blockId of state.queueBlockOrder) {
        const block = state.queueBlocks[blockId];
        if (block.sourceCourt === sourceCourt && !block.closed && block.playerIds.length < 4) {
          targetBlockId = blockId;
          break;
        }
      }

      // Create new block if needed
      if (!targetBlockId) {
        const newBlock = createQueueBlock(sourceCourt);
        targetBlockId = newBlock.id;

        return {
          ...state,
          queueBlocks: {
            ...state.queueBlocks,
            [targetBlockId]: {
              ...newBlock,
              playerIds: [playerId],
            },
          },
          queueBlockOrder: [...state.queueBlockOrder, targetBlockId],
          playerStatus: {
            ...state.playerStatus,
            [playerId]: {
              location: 'queue',
              queueBlockId: targetBlockId,
              lastState: playerState, // 'winner', 'loser', etc.
            },
          },
        };
      }

      // Add to existing block
      const block = state.queueBlocks[targetBlockId];
      const updatedBlock = {
        ...block,
        playerIds: [...block.playerIds, playerId],
        closed: block.playerIds.length >= 3, // Close at 4 players
      };

      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [targetBlockId]: updatedBlock,
        },
        playerStatus: {
          ...state.playerStatus,
          [playerId]: {
            location: 'queue',
            queueBlockId: targetBlockId,
            lastState: playerState,
          },
        },
      };
    }

    // ============ PLANNED GAME ACTIONS ============
    case 'CREATE_PLANNED_GAME': {
      const plannedGameBlock = createQueueBlock('planned_game');
      plannedGameBlock.playerIds = [null, null, null, null]; // 4 empty slots

      // Clean up queueBlockOrder - remove any stale IDs that don't exist in queueBlocks
      const cleanedOrder = state.queueBlockOrder.filter(id => state.queueBlocks[id]);

      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [plannedGameBlock.id]: plannedGameBlock,
        },
        queueBlockOrder: [...cleanedOrder, plannedGameBlock.id],
        ui: {
          ...state.ui,
          selectedPlannedGameSlot: { blockId: plannedGameBlock.id, slotIndex: 0 },
        },
      };
    }

    case 'ADD_PLAYER_TO_PLANNED_GAME': {
      const { blockId, playerId } = action.payload;
      const block = state.queueBlocks[blockId];
      const slot = state.ui.selectedPlannedGameSlot;

      if (!block || block.type !== 'planned_game' || !playerId || !slot) return state;

      // Check if player is already in this game
      const currentIds = block.playerIds.filter(id => id !== null);
      if (currentIds.includes(playerId)) return state;

      // Update the specific slot
      const updatedPlayerIds = [...block.playerIds];
      updatedPlayerIds[slot.slotIndex] = playerId;

      // Check if block is now full and find next empty slot
      const filledSlots = updatedPlayerIds.filter(id => id !== null).length;
      const isFull = filledSlots === 4;

      // Find next empty slot after current one
      let nextSlotIndex = null;
      if (!isFull) {
        for (let i = slot.slotIndex + 1; i < 4; i++) {
          if (updatedPlayerIds[i] === null) {
            nextSlotIndex = i;
            break;
          }
        }
      }

      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [blockId]: {
            ...block,
            playerIds: updatedPlayerIds,
            closed: isFull, // Close when full
          },
        },
        ui: {
          ...state.ui,
          selectedPlannedGameSlot: nextSlotIndex !== null ? { blockId, slotIndex: nextSlotIndex } : null,
        },
      };
    }

    case 'REMOVE_PLAYER_FROM_PLANNED_GAME': {
      const { blockId, slotIndex } = action.payload;
      const block = state.queueBlocks[blockId];

      if (!block || block.type !== 'planned_game') return state;

      const updatedPlayerIds = [...block.playerIds];
      updatedPlayerIds[slotIndex] = null;

      // Check if all slots are now empty
      const isEmpty = updatedPlayerIds.every(id => id === null);

      if (isEmpty) {
        // Delete the planned game entirely if it's empty
        const { [blockId]: removed, ...remainingBlocks } = state.queueBlocks;
        const updatedState = {
          ...state,
          queueBlocks: remainingBlocks,
          queueBlockOrder: state.queueBlockOrder.filter(id => id !== blockId),
        };

        // Clear UI selection if it was this game
        if (state.ui && state.ui.selectedPlannedGameSlot?.blockId === blockId) {
          updatedState.ui = {
            ...state.ui,
            selectedPlannedGameSlot: null,
          };
        }

        return updatedState;
      }

      // Otherwise just update the slot
      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [blockId]: {
            ...block,
            playerIds: updatedPlayerIds,
            closed: false, // Reopen if was closed
          },
        },
      };
    }

    case 'DELETE_PLANNED_GAME': {
      const { blockId } = action.payload;
      const { [blockId]: removed, ...remainingBlocks } = state.queueBlocks;

      const updatedState = {
        ...state,
        queueBlocks: remainingBlocks,
        queueBlockOrder: state.queueBlockOrder.filter(id => id !== blockId),
      };

      // Only update ui if it exists and has the selectedPlannedGameSlot
      if (state.ui && state.ui.selectedPlannedGameSlot?.blockId === blockId) {
        updatedState.ui = {
          ...state.ui,
          selectedPlannedGameSlot: null,
        };
      }

      return updatedState;
    }

    case 'SET_PLANNED_GAME_SLOT': {
      const { blockId, slotIndex } = action.payload;

      return {
        ...state,
        ui: {
          ...state.ui,
          selectedPlannedGameSlot: blockId ? { blockId, slotIndex } : null,
        },
      };
    }

    case 'UPDATE_PLANNED_GAME_POSITION': {
      const { blockId, position } = action.payload;
      const block = state.queueBlocks[blockId];

      if (!block || block.type !== 'planned_game') return state;

      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [blockId]: {
            ...block,
            displayOrder: position,
          },
        },
      };
    }

    // ============ UI ACTIONS ============
    case 'SET_SELECTED_SLOT': {
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedPlannedGameSlot: action.payload,
        },
      };
    }

    case 'SET_HOVERED_PLAYER': {
      return {
        ...state,
        ui: {
          ...state.ui,
          hoveredPlayerId: action.payload,
        },
      };
    }

    case 'MARK_PLAYER_AS_LEFT': {
      const { playerId } = action.payload;
      const player = state.players[playerId];

      if (!player) return state;

      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          [playerId]: {
            ...state.playerStatus[playerId],
            location: 'left',
            state: 'left',
          },
        },
      };
    }

    case 'MARK_PLAYER_AS_RESTING': {
      const { playerId } = action.payload;
      const player = state.players[playerId];

      if (!player) return state;

      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          [playerId]: {
            ...state.playerStatus[playerId],
            location: 'resting',
            state: 'resting',
          },
        },
      };
    }

    case 'RESTORE_PLAYER': {
      const { playerId } = action.payload;
      const player = state.players[playerId];

      if (!player) return state;

      // Create a returning player block
      const maxDisplayOrder = Math.max(
        ...Object.values(state.queueBlocks)
          .filter(b => b.type !== 'planned_game')
          .map(b => b.displayOrder || 0),
        -1
      );

      const returningBlock = createQueueBlock('returning_players', 0, maxDisplayOrder + 1);
      returningBlock.playerIds = [playerId];

      return {
        ...state,
        queueBlocks: {
          ...state.queueBlocks,
          [returningBlock.id]: returningBlock,
        },
        queueBlockOrder: [...state.queueBlockOrder, returningBlock.id],
        playerStatus: {
          ...state.playerStatus,
          [playerId]: {
            ...state.playerStatus[playerId],
            location: 'queue',
            state: 'waiting',
            queueBlockId: returningBlock.id,
          },
        },
      };
    }

    case 'SUBSTITUTE_PLAYER': {
      const { playerToRemove, playerToAdd, courtNumber } = action.payload;
      const court = state.courts[courtNumber];

      if (!court) return state;

      // Replace the player in the court's playerIds array
      const newPlayerIds = court.playerIds.map(id =>
        id === playerToRemove ? playerToAdd : id
      );

      // Remove playerToAdd from their current queue block
      const playerToAddStatus = state.playerStatus[playerToAdd];
      let updatedQueueBlocks = { ...state.queueBlocks };

      if (playerToAddStatus?.queueBlockId) {
        const oldBlock = updatedQueueBlocks[playerToAddStatus.queueBlockId];
        if (oldBlock) {
          const updatedPlayerIds = oldBlock.playerIds.filter(id => id !== playerToAdd);

          if (updatedPlayerIds.length === 0) {
            // Remove empty block
            const { [playerToAddStatus.queueBlockId]: removed, ...remaining } = updatedQueueBlocks;
            updatedQueueBlocks = remaining;
          } else {
            updatedQueueBlocks = {
              ...updatedQueueBlocks,
              [playerToAddStatus.queueBlockId]: {
                ...oldBlock,
                playerIds: updatedPlayerIds,
              },
            };
          }
        }
      }

      // Find the last returning_players block
      const returningBlocks = Object.values(updatedQueueBlocks)
        .filter(b => b.type === 'returning_players')
        .sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0));

      const lastReturningBlock = returningBlocks[0];

      let updatedQueueBlockOrder = state.queueBlockOrder;
      let targetBlockId;

      if (lastReturningBlock) {
        // Add to existing returning_players block
        targetBlockId = lastReturningBlock.id;
        updatedQueueBlocks = {
          ...updatedQueueBlocks,
          [targetBlockId]: {
            ...lastReturningBlock,
            playerIds: [...lastReturningBlock.playerIds, playerToRemove],
          },
        };
      } else {
        // Create a new returning_players block
        const maxDisplayOrder = Math.max(
          ...Object.values(updatedQueueBlocks)
            .filter(b => b.type !== 'planned_game')
            .map(b => b.displayOrder || 0),
          -1
        );

        const returningBlock = createQueueBlock('returning_players', 0, maxDisplayOrder + 1);
        returningBlock.playerIds = [playerToRemove];
        targetBlockId = returningBlock.id;

        updatedQueueBlocks = {
          ...updatedQueueBlocks,
          [returningBlock.id]: returningBlock,
        };
        updatedQueueBlockOrder = [...updatedQueueBlockOrder, returningBlock.id];
      }

      // Remove empty blocks from order
      updatedQueueBlockOrder = updatedQueueBlockOrder.filter(id => updatedQueueBlocks[id]);

      return {
        ...state,
        courts: {
          ...state.courts,
          [courtNumber]: {
            ...court,
            playerIds: newPlayerIds,
          },
        },
        queueBlocks: updatedQueueBlocks,
        queueBlockOrder: updatedQueueBlockOrder,
        playerStatus: {
          ...state.playerStatus,
          [playerToRemove]: {
            ...state.playerStatus[playerToRemove],
            location: 'queue',
            state: 'waiting',
            queueBlockId: targetBlockId,
          },
          [playerToAdd]: {
            ...state.playerStatus[playerToAdd],
            location: 'court',
            courtNumber,
            queueBlockId: null,
          },
        },
      };
    }

    default:
      return state;
  }
};