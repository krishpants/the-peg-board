import React, { useState, useRef, useEffect } from 'react';

const QueuePlayerCard = ({
  player,
  onPlayerClick,
  onPlayerOptions,
  onAssignCourt,
  courtCount,
  courtOccupancy = [],
  priorityCourtNum = null,
  showOnlyPriority = false,
  onHover = null,
  shouldPulse = false,
  shouldPulseBenchButton = false,
  nextGamePlayers = []
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
  // Check if all courts are full
  const allCourtsFull = courtOccupancy.length > 0 && courtOccupancy.every(n => n === 4);
  // Check if Next Game has space
  const nextGameHasSpace = nextGamePlayers.length < 4;

  return (
    <div
      className={`queue-player-card ${shouldPulse ? 'help-pulse' : ''} ${priorityCourtNum && showOnlyPriority ? 'queue-player-card--priority' : ''} ${!priorityCourtNum && nextGameHasSpace ? 'queue-player-card--next-game' : ''}`}
      style={{
        marginBottom: 8,
        cursor: (priorityCourtNum && showOnlyPriority) || (!priorityCourtNum && nextGameHasSpace) ? 'pointer' : 'default'
      }}
      onClick={() => {
        if (priorityCourtNum && showOnlyPriority) {
          handleAssignCourt(player.playerNumber, priorityCourtNum);
        } else if (!priorityCourtNum && nextGameHasSpace) {
          onPlayerClick?.(player);
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
          onPlayerOptions?.(player);
        }}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {!showOnlyPriority && !allCourtsFull && (
        <div className="queue-player-card__action">
          {Array.from({ length: courtCount }).map((_, idx) => {
            const num = idx + 1;
            const isFull = (courtOccupancy[idx] ?? 0) >= 4;
            const isPriority = !isFull && priorityCourtNum === num;

            return (
              <button
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
                style={{ opacity: isAssigning ? 0.6 : 1 }}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QueuePlayerCard;