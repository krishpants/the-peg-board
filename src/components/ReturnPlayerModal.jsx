import React from 'react';

const ReturnPlayerModal = ({ open, player, onReturn, onClose }) => {
  if (!open || !player) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleReturn = () => {
    onReturn(player);
    onClose();
  };

  const isResting = player.lastState === 'resting';
  const isLeft = player.lastState === 'left';

  return (
    <div
      className="modal-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal modal--return">
        <h3 className="modal__title">
          Return Player to Queue
        </h3>

        <div className="return__player">
          <span className="return__label">
            {isResting ? 'Resting Player:' : 'Player who left:'}
          </span>
          <div className="return__player-card">
            <i className={`fas ${isResting ? 'fa-pause-circle' : 'fa-sign-out-alt'}`}></i>
            {player.playerName || `Player #${player.playerNumber}`}
          </div>
        </div>

        <div className="return__message">
          {isResting
            ? 'This player is currently resting. Return them to the active queue?'
            : 'This player had left the session. Return them to the active queue?'
          }
        </div>

        <div className="modal__actions">
          <button type="button" onClick={onClose} className="modal__btn modal__btn--cancel">
            Cancel
          </button>
          <button type="button" onClick={handleReturn} className="modal__btn modal__btn--save">
            <i className="fas fa-undo"></i>
            Return to Queue
          </button>
        </div>

        <p className="modal__tip">
          Press <kbd>Enter</kbd> to return or <kbd>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
};

export default ReturnPlayerModal;