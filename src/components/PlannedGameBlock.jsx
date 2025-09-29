import React from 'react';
import { motion } from 'framer-motion';
import QueuePlayerCard from './QueuePlayerCard';

const PlannedGameBlock = ({
  plannedGame,
  blocks,
  players,
  courtCount,
  courtOccupancy,
  priorityCourtNum,
  onAssignCourt,
  onPlayerClick,
  onPlayerHover,
  onUpdateSlot,
  onClearGame,
  onRemoveGame,
  selectedSlot,
  onSelectSlot,
  statusMessage,
  priority
}) => {
  // Determine which players are currently playing
  const getPlayerStatus = (player) => {
    if (!player) return null;

    const isPlaying = players.some(p =>
      p.playerNumber === player.playerNumber && p.onCourt
    );

    return {
      isPlaying,
      player
    };
  };

  return (
    <motion.div
      className={`planned-game-block ${priority === 'low' ? 'planned-game-block--low-priority' : ''}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="planned-game-block__header">
        <div className="planned-game-block__title">
          <i className="fas fa-clipboard-list"></i>
          <span>Planned Game</span>
        </div>
        <div className="planned-game-block__actions">
          <button
            type="button"
            className="planned-game-block__clear"
            onClick={() => onClearGame(plannedGame.id)}
            title="Clear all players"
          >
            <i className="fas fa-eraser"></i>
            Clear
          </button>
          <button
            type="button"
            className="planned-game-block__remove"
            onClick={() => onRemoveGame(plannedGame.id)}
            title="Delete this planned game"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="planned-game-block__status">
          {statusMessage}
        </div>
      )}

      <div className="planned-game-block__slots">
        {plannedGame.slots.map((slot, index) => {
          const playerStatus = getPlayerStatus(slot);
          const isSelected = selectedSlot === `${plannedGame.id}-${index}`;

          if (!slot) {
            // Empty slot
            return (
              <div
                key={index}
                className={`planned-game-block__empty-slot ${isSelected ? 'planned-game-block__empty-slot--selected' : ''}`}
                onClick={() => onSelectSlot(`${plannedGame.id}-${index}`)}
                style={{ marginBottom: 8 }}
              >
                <span>Empty</span>
              </div>
            );
          }

          // Find the block this player belongs to for court assignment
          const playerBlock = blocks.find(block =>
            block.players.some(p => p.playerNumber === slot.playerNumber)
          );

          return (
            <div
              key={index}
              className={`planned-game-block__player-slot ${playerStatus.isPlaying ? 'planned-game-block__player-slot--playing' : ''}`}
              style={{ marginBottom: 8 }}
            >
              <QueuePlayerCard
                player={slot}
                onPlayerClick={() => onUpdateSlot(plannedGame.id, index, null)} // Click to remove
                onAssignCourt={(playerNumber, courtNumber) => {
                  if (playerBlock && !playerStatus.isPlaying) {
                    onAssignCourt(playerBlock.id, playerNumber, courtNumber);
                  }
                }}
                courtCount={courtCount}
                courtOccupancy={courtOccupancy}
                priorityCourtNum={!playerStatus.isPlaying ? priorityCourtNum : null}
                showOnlyPriority={false}
                onHover={onPlayerHover}
                shouldPulse={false}
                shouldPulseBenchButton={false}
              />
              {playerStatus.isPlaying && (
                <span className="planned-game-block__playing-indicator">
                  <i className="fas fa-play-circle"></i>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PlannedGameBlock;