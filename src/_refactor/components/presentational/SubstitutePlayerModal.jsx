import React from 'react';

const SubstitutePlayerModal = ({
  isOpen,
  player,
  courtNumber,
  availablePlayers,
  onSubstitute,
  onCancel
}) => {
  if (!isOpen || !player) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="modal-overlay" onClick={onBackdrop}>
      <div className="modal-content modal-content--substitution" onClick={(e) => e.stopPropagation()}>
        <div className="substitution__current">
          <div className="substitution__player-card">
            Substitute {player.name || `Player #${player.playerNumber}`}
          </div>
        </div>

        <div className="substitution__divider">
          <i className="fas fa-exchange-alt"></i>
        </div>

        <div className="substitution__available">
          <span className="substitution__label">Available from Queue:</span>

          {availablePlayers.length === 0 ? (
            <div className="substitution__empty">
              No players available in queue
            </div>
          ) : (
            <div className="substitution__grid">
              {availablePlayers.map((availablePlayer) => (
                <button
                  key={availablePlayer.playerNumber}
                  type="button"
                  className="substitution__option"
                  onClick={() => onSubstitute(player.playerNumber, availablePlayer.playerNumber, courtNumber)}
                >
                  <span className="substitution__option-name">
                    {availablePlayer.name || `Player #${availablePlayer.playerNumber}`}
                  </span>
                </button>
              ))}
            </div>
          )}
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
          Click a player to substitute them in. Press <kbd>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
};

export default SubstitutePlayerModal;