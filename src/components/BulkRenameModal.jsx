import React, { useState, useEffect, useRef } from 'react';

const BulkRenameModal = ({ open, players, onSave, onClose }) => {
  const [names, setNames] = useState({});
  const firstInputRef = useRef(null);

  // Initialize names when modal opens or players change
  useEffect(() => {
    if (open && players) {
      const initialNames = {};
      players.forEach(player => {
        initialNames[player.playerNumber] = player.playerName || '';
      });
      setNames(initialNames);

      // Focus and select first input after mount
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
          firstInputRef.current.select();
        }
      }, 0);
    }
  }, [open, players]);

  const handleNameChange = (playerNumber, value) => {
    setNames(prev => ({
      ...prev,
      [playerNumber]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(names);
    onClose();
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  // Sort players by player number for consistent display
  const sortedPlayers = [...players].sort((a, b) => a.playerNumber - b.playerNumber);

  return (
    <div
      className="modal-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal modal--bulk-rename">
        <h3 className="modal__title">Rename All Players</h3>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="modal__bulk-grid">
            {sortedPlayers.map((player, index) => {
              const isDefaultName = !names[player.playerNumber] ||
                                   names[player.playerNumber] === `Player #${player.playerNumber}` ||
                                   names[player.playerNumber].trim() === '';

              return (
                <input
                  key={player.playerNumber}
                  ref={index === 0 ? firstInputRef : null}
                  type="text"
                  className={`modal__input modal__input--bulk ${isDefaultName ? 'modal__input--default' : ''}`}
                  value={names[player.playerNumber] || ''}
                  onChange={(e) => handleNameChange(player.playerNumber, e.target.value)}
                  placeholder={`Player #${player.playerNumber}`}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                  }}
                />
              );
            })}
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="modal__btn modal__btn--cancel">
              Cancel
            </button>
            <button type="submit" className="modal__btn modal__btn--save">
              Save All Names
            </button>
          </div>
        </form>

        <p className="modal__tip">
          Tip: Press <kbd>Tab</kbd> to move between fields, <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
};

export default BulkRenameModal;