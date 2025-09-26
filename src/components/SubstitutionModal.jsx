import React from 'react';

const SubstitutionModal = ({ open, player, queuedPlayers, onSubstitute, onClose }) => {
  if (!open || !player) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubstitute = (queuedPlayer) => {
    onSubstitute(player, queuedPlayer);
    onClose();
  };

  // Get all available players from queue blocks, excluding resting and left players
  const availablePlayers = (queuedPlayers || []).filter(
    p => p.lastState !== 'resting' && p.lastState !== 'left'
  );

  return (
    <div
      className="modal-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal modal--substitution">
        <h3 className="modal__title">
          Substitute Player
        </h3>

        <div className="substitution__current">
          <span className="substitution__label">Currently Playing:</span>
          <div className="substitution__player-card">
            {player.playerName || `Player #${player.playerNumber}`}
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
              {availablePlayers.map((queuedPlayer) => (
                <button
                  key={queuedPlayer.playerNumber}
                  type="button"
                  className="substitution__option"
                  onClick={() => handleSubstitute(queuedPlayer)}
                >
                  <span className="substitution__option-name">
                    {queuedPlayer.playerName || `Player #${queuedPlayer.playerNumber}`}
                  </span>
                  {queuedPlayer.lastState && (
                    <span className={`substitution__option-state substitution__option-state--${queuedPlayer.lastState}`}>
                      {queuedPlayer.lastState === 'winner' ? 'W' :
                       queuedPlayer.lastState === 'loser' ? 'L' :
                       queuedPlayer.lastState === 'ready' ? 'R' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button type="button" onClick={onClose} className="modal__btn modal__btn--cancel">
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

export default SubstitutionModal;