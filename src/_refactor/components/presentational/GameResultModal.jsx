import React, { useState } from 'react';

const GameResultModal = ({
  isOpen,
  courtNumber,
  pairing,
  players,
  onConfirm,
  onCancel
}) => {
  const [winningPairIndex, setWinningPairIndex] = useState(null);

  if (!isOpen || !pairing) return null;

  // Helper to get player object
  const getPlayer = (playerId) => players[playerId];

  const handleSubmit = () => {
    if (winningPairIndex !== null) {
      const winningPair = winningPairIndex === 1 ? pairing.pair1 : pairing.pair2;
      const losingPair = winningPairIndex === 1 ? pairing.pair2 : pairing.pair1;
      onConfirm(winningPair, losingPair);
      setWinningPairIndex(null); // Reset for next time
    }
  };

  const renderPair = (pairIds, pairNumber) => {
    return (
      <div
        className={`game-result-modal__pair ${
          winningPairIndex === pairNumber ? 'game-result-modal__pair--selected' : ''
        }`}
        onClick={() => setWinningPairIndex(pairNumber)}
      >
        <div className="game-result-modal__pair-label">
          {winningPairIndex === pairNumber ? 'WINNERS' : `Pair ${pairNumber}`}
        </div>
        {pairIds.map(playerId => {
          const player = getPlayer(playerId);
          return player ? (
            <div key={playerId} className="game-result-modal__player">
              <span className="game-result-modal__player-number">{player.playerNumber}</span>
              <span className="game-result-modal__player-name">{player.name}</span>
            </div>
          ) : null;
        })}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal game-result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Court {courtNumber} - Game Result</h2>
        </div>

        <div className="modal__body">
          <p className="game-result-modal__instruction">
            Click the winning pair:
          </p>

          <div className="game-result-modal__pairs">
            {renderPair(pairing.pair1, 1)}
            <div className="game-result-modal__vs">VS</div>
            {renderPair(pairing.pair2, 2)}
          </div>
        </div>

        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--save"
            onClick={handleSubmit}
            disabled={winningPairIndex === null}
          >
            Confirm Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultModal;