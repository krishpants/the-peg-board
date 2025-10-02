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
  isAvailableForPlannedGame = false
}) => {

  return (
    <div
      className={`queue-player-card ${shouldPulse ? 'help-pulse' : ''} ${priorityCourtNum && showOnlyPriority ? 'queue-player-card--priority' : ''} ${isAvailableForPlannedGame ? 'queue-player-card--available' : ''}`}
      style={{
        marginBottom: 8,
        cursor: (priorityCourtNum && showOnlyPriority) || onPlayerClick || isAvailableForPlannedGame ? 'pointer' : 'default'
      }}
      onClick={() => {
        if (isAvailableForPlannedGame && onPlayerClick) {
          // When selecting for planned game, always use the click handler
          onPlayerClick(player);
        } else if (priorityCourtNum && showOnlyPriority && onAssignCourt) {
          onAssignCourt(player.playerNumber, priorityCourtNum);
        } else if (onPlayerClick) {
          onPlayerClick(player);
        }
      }}
      onMouseEnter={() => {
        if (!isAvailableForPlannedGame && priorityCourtNum && showOnlyPriority && onHover) {
          onHover(player, priorityCourtNum);
        }
      }}
      onMouseLeave={() => {
        if (!isAvailableForPlannedGame && onHover) {
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

    </div>
  );
};

export default QueuePlayerCard;