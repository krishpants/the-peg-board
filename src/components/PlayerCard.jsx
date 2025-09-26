import React from 'react';
import { motion } from 'framer-motion';

const PlayerCard = ({ 
  player, 
  onEditName,
  onPlayerClick,
  showQueueButtons = false,
  isWaitingForPlayers = false,
  pairNumber = null,
  isInClickOrder = false,
  isClickable = false,
  additionalActions = null 
}) => {
  const getCardClasses = () => {
    let classes = ['player-card'];
    
    if (isWaitingForPlayers) classes.push('player-card--waiting');
    if (pairNumber) classes.push(`player-card--pair-${pairNumber}`);
    if (isInClickOrder) classes.push('player-card--clicked');
    if (isClickable) classes.push('player-card--clickable');
    
    return classes.join(' ');
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      className={getCardClasses()}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <button
        type="button"
        className="player-card__name-button"
        title={isClickable ? "Click to set pairing" : "Edit name"}
        onClick={() => {
          if (isClickable && onPlayerClick) {
            onPlayerClick(player);
          } else {
            onEditName?.(player.playerNumber, player.playerName);
          }
        }}
      >
        {player.playerName || `Player #${player.playerNumber}`}
      </button>

      {isWaitingForPlayers && (
        <span className="player-card__status">Waiting</span>
      )}
      
      {pairNumber && (
        <span className={`player-card__pair-badge player-card__pair-badge--${pairNumber}`}>
          Pair {pairNumber}
        </span>
      )}

      <div className="player-card__actions">
        {showQueueButtons && (
          <button 
            type="button" 
            className="queue-btn winner" 
            onClick={() => {}}
          >
            Winner
          </button>
        )}
        {additionalActions}
      </div>
    </motion.div>
  );
};

export default PlayerCard;