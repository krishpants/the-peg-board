import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BenchedPlayers = ({ restingPlayers = [], leftPlayers = [], onBringBack }) => {
  if (restingPlayers.length === 0 && leftPlayers.length === 0) {
    return null;
  }

  return (
    <div className="benched-players">
      {restingPlayers.length > 0 && (
        <div className="benched-players__section benched-players__section--resting">
          <h3 className="benched-players__title">
            <i className="fas fa-pause-circle"></i>
            Resting Players
          </h3>
          <div className="benched-players__grid">
            <AnimatePresence>
              {restingPlayers.map((player) => (
                <motion.div
                  key={player.playerNumber}
                  className="benched-players__card benched-players__card--resting"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <span className="benched-players__name">
                    {player.playerName || `Player #${player.playerNumber}`}
                  </span>
                  <button
                    type="button"
                    className="benched-players__return-btn"
                    onClick={() => onBringBack(player)}
                    title="Bring back to queue"
                  >
                    <i className="fas fa-undo"></i>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {leftPlayers.length > 0 && (
        <div className="benched-players__section benched-players__section--left">
          <h3 className="benched-players__title">
            <i className="fas fa-sign-out-alt"></i>
            Left Session
          </h3>
          <div className="benched-players__grid">
            <AnimatePresence>
              {leftPlayers.map((player) => (
                <motion.div
                  key={player.playerNumber}
                  className="benched-players__card benched-players__card--left"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <span className="benched-players__name">
                    {player.playerName || `Player #${player.playerNumber}`}
                  </span>
                  <button
                    type="button"
                    className="benched-players__return-btn"
                    onClick={() => onBringBack(player)}
                    title="Bring back to queue"
                  >
                    <i className="fas fa-undo"></i>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchedPlayers;