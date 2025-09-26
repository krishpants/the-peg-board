import React from 'react';

const BenchModal = ({ open, player, onSetStatus, onClose }) => {
  if (!open || !player) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSetResting = () => {
    onSetStatus(player, 'resting');
    onClose();
  };

  const handleSetLeft = () => {
    onSetStatus(player, 'left');
    onClose();
  };

  const handleSetReady = () => {
    onSetStatus(player, 'ready');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Check if player is already benched
  const isResting = player.lastState === 'resting';
  const isLeft = player.lastState === 'left';
  const isBenched = isResting || isLeft;

  return (
    <div
      className="modal-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal modal--bench">
        <h3 className="modal__title">
          Player Status
        </h3>

        <div className="bench__player">
          <span className="bench__label">
            {isBenched ? (isResting ? 'Resting Player:' : 'Player who left:') : 'Selected Player:'}
          </span>
          <div className="bench__player-card">
            {isBenched && (
              <i className={`fas ${isResting ? 'fa-pause-circle' : 'fa-sign-out-alt'}`}></i>
            )}
            {player.playerName || `Player #${player.playerNumber}`}
          </div>
        </div>

        <div className="bench__actions">
          {isBenched ? (
            <>
              <button
                type="button"
                className="bench__action-btn bench__action-btn--ready"
                onClick={handleSetReady}
              >
                <i className="fas fa-undo"></i>
                <span>Ready to Play</span>
                <small>Return player to active queue</small>
              </button>

              {isResting && (
                <button
                  type="button"
                  className="bench__action-btn bench__action-btn--left"
                  onClick={handleSetLeft}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Mark as Left</span>
                  <small>Player has left the session</small>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="bench__action-btn bench__action-btn--resting"
                onClick={handleSetResting}
              >
                <i className="fas fa-pause-circle"></i>
                <span>Set as Resting</span>
                <small>Player is taking a break but will return</small>
              </button>

              <button
                type="button"
                className="bench__action-btn bench__action-btn--left"
                onClick={handleSetLeft}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Set as Left Session</span>
                <small>Player has left and won't return</small>
              </button>
            </>
          )}
        </div>

        <div className="modal__actions">
          <button type="button" onClick={handleCancel} className="modal__btn modal__btn--cancel">
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

export default BenchModal;