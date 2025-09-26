import React, { useEffect, useRef, useState } from 'react';

const NameModal = ({ open, playerNumber, initialName = '', onSave, onClose }) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(initialName || '');
      // focus and select all text after mount
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [open, initialName]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave(name.trim());
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal">
        <h3 className="modal__title">
          Edit name for <span className="modal__player-number">#{playerNumber}</span>
        </h3>
        <form onSubmit={submit} className="modal__form">
          <input
            ref={inputRef}
            type="text"
            className="modal__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type name and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <div className="modal__actions">
            <button type="button" onClick={onClose} className="modal__btn modal__btn--cancel">
              Cancel
            </button>
            <button type="submit" className="modal__btn modal__btn--save">
              Save
            </button>
          </div>
        </form>
        <p className="modal__tip">
          Tip: Press <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
};

export default NameModal;
