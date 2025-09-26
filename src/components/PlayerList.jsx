import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlayerCard from './PlayerCard';

const PlayerList = ({ 
  players, 
  onPlayerClick, 
  onEditName, 
  isWaitingForPlayers, 
  isPlaying, 
  showQueueButtons = false,
  clickOrder = [],
  currentPairing = null
}) => {
  if (players.length === 0) {
    return <div className="player-list player-list--empty">No players</div>;
  }

  // Determine which pair each player belongs to
  const getPlayerPairInfo = (player) => {
    if (!currentPairing) return null;
    
    const inPair1 = currentPairing.pair1.some(p => p.playerNumber === player.playerNumber);
    const inPair2 = currentPairing.pair2.some(p => p.playerNumber === player.playerNumber);
    
    return {
      pairNumber: inPair1 ? 1 : inPair2 ? 2 : null,
      isInClickOrder: clickOrder.some(p => p.playerNumber === player.playerNumber)
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="player-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {players.map((player) => {
          const pairInfo = getPlayerPairInfo(player);
          
          return (
            <PlayerCard
              key={player.playerNumber}
              player={player}
              onEditName={onEditName}
              onPlayerClick={isPlaying ? onPlayerClick : undefined}
              showQueueButtons={showQueueButtons}
              isWaitingForPlayers={isWaitingForPlayers}
              pairNumber={pairInfo?.pairNumber}
              isInClickOrder={pairInfo?.isInClickOrder}
              isClickable={isPlaying && clickOrder.length < 2}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlayerList;
