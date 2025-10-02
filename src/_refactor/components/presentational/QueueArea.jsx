import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimeDisplay from './TimeDisplay';
import { Tutored } from './TutorialArrow';
// import PlayerAvatar from './PlayerAvatar';

const QueueArea = ({
  players,
  playerStatus,
  queueBlocks,
  queueBlockOrder,
  courts,
  priorityCourt,
  hoveredPlayer,
  selectedPlannedGameSlot,
  shouldShowPreviewBlock = false,
  visibleTips,
  onSendToCourt,
  onPlayerHover,
  onCreatePlannedGame,
  onSelectPlannedGameSlot,
  onAddPlayerToPlannedGame,
  onDeletePlannedGame,
  onCalculatePosition,
  onMarkPlayer
}) => {
  // Check if a player is in a planned game
  const isInPlannedGame = (playerId) => {
    if (!queueBlocks) return false;
    return Object.values(queueBlocks).some(block =>
      block && block.type === 'planned_game' &&
      block.playerIds && block.playerIds.includes(playerId)
    );
  };

  // Check if player is in game (on court)
  const isInGame = (playerId) => {
    const status = playerStatus[playerId];
    return status?.location === 'court';
  };

  // Get players that are in queue but not in any queue block yet and not in planned games
  const unassignedPlayers = Object.keys(players)
    .filter(playerId => {
      const status = playerStatus[playerId];
      return status?.location === 'queue' && !status.queueBlockId && !isInPlannedGame(playerId);
    })
    .map(id => players[id]);

  const handlePlayerClick = (playerId) => {
    if (selectedPlannedGameSlot) {
      // We're in planned game selection mode
      // Don't add if player is already in a planned game
      if (isInPlannedGame(playerId)) {
        return;
      }
      const { blockId } = selectedPlannedGameSlot;
      onAddPlayerToPlannedGame(blockId, playerId);
    } else if (priorityCourt && !isInGame(playerId)) {
      // Only send to court if not currently playing
      onSendToCourt(playerId, priorityCourt);
    } else if (!priorityCourt && !selectedPlannedGameSlot && !isInGame(playerId)) {
      // No priority court or planned game mode - open mark player modal
      if (onMarkPlayer) {
        onMarkPlayer(playerId);
      }
    }
  };

  // Get block label based on type
  const getBlockLabel = (block) => {
    switch (block.type) {
      case 'new_players':
        return 'New Players';
      case 'game_ended':
        return `From Court ${block.sourceCourt}`;
      case 'resting':
        return 'Resting';
      case 'returning_players':
        return 'Returning Players';
      case 'planned_game':
        return `Planned Game`;
      default:
        return block.sourceCourt > 0 ? `From Court ${block.sourceCourt}` : 'Waiting';
    }
  };

  // Track when planned games become full to delay position calculation
  const [calculatingPositions, setCalculatingPositions] = useState({});

  // Handle Escape key to cancel planned game selection
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedPlannedGameSlot) {
        // Check if the planned game is empty, delete it if so
        const block = queueBlocks[selectedPlannedGameSlot.blockId];
        if (block && block.type === 'planned_game' && !block.playerIds.some(id => id !== null)) {
          onDeletePlannedGame(selectedPlannedGameSlot.blockId);
        }
        onSelectPlannedGameSlot(null, null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedPlannedGameSlot, onSelectPlannedGameSlot, queueBlocks, onDeletePlannedGame]);

  // Handle click outside to cancel planned game selection
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!selectedPlannedGameSlot) return;

      // Check if click is on queue area or its children
      const queueArea = document.querySelector('.queue-area');
      if (queueArea && !queueArea.contains(e.target)) {
        // Check if the planned game is empty, delete it if so
        const block = queueBlocks[selectedPlannedGameSlot.blockId];
        if (block && block.type === 'planned_game' && !block.playerIds.some(id => id !== null)) {
          onDeletePlannedGame(selectedPlannedGameSlot.blockId);
        }
        onSelectPlannedGameSlot(null, null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPlannedGameSlot, onSelectPlannedGameSlot, queueBlocks, onDeletePlannedGame]);

  // onCalculatePosition is already available from props destructuring

  // Watch for planned games that just became full
  useEffect(() => {
    Object.values(queueBlocks || {}).forEach(block => {
      if (block.type === 'planned_game' && block.closed && block.displayOrder == null && !calculatingPositions[block.id]) {
        // This planned game just became full, start calculating
        setCalculatingPositions(prev => ({ ...prev, [block.id]: true }));

        // After 1 second, calculate the actual position
        setTimeout(() => {
          // Calculate the position based on players in the game
          const playerIds = block.playerIds.filter(id => id !== null);
          let highestWaitingIndex = -1;
          let hasPlayingPlayer = false;

          playerIds.forEach(playerId => {
            if (playerStatus[playerId]?.location === 'court') {
              hasPlayingPlayer = true;
            } else {
              // Find which queue block this player is in (only for waiting players)
              Object.values(queueBlocks).forEach(qb => {
                if (qb.type !== 'planned_game' && qb.playerIds && qb.playerIds.includes(playerId)) {
                  // Use the HIGHEST index (furthest back in queue)
                  highestWaitingIndex = Math.max(highestWaitingIndex, qb.displayOrder || 0);
                }
              });
            }
          });

          // If has playing player, use max queue position + 0.5 (they'll be at back when they come off)
          // Otherwise use the highest waiting player's position + 0.5
          let finalPosition;
          if (hasPlayingPlayer) {
            // Find the highest queue block index (back of queue)
            const maxQueuePosition = Math.max(...Object.values(queueBlocks)
              .filter(b => b.type !== 'planned_game')
              .map(b => b.displayOrder || 0), 0);
            finalPosition = maxQueuePosition + 0.5;
          } else if (highestWaitingIndex >= 0) {
            finalPosition = highestWaitingIndex + 0.5;
          } else {
            finalPosition = 0; // No players found, shouldn't happen
          }

          // Update the planned game with its calculated position
          if (onCalculatePosition) {
            onCalculatePosition(block.id, finalPosition);
          }

          // Remove from calculating state
          setCalculatingPositions(prev => {
            const newState = { ...prev };
            delete newState[block.id];
            return newState;
          });
        }, 1000);
      }
    });
  }, [queueBlocks, playerStatus, calculatingPositions, onCalculatePosition]);

  // Watch for planned games with playing players that need recalculation
  useEffect(() => {
    Object.values(queueBlocks || {}).forEach(block => {
      if (block.type === 'planned_game' && block.closed && block.displayOrder != null) {
        // Check if any players in this block changed from playing to waiting
        const playerIds = block.playerIds.filter(id => id !== null);
        let hasPlayingPlayer = false;
        let allWaiting = true;

        playerIds.forEach(playerId => {
          if (playerStatus[playerId]?.location === 'court') {
            hasPlayingPlayer = true;
            allWaiting = false;
          }
        });

        // If all players are now waiting but the position suggests it had playing players
        // (position > highest queue block), recalculate
        if (allWaiting && block.displayOrder > 100) {
          // Recalculate position now that all players are waiting
          let highestWaitingIndex = -1;

          playerIds.forEach(playerId => {
            Object.values(queueBlocks).forEach(qb => {
              if (qb.type !== 'planned_game' && qb.playerIds && qb.playerIds.includes(playerId)) {
                highestWaitingIndex = Math.max(highestWaitingIndex, qb.displayOrder || 0);
              }
            });
          });

          if (highestWaitingIndex >= 0) {
            const newPosition = highestWaitingIndex + 0.5;
            if (Math.abs(newPosition - block.displayOrder) > 0.1) {
              onCalculatePosition(block.id, newPosition);
            }
          }
        }
      }
    });
  }, [queueBlocks, playerStatus, onCalculatePosition]);

  // Calculate display order for planned games
  const calculatePlannedGameOrder = (block) => {
    if (block.type !== 'planned_game') return block.displayOrder || 0;

    // If not closed (not full), always return -1 to keep at top
    if (!block.closed) {
      return -1;
    }

    // If we're still calculating position for this block, return -1
    if (calculatingPositions[block.id]) {
      return -1;
    }

    // If block has a fixed displayOrder already calculated, use it
    if (block.displayOrder != null) {
      return block.displayOrder;
    }

    // Otherwise return -1 (shouldn't happen but safe default)
    return -1;
  };

  // Sort queue blocks including planned games
  const sortedBlockOrder = [...queueBlockOrder]
    .filter(id => queueBlocks[id])  // Filter out any deleted blocks
    .sort((a, b) => {
      const blockA = queueBlocks[a];
      const blockB = queueBlocks[b];
      const orderA = calculatePlannedGameOrder(blockA);
      const orderB = calculatePlannedGameOrder(blockB);
      return orderA - orderB;
    });

  const isSelectionActive = !!selectedPlannedGameSlot;

  return (
    <div className="queue-area">
      <div className="queue-area__header">
        <Tutored show={visibleTips.planGame} side="top" direction="down" color="#00bfff" gap={70} label="Plan A Game">
          <button
            type="button"
            className="queue-area__plan-game-btn queue-column__add-player"
            onClick={onCreatePlannedGame}
            disabled={isSelectionActive}
          >
            <i className="fas fa-plus"></i><span> Plan a Game</span>
          </button>
        </Tutored>
      </div>

      {/* Unassigned players (new players not in blocks yet) */}
      {unassignedPlayers.length > 0 && (
        <div className="queue-section">
          <h4>New Players</h4>
          <div className="queue-players">
            {unassignedPlayers.map((player, playerIndex) => (
              <div
                key={player.playerNumber}
                className="queue-player-card"
                onClick={() => handlePlayerClick(player.playerNumber)}
                onMouseEnter={() => onPlayerHover?.(player)}
                onMouseLeave={() => onPlayerHover?.(null)}
                title={isSelectionActive ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
              >
                {/* <PlayerAvatar name={player.name} size={20} /> */}
                <span className="queue-player-card__name">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue blocks including planned games */}
      <AnimatePresence mode="popLayout">
      {(() => {
        let visiblePriority = 0; // Track actual visible blocks
        return sortedBlockOrder.map((blockId, index) => {
          const block = queueBlocks[blockId];
          if (!block) return null;

        // Handle planned game blocks
        if (block.type === 'planned_game') {
          // Split into pairs (first 2 and last 2)
          const pair1 = [0, 1].map(idx => block.playerIds[idx] ? players[block.playerIds[idx]] : null);
          const pair2 = [2, 3].map(idx => block.playerIds[idx] ? players[block.playerIds[idx]] : null);

          const hasAnyPlayers = block.playerIds.some(id => id !== null);

          // Check if this planned game is active (has selected slot)
          const isActivePlannedGame = selectedPlannedGameSlot && selectedPlannedGameSlot.blockId === blockId;

          // Check if planned game is ready to send to court
          const allSlotsFilled = block.playerIds.every(id => id !== null);
          const allPlayersInQueue = block.playerIds.every(id => {
            if (!id) return false;
            const status = playerStatus[id];
            return status?.location === 'queue';
          });

          // Check if priority court is completely empty (all 4 positions)
          const priorityCourtEmpty = priorityCourt && courts?.[priorityCourt]?.playerIds?.length === 0;

          const canSendToCourt = allSlotsFilled && allPlayersInQueue && priorityCourtEmpty;

          // Only increment priority counter and show priority flag if the planned game is complete
          let priorityNumber = null;
          if (allSlotsFilled) {
            visiblePriority++;
            priorityNumber = visiblePriority;
          }

          return (
            <motion.div
              key={blockId}
              layout="position"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`queue__block queue__block--planned-game ${isActivePlannedGame ? 'queue__block--active' : ''}`}
            >
              {isActivePlannedGame && (
                <div className="queue__block-priority-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              )}
              {priorityNumber && (
                <span className={`queue__priority-flag queue__priority-flag--${priorityNumber <= 2 ? priorityNumber : 'low'}`}>
                  Priority {priorityNumber}
                </span>
              )}
              <div className="queue__block-header">
                <div className="queue__block-title">
                  {getBlockLabel(block)}
                  {calculatingPositions[blockId] && (
                    <span style={{ fontSize: '11px', color: '#00bfff', marginLeft: '8px', fontStyle: 'italic' }}>
                      Calculating queue position...
                    </span>
                  )}
                </div>
                <button
                  className="queue__block-delete"
                  onClick={() => onDeletePlannedGame(blockId)}
                  type="button"
                  title="Delete planned game"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              <div className="queue__game">
                {/* Pair 1 */}
                <div className="queue__side queue__side--planned">
                  {[0, 1].map(slotIndex => {
                    const playerId = block.playerIds[slotIndex];
                    const player = playerId ? players[playerId] : null;
                    const isTargetSlot = selectedPlannedGameSlot &&
                      selectedPlannedGameSlot.blockId === blockId &&
                      selectedPlannedGameSlot.slotIndex === slotIndex;
                    const playerInGame = player && isInGame(player.playerNumber);

                    if (player) {
                      return (
                        <div
                          key={slotIndex}
                          className={`queue-player-card ${playerInGame ? 'queue-player-card--playing' : ''}`}
                          title={playerInGame ? 'Currently playing' : player.name}
                          style={{ cursor: 'default' }}
                        >
                          {/* <PlayerAvatar name={player.name} size={20} /> */}
                <span className="queue-player-card__name">{player.name}</span>
                        </div>
                      );
                    } else {
                      // Show ghost if this is the target slot and we have a hovered player
                      const showGhost = isTargetSlot && hoveredPlayer && !isInPlannedGame(hoveredPlayer.playerNumber);
                      const isClosedBlock = block.closed; // Block is closed/full, don't allow clicking empty slots

                      return (
                        <div
                          key={slotIndex}
                          className={`queue__planned-slot--empty ${isTargetSlot ? 'queue__planned-slot--target' : ''} ${showGhost ? 'queue__planned-slot--ghost' : ''}`}
                          onClick={() => !isClosedBlock && onSelectPlannedGameSlot(blockId, slotIndex)}
                          style={{ cursor: isClosedBlock ? 'default' : 'pointer' }}
                        >
                          <span className="queue__planned-slot-empty-text">
                            {showGhost ? (hoveredPlayer.name || `Player #${hoveredPlayer.playerNumber}`) : (isTargetSlot ? 'Click a player' : 'Empty')}
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>

                <div className="queue__vs">vs</div>

                {/* Pair 2 */}
                <div className="queue__side queue__side--planned">
                  {[2, 3].map(slotIndex => {
                    const playerId = block.playerIds[slotIndex];
                    const player = playerId ? players[playerId] : null;
                    const isTargetSlot = selectedPlannedGameSlot &&
                      selectedPlannedGameSlot.blockId === blockId &&
                      selectedPlannedGameSlot.slotIndex === slotIndex;
                    const playerInGame = player && isInGame(player.playerNumber);

                    if (player) {
                      return (
                        <div
                          key={slotIndex}
                          className={`queue-player-card ${playerInGame ? 'queue-player-card--playing' : ''}`}
                          title={playerInGame ? 'Currently playing' : player.name}
                          style={{ cursor: 'default' }}
                        >
                          {/* <PlayerAvatar name={player.name} size={20} /> */}
                <span className="queue-player-card__name">{player.name}</span>
                        </div>
                      );
                    } else {
                      // Show ghost if this is the target slot and we have a hovered player
                      const showGhost = isTargetSlot && hoveredPlayer && !isInPlannedGame(hoveredPlayer.playerNumber);
                      const isClosedBlock = block.closed; // Block is closed/full, don't allow clicking empty slots

                      return (
                        <div
                          key={slotIndex}
                          className={`queue__planned-slot--empty ${isTargetSlot ? 'queue__planned-slot--target' : ''} ${showGhost ? 'queue__planned-slot--ghost' : ''}`}
                          onClick={() => !isClosedBlock && onSelectPlannedGameSlot(blockId, slotIndex)}
                          style={{ cursor: isClosedBlock ? 'default' : 'pointer' }}
                        >
                          <span className="queue__planned-slot-empty-text">
                            {showGhost ? (hoveredPlayer.name || `Player #${hoveredPlayer.playerNumber}`) : (isTargetSlot ? 'Click a player' : 'Empty')}
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Send to Court button or status message */}
              {canSendToCourt && (
                <button
                  type="button"
                  className="queue__send-all-btn"
                  onClick={() => {
                    // Send all 4 players to the priority court in order
                    block.playerIds.forEach(playerId => {
                      if (playerId) {
                        onSendToCourt(playerId, priorityCourt);
                      }
                    });
                  }}
                  title={`Send all players to Court ${priorityCourt}`}
                >
                  <i className="fas fa-paper-plane"></i>
                  <span>Send to Court {priorityCourt}</span>
                </button>
              )}
              {allSlotsFilled && !canSendToCourt && (
                <div className="queue__planned-status">
                  {!allPlayersInQueue && (
                    <>
                      <i className="fas fa-hourglass-half"></i>
                      <span>Waiting for players to finish...</span>
                    </>
                  )}
                  {allPlayersInQueue && !priorityCourtEmpty && (
                    <>
                      <i className="fas fa-clock"></i>
                      <span>Waiting for court to be available...</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        }

        // Regular queue blocks
        const blockPlayers = block.playerIds
          .filter(id => !isInPlannedGame(id))
          .map(id => players[id])
          .filter(Boolean);

        if (blockPlayers.length === 0) return null;

        // For game_ended blocks, split winners and losers based on their status
        if (block.type === 'game_ended') {
          const winners = [];
          const losers = [];

          block.playerIds.forEach(id => {
            if (!isInPlannedGame(id)) {
              const player = players[id];
              const status = playerStatus[id];
              if (player) {
                if (status?.state === 'winner') {
                  winners.push(player);
                } else if (status?.state === 'loser') {
                  losers.push(player);
                }
              }
            }
          });

          // Only show VS and sections if both winners and losers exist
          const showVS = winners.length > 0 && losers.length > 0;

          // Don't render if both arrays are empty
          if (winners.length === 0 && losers.length === 0) {
            return null;
          }

          visiblePriority++; // Increment for this visible block
          const priorityNumber = visiblePriority;

          return (
            <motion.div
              key={blockId}
              layout="position"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="queue__block"
            >
              <Tutored show={visibleTips.queueBlocks && index === 0} side="left" direction="right" color="#ef4444" gap={80} label="Queue Priority">
                <span className={`queue__priority-flag queue__priority-flag--${priorityNumber <= 2 ? priorityNumber : 'low'}`}>
                  Priority {priorityNumber}
                </span>
              </Tutored>
              <div className="queue__block-header">
                <div className="queue__block-title">
                  {getBlockLabel(block)}
                </div>
                {block.timestamp && (
                  <span className="queue__block-time">
                    <TimeDisplay startTime={block.timestamp} format="ago" />
                  </span>
                )}
              </div>
              {showVS ? (
                <div className="queue__game">
                  {/* Winners */}
                  <div className="queue__side queue__side--winner">
                    <div className="queue__side-label">Winners</div>
                    {winners.map((player, playerIndex) => (
                      <div
                        key={player.playerNumber}
                        className={`queue-player-card ${isSelectionActive && (isInPlannedGame(player.playerNumber) || isInGame(player.playerNumber)) ? 'queue-player-card--dimmed' : ''}`}
                        onMouseEnter={() => onPlayerHover?.(player)}
                        onMouseLeave={() => onPlayerHover?.(null)}
                      >
                        {/* <PlayerAvatar name={player.name} size={20} /> */}
                        <span
                          className="queue-player-card__name"
                          onClick={() => handlePlayerClick(player.playerNumber)}
                          title={isSelectionActive && !isInPlannedGame(player.playerNumber) ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
                          style={{ cursor: (isSelectionActive && !isInPlannedGame(player.playerNumber)) || priorityCourt ? 'pointer' : 'default' }}
                        >
                          {player.name}
                        </span>
                        {!isSelectionActive && (
                          <button
                            type="button"
                            className="queue-player-card__action"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkPlayer(player.playerNumber);
                            }}
                            title="Mark as resting or left"
                          >
                            <Tutored show={visibleTips.restButton && index === 0 && playerIndex === 0} side="right" direction="left" color="#a78bfa" gap={10} label="Player Resting">
                              <i className="fa-solid fa-moon"></i>
                            </Tutored>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="queue__vs">vs</div>

                  {/* Losers */}
                  <div className="queue__side queue__side--loser">
                    <div className="queue__side-label">Losers</div>
                    {losers.map(player => (
                      <div
                        key={player.playerNumber}
                        className={`queue-player-card ${isSelectionActive && (isInPlannedGame(player.playerNumber) || isInGame(player.playerNumber)) ? 'queue-player-card--dimmed' : ''}`}
                        onMouseEnter={() => onPlayerHover?.(player)}
                        onMouseLeave={() => onPlayerHover?.(null)}
                      >
                        {/* <PlayerAvatar name={player.name} size={20} /> */}
                        <span
                          className="queue-player-card__name"
                          onClick={() => handlePlayerClick(player.playerNumber)}
                          title={isSelectionActive && !isInPlannedGame(player.playerNumber) ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
                          style={{ cursor: (isSelectionActive && !isInPlannedGame(player.playerNumber)) || priorityCourt ? 'pointer' : 'default' }}
                        >
                          {player.name}
                        </span>
                        {!isSelectionActive && (
                          <button
                            type="button"
                            className="queue-player-card__action"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkPlayer(player.playerNumber);
                            }}
                            title="Mark as resting or left"
                          >
                            <i className="fa-solid fa-moon"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="queue__game queue__game--single-side">
                  {winners.length > 0 && (
                    <div className="queue__side queue__side--winner">
                      <div className="queue__side-label">Winners</div>
                      {winners.map(player => (
                        <div
                          key={player.playerNumber}
                          className={`queue-player-card ${isSelectionActive && (isInPlannedGame(player.playerNumber) || isInGame(player.playerNumber)) ? 'queue-player-card--dimmed' : ''}`}
                          onMouseEnter={() => onPlayerHover?.(player)}
                          onMouseLeave={() => onPlayerHover?.(null)}
                        >
                          <span
                            className="queue-player-card__name"
                            onClick={() => handlePlayerClick(player.playerNumber)}
                            title={isSelectionActive && !isInPlannedGame(player.playerNumber) ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
                            style={{ cursor: (isSelectionActive && !isInPlannedGame(player.playerNumber)) || priorityCourt ? 'pointer' : 'default' }}
                          >
                            {player.name}
                          </span>
                          {!isSelectionActive && (
                            <button
                              type="button"
                              className="queue-player-card__action"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkPlayer(player.playerNumber);
                              }}
                              title="Mark as resting or left"
                            >
                              <i className="fa-solid fa-moon"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {losers.length > 0 && (
                    <div className="queue__side queue__side--loser">
                      <div className="queue__side-label">Losers</div>
                      {losers.map(player => (
                        <div
                          key={player.playerNumber}
                          className={`queue-player-card ${isSelectionActive && (isInPlannedGame(player.playerNumber) || isInGame(player.playerNumber)) ? 'queue-player-card--dimmed' : ''}`}
                          onMouseEnter={() => onPlayerHover?.(player)}
                          onMouseLeave={() => onPlayerHover?.(null)}
                        >
                          <span
                            className="queue-player-card__name"
                            onClick={() => handlePlayerClick(player.playerNumber)}
                            title={isSelectionActive && !isInPlannedGame(player.playerNumber) ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
                            style={{ cursor: (isSelectionActive && !isInPlannedGame(player.playerNumber)) || priorityCourt ? 'pointer' : 'default' }}
                          >
                            {player.name}
                          </span>
                          {!isSelectionActive && (
                            <button
                              type="button"
                              className="queue-player-card__action"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkPlayer(player.playerNumber);
                              }}
                              title="Mark as resting or left"
                            >
                              <i className="fa-solid fa-moon"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        }

        // Regular blocks (new_players, resting, returning_players)
        visiblePriority++; // Increment for this visible block
        const priorityNumber = visiblePriority;

        return (
          <Tutored
            key={blockId}
            show={(visibleTips.fillCourt || visibleTips.continueAdding) && index === 0}
            side="left"
            direction="right"
            color="#fbbf24"
            gap={80}
            label={visibleTips.fillCourt ? 'Add More Players!' : 'Keep Adding!'}
          >
            <motion.div
              layout="position"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="queue__block"
            >
            <span className={`queue__priority-flag queue__priority-flag--${priorityNumber <= 2 ? priorityNumber : 'low'}`}>
              Priority {priorityNumber}
            </span>
            <div className="queue__block-header">
              <div className="queue__block-title">
                {getBlockLabel(block)}
              </div>
              {block.timestamp && (
                <span className="queue__block-time">
                  <TimeDisplay startTime={block.timestamp} format="ago" />
                </span>
              )}
            </div>
            <div className="queue__game queue__game--single-side">
              <div className="queue__side queue__side--waiting">
                <div className="queue__side-label">
                  {block.type === 'new_players' ? 'Waiting to Play' : 'Players'}
                </div>
                {blockPlayers.map((player, playerIndex) => (
                  <Tutored key={player.playerNumber} show={visibleTips.assignFirst && index === 0 && playerIndex === 0} side="left" direction="right" color="#fbbf24" gap={80} label="Click Me">
                    <div
                      className="queue-player-card"
                      onMouseEnter={() => onPlayerHover?.(player)}
                      onMouseLeave={() => onPlayerHover?.(null)}
                    >
                      {/* <PlayerAvatar name={player.name} size={20} /> */}
                      <span
                        className="queue-player-card__name"
                        onClick={() => handlePlayerClick(player.playerNumber)}
                        title={isSelectionActive ? `Add ${player.name} to planned game` : priorityCourt ? `Send ${player.name} to Court ${priorityCourt}` : ''}
                        style={{ cursor: isSelectionActive || priorityCourt ? 'pointer' : 'default' }}
                      >
                        {player.name}
                      </span>
                    {!isSelectionActive && (
                      <button
                        type="button"
                        className="queue-player-card__action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkPlayer(player.playerNumber);
                        }}
                        title="Mark as resting or left"
                      >
                        <Tutored show={visibleTips.restButton && index === 0 && playerIndex === 0} side="right" direction="left" color="#a78bfa" gap={10}>
                          <i className="fa-solid fa-moon"></i>
                        </Tutored>
                      </button>
                    )}
                    </div>
                  </Tutored>
                ))}
              </div>
            </div>
            </motion.div>
          </Tutored>
        );
        });
      })()}
      </AnimatePresence>

      {/* Tutorial preview block */}
      {shouldShowPreviewBlock && (
        <Tutored show={visibleTips.declareWinner} side="left" direction="right" color="#ef4444" gap={80} label="Players move to back of queue">
          <div className="queue__preview-block help-pulse">
            <h3 className="queue__preview-title">
              Players will join the back of the queue here
            </h3>
            <div className="queue__preview-content">
              <div className="queue__preview-side">
                <span className="queue__preview-label">Winners</span>
                <div className="queue__preview-slots">
                  <div className="queue__preview-slot"></div>
                  <div className="queue__preview-slot"></div>
                </div>
              </div>
              <div className="queue__preview-vs">vs</div>
              <div className="queue__preview-side">
                <span className="queue__preview-label">Losers</span>
                <div className="queue__preview-slots">
                  <div className="queue__preview-slot"></div>
                  <div className="queue__preview-slot"></div>
                </div>
              </div>
            </div>
          </div>
        </Tutored>
      )}

      {/* Empty state */}
      {unassignedPlayers.length === 0 && queueBlockOrder.length === 0 && (
        <div className="queue-empty">
          <p>No players in queue</p>
          <p className="queue-empty__hint">Add players or finish games to populate the queue</p>
        </div>
      )}
    </div>
  );
};

export default QueueArea;