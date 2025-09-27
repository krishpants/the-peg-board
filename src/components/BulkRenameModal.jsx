import React, { useState, useEffect, useRef } from 'react';

const BulkRenameModal = ({ open, players, onSave, onClose }) => {
  const [names, setNames] = useState({});
  const firstInputRef = useRef(null);

  // Array of fake testing names with variety
  const fakeNames = [
    "Jamela K",
    "🔥 FLAMO",
    "Billy 2",
    "KC_2239",
    "Peter",
    "Victor (D)",
    "Sarah Chen",
    "Mike 🎾",
    "Alex Pro",
    "Jordan_99",
    "Emma W",
    "Ryan (C)",
    "Lisa Park",
    "Tom Swift",
    "Nina 💪",
    "Dave_123",
    "Sophie R",
    "Chris Lee",
    "Maya (B)",
    "Jake ⭐",
    "Zara Khan",
    "Oliver Q",
    "Lucy_88",
    "Sam (A)",
    "Rachel Z",
    "Max Power",
    "Ava Singh",
    "Leo 🏸",
    "Grace Liu",
    "Ben_007",
    "Kyle XL",
    "Tina 🌟",
    "Hassan M",
    "Jenny_42",
    "Rick (S)",
    "Diana Pro",
    "Felix 🚀",
    "Amy Zhang",
    "Carlos_99",
    "Mia (K)",
    "Nathan!",
    "Priya 💫",
    "Oscar.B",
    "Ruby Chen",
    "Ian_2024",
    "Bella (J)",
    "Marcus 🎯",
    "Zoe Park",
    "Dylan_X",
    "Eva Miller",
    "Raj Kumar",
    "Luna 🌙",
    "Tony_888"
  ];

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

  const handleFillWithFakeNames = () => {
    if (!players) return;

    const newNames = {};
    const shuffled = [...fakeNames].sort(() => Math.random() - 0.5);
    const sortedPlayersList = [...players].sort((a, b) => a.playerNumber - b.playerNumber);

    sortedPlayersList.forEach((player, index) => {
      // Use modulo to cycle through names if we have more players than fake names
      newNames[player.playerNumber] = shuffled[index % shuffled.length];
    });

    setNames(newNames);
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
        <div className="modal__header">
          <h3 className="modal__title">Rename Players</h3>
          <button
            type="button"
            onClick={handleFillWithFakeNames}
            className="modal__header-btn"
            title="Fill with random names for testing"
          >
            <i className="fas fa-flask"></i>
            <span>Test with Random Names</span>
          </button>
        </div>

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