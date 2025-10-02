import React from 'react';

const RestorePlayersModal = ({ isOpen, restingPlayers, leftPlayers, onRestore, onCancel }) => {
  if (!isOpen) return null;

  const hasPlayers = restingPlayers.length > 0 || leftPlayers.length > 0;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Restore Players</h3>
        </div>
        <div className="modal-body">
          {!hasPlayers ? (
            <p>No players to restore</p>
          ) : (
            <>
              {restingPlayers.length > 0 && (
                <div className="restore-section">
                  <h4><i className="fa-solid fa-moon"></i> Resting Players</h4>
                  <div className="restore-player-list">
                    {restingPlayers.map(player => (
                      <button
                        key={player.playerNumber}
                        type="button"
                        className="restore-player-item"
                        onClick={() => onRestore(player.playerNumber)}
                      >
                        <span>{player.name || `Player #${player.playerNumber}`}</span>
                        <i className="fas fa-undo"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {leftPlayers.length > 0 && (
                <div className="restore-section">
                  <h4><i className="fas fa-door-open"></i> Left Players</h4>
                  <div className="restore-player-list">
                    {leftPlayers.map(player => (
                      <button
                        key={player.playerNumber}
                        type="button"
                        className="restore-player-item"
                        onClick={() => onRestore(player.playerNumber)}
                      >
                        <span>{player.name || `Player #${player.playerNumber}`}</span>
                        <i className="fas fa-undo"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn--secondary"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestorePlayersModal;