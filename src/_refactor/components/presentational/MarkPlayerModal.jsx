import React from 'react';

const MarkPlayerModal = ({ isOpen, player, onMarkAsLeft, onMarkAsResting, onCancel }) => {
  if (!isOpen || !player) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="modal-overlay" onClick={onBackdrop}>
      <div className="modal-content modal-content--bench" onClick={(e) => e.stopPropagation()}>
        <div className="bench__player">
          <div className="bench__player-card">
            {player.name || `Player #${player.playerNumber}`}
          </div>
        </div>

        <div className="bench__actions">
          <button
            type="button"
            className="bench__action-btn bench__action-btn--resting"
            onClick={() => onMarkAsResting(player.playerNumber)}
          >
            <i className="fa-solid fa-moon"></i>
            <span>Resting</span>
            <small>Player is taking a break</small>
          </button>
          <button
            type="button"
            className="bench__action-btn bench__action-btn--left"
            onClick={() => onMarkAsLeft(player.playerNumber)}
          >
            <i className="fas fa-door-open"></i>
            <span>Left</span>
            <small>Player has left the session</small>
          </button>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn modal-btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        <p className="modal__tip">
          Press <kbd>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
};

export default MarkPlayerModal;