import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QueuePlayerCard from './QueuePlayerCard';

const labelForCourt = (n) => {
  if (n === 0) return 'Warmup';
  if (n === -1) return 'New Arrivals';
  if (n === -2) return 'Substituted';
  return `Court ${n}`;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
};

const QueueBlock = ({
  block,
  courtCount,
  courtOccupancy,
  priorityCourtNum,
  onAssignCourt,
  onPlayerClick,
  onPlayerHover,
  shouldHighlight,
  shouldHighlightEntireBlock,
  shouldHighlightBenchButton,
  allCourtsFull,
  onAddToNextGame,
  nextGamePlayers = [],
  isSelectingForPlannedGame = false,
  playersInPlannedGames = []
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  // Update time display every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(formatTimeAgo(block.timestamp));
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [block.timestamp]);

  // Filter out players that are in planned games
  const plannedGamePlayerNumbers = playersInPlannedGames.map(p => p.playerNumber);
  const visiblePlayers = block.players.filter(p => !plannedGamePlayerNumbers.includes(p.playerNumber));

  const winners = visiblePlayers.filter(p => p.lastState === 'winner');
  const losers = visiblePlayers.filter(p => p.lastState === 'loser');
  const readyPlayers = visiblePlayers.filter(p => p.lastState === 'ready');
  const waitingPlayers = visiblePlayers.filter(p => p.lastState === 'waiting');
  const restingPlayers = visiblePlayers.filter(p => p.lastState === 'resting');
  const leftPlayers = visiblePlayers.filter(p => p.lastState === 'left');

  // Show vs only if we have both winners and losers (not ready/waiting players)
  const showVs = winners.length > 0 && losers.length > 0;

  // Check if this is a benched block
  const isBenched = block.benchedType === 'resting' || block.benchedType === 'left';

  // Don't render empty blocks
  if (visiblePlayers.length === 0) {
    return null;
  }

  // Render benched blocks differently
  if (isBenched) {
    return (
      <motion.div
        className={`queue__block queue__block--benched ${block.benchedType === 'left' ? 'queue__block--left' : ''}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <h3 className="queue__block-title queue__block-title--benched">
          <i className={`fas ${block.benchedType === 'resting' ? 'fa-pause-circle' : 'fa-sign-out-alt'}`}></i>
          {block.benchedType === 'resting' ? 'Resting' : 'Left Session'}
        </h3>
        <div className="queue__benched-grid">
          {visiblePlayers.map((player) => (
            <button
              key={player.playerNumber}
              type="button"
              className="queue__benched-player"
              onClick={() => onPlayerClick?.(player)}
              title="Click to return player to queue"
            >
              <span className="queue__benched-name">
                {player.playerName || `Player #${player.playerNumber}`}
              </span>
              <i className="fas fa-undo queue__benched-icon"></i>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`queue__block ${shouldHighlightEntireBlock ? 'help-pulse' : ''}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h3 className="queue__block-title">
        {block.sourceCourt === -1
          ? <>New Arrivals <span className="queue__block-subtitle">(Not Played Yet)</span></>
          : block.sourceCourt === -2
          ? 'Substituted Out'
          : block.sourceCourt === -3
          ? 'Returning Players'
          : `Came off ${labelForCourt(block.sourceCourt)}`}
        {block.sourceCourt !== -1 && block.sourceCourt !== -3 && timeAgo && (
          <span className="queue__block-time"> • {timeAgo}</span>
        )}
      </h3>

      <div className={`queue__game ${!showVs ? 'queue__game--single-side' : ''}`}>
        {winners.length > 0 && (
          <div
            className="queue__side queue__side--winner"
          >
            <div className="queue__side-label">
              {winners.length === 1 ? 'Winner' : 'Winners'}
            </div>
              {winners.map((player, index) => (
                <QueuePlayerCard
                  key={player.playerNumber}
                  player={player}
                  onPlayerClick={onPlayerClick}
                  onAssignCourt={(playerNumber, courtNumber) =>
                    onAssignCourt(block.id, playerNumber, courtNumber)
                  }
                  courtCount={courtCount}
                  courtOccupancy={courtOccupancy}
                  priorityCourtNum={priorityCourtNum}
                  showOnlyPriority={!allCourtsFull}
                  onHover={onPlayerHover}
                  shouldPulse={shouldHighlight && index === 0}
                  shouldPulseBenchButton={shouldHighlightBenchButton && index === 0}
                  isAvailableForPlannedGame={isSelectingForPlannedGame && !plannedGamePlayerNumbers.includes(player.playerNumber)}
                />
              ))}
          </div>
        )}

        {showVs && <div className="queue__vs">vs</div>}
        
        {losers.length > 0 && (
          <div
            className="queue__side queue__side--loser"
          >
            <div className="queue__side-label">
              {losers.length === 1 ? 'Loser' : 'Losers'}
            </div>
              {losers.map((player, index) => (
                <QueuePlayerCard
                  key={player.playerNumber}
                  player={player}
                  onPlayerClick={onPlayerClick}
                  onAssignCourt={(playerNumber, courtNumber) =>
                    onAssignCourt(block.id, playerNumber, courtNumber)
                  }
                  courtCount={courtCount}
                  courtOccupancy={courtOccupancy}
                  priorityCourtNum={priorityCourtNum}
                  showOnlyPriority={!allCourtsFull}
                  onHover={onPlayerHover}
                  shouldPulse={shouldHighlight && winners.length === 0 && index === 0}
                  shouldPulseBenchButton={shouldHighlightBenchButton && winners.length === 0 && index === 0}
                  isAvailableForPlannedGame={isSelectingForPlannedGame && !plannedGamePlayerNumbers.includes(player.playerNumber)}
                />
              ))}
          </div>
        )}

        {readyPlayers.length > 0 && (
          <div
            className="queue__side queue__side--ready"
          >
            <div className="queue__side-label">
              {readyPlayers.length === 1 ? 'Ready' : 'Ready'}
            </div>
              {readyPlayers.map((player, index) => (
                <QueuePlayerCard
                  key={player.playerNumber}
                  player={player}
                  onPlayerClick={onPlayerClick}
                  onAssignCourt={(playerNumber, courtNumber) =>
                    onAssignCourt(block.id, playerNumber, courtNumber)
                  }
                  courtCount={courtCount}
                  courtOccupancy={courtOccupancy}
                  priorityCourtNum={priorityCourtNum}
                  showOnlyPriority={!allCourtsFull}
                  onHover={onPlayerHover}
                  shouldPulse={shouldHighlight && winners.length === 0 && losers.length === 0 && index === 0}
                  shouldPulseBenchButton={shouldHighlightBenchButton && winners.length === 0 && losers.length === 0 && index === 0}
                  isAvailableForPlannedGame={isSelectingForPlannedGame && !plannedGamePlayerNumbers.includes(player.playerNumber)}
                />
              ))}
          </div>
        )}

        {waitingPlayers.length > 0 && (
          <div
            className="queue__side queue__side--waiting"
          >
            <div className="queue__side-label">
              {waitingPlayers.length === 1 ? 'Waiting' : 'Waiting'}
            </div>
              {waitingPlayers.map((player, index) => (
                <QueuePlayerCard
                  key={player.playerNumber}
                  player={player}
                  onPlayerClick={onPlayerClick}
                  onAssignCourt={(playerNumber, courtNumber) =>
                    onAssignCourt(block.id, playerNumber, courtNumber)
                  }
                  courtCount={courtCount}
                  courtOccupancy={courtOccupancy}
                  priorityCourtNum={priorityCourtNum}
                  showOnlyPriority={!allCourtsFull}
                  onHover={onPlayerHover}
                  shouldPulse={shouldHighlight && winners.length === 0 && losers.length === 0 && readyPlayers.length === 0 && index === 0}
                  shouldPulseBenchButton={shouldHighlightBenchButton && winners.length === 0 && losers.length === 0 && readyPlayers.length === 0 && index === 0}
                  isAvailableForPlannedGame={isSelectingForPlannedGame && !plannedGamePlayerNumbers.includes(player.playerNumber)}
                />
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QueueBlock;