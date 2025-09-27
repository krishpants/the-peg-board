import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const QueuePlayerCard = ({
  player,
  onPlayerClick,
  onAssignCourt,
  courtCount,
  courtOccupancy = [],
  priorityCourtNum = null,
  showOnlyPriority = false,
  onHover = null,
  shouldPulse = false,
  shouldPulseBenchButton = false
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignCourt = (playerNumber, courtNumber) => {
    if (isAssigning) return;

    setIsAssigning(true);
    onAssignCourt(playerNumber, courtNumber);

    // Reset after animation completes
    setTimeout(() => setIsAssigning(false), 500);
  };

  // Check if any court has space
  const hasAvailableSpace = courtOccupancy.some((occupancy, idx) => (occupancy ?? 0) < 4);

  return (
    <motion.div
      className={`queue-player-card ${shouldPulse ? 'help-pulse' : ''} ${!hasAvailableSpace ? 'queue-player-card--no-space' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        scale: 0.8,
        x: 50,
        transition: {
          duration: 0.3,
          ease: "easeOut"
        }
      }}
      layout
      transition={{
        layout: {
          type: "spring",
          stiffness: 700,
          damping: 30,
          mass: 0.8
        },
        opacity: {
          duration: 0.2
        }
      }}
      onClick={() => {
        if (priorityCourtNum && showOnlyPriority) {
          handleAssignCourt(player.playerNumber, priorityCourtNum);
        }
      }}
      onMouseEnter={() => {
        if (priorityCourtNum && showOnlyPriority && onHover) {
          onHover(player, priorityCourtNum);
        }
      }}
      onMouseLeave={() => {
        if (onHover) {
          onHover(null, null);
        }
      }}
      style={{ cursor: priorityCourtNum && showOnlyPriority ? 'pointer' : 'default' }}
    >
      <div className="queue-player-card__content">
        <span className="queue-player-card__name">
          {player.playerName || `Player #${player.playerNumber}`}
        </span>
      </div>

      <button
        type="button"
        className={`queue-player-card__options-btn ${shouldPulseBenchButton ? 'help-pulse' : ''}`}
        title="Player options"
        onClick={(e) => {
          e.stopPropagation();
          onPlayerClick?.(player);
        }}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {!showOnlyPriority && (
        <div className="queue-player-card__action">
          {Array.from({ length: courtCount }).map((_, idx) => {
            const num = idx + 1;
            const isFull = (courtOccupancy[idx] ?? 0) >= 4;
            const isPriority = !isFull && priorityCourtNum === num;

            return (
              <motion.button
                key={`court-${num}`}
                type="button"
                className={`queue-btn queue-btn--court ${isPriority ? 'queue-btn--priority' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignCourt(player.playerNumber, num);
                }}
                disabled={isFull || isAssigning}
                title={
                  isFull
                    ? 'Court is full (4 players)'
                    : isPriority
                    ? `Suggested: Court ${num}`
                    : `Send to Court ${num}`
                }
                whileHover={{ scale: isFull || isAssigning ? 1 : 1.05 }}
                whileTap={{ scale: isFull || isAssigning ? 1 : 0.95 }}
                style={{ opacity: isAssigning ? 0.6 : 1 }}
              >
                {num}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default QueuePlayerCard;