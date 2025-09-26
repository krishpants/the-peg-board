import React from 'react';
import { motion } from 'framer-motion';

const QueuePlayerCard = ({
  player,
  onPlayerClick,
  onAssignCourt,
  courtCount,
  courtOccupancy = [],
  priorityCourtNum = null,
  showOnlyPriority = false
}) => {
  const [isAssigning, setIsAssigning] = React.useState(false);

  const handleAssignCourt = (playerNumber, courtNumber) => {
    if (isAssigning) return;

    setIsAssigning(true);
    onAssignCourt(playerNumber, courtNumber);

    // Reset after animation completes
    setTimeout(() => setIsAssigning(false), 500);
  };
  return (
    <motion.div
      className="queue-player-card"
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
    >
      <button
        type="button"
        className="queue-player-card__name-button"
        title="Player options"
        onClick={() => onPlayerClick?.(player)}
      >
        {player.playerName || `Player #${player.playerNumber}`}
      </button>

      <div className="queue-player-card__action">
        {showOnlyPriority ? (
          priorityCourtNum ? (
            // Show select button when court available
            <motion.button
              type="button"
              className="queue-btn queue-btn--court queue-btn--priority"
              onClick={() => handleAssignCourt(player.playerNumber, priorityCourtNum)}
              title={`Send to Court ${priorityCourtNum}`}
              whileHover={{ scale: isAssigning ? 1 : 1.05 }}
              whileTap={{ scale: isAssigning ? 1 : 0.95 }}
              disabled={isAssigning}
              style={{ opacity: isAssigning ? 0.6 : 1 }}
            >
              ← Court {priorityCourtNum}
            </motion.button>
          ) : (
            // Show waiting message when no courts available
            <span className="queue-player-card__waiting">Waiting</span>
          )
        ) : (
          // Show all court buttons (fallback)
          Array.from({ length: courtCount }).map((_, idx) => {
            const num = idx + 1;
            const isFull = (courtOccupancy[idx] ?? 0) >= 4;
            const isPriority = !isFull && priorityCourtNum === num;

            return (
              <motion.button
                key={`court-${num}`}
                type="button"
                className={`queue-btn queue-btn--court ${isPriority ? 'queue-btn--priority' : ''}`}
                onClick={() => handleAssignCourt(player.playerNumber, num)}
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
                {num} →
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default QueuePlayerCard;