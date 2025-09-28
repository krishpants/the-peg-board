import React from 'react';
import { AnimatePresence } from 'framer-motion';
import QueueBlock from './QueueBlock';
import QueuePlayerCard from './QueuePlayerCard';

const QueueList = ({ blocks, courtCount, courtOccupancy = [], players = [], onAssignCourt, onPlayerClick, onPlayerHover, shouldHighlightFirstPlayer, shouldHighlightEntireBlock, shouldShowPreviewBlock, shouldHighlightBenchButton, nextGamePlayers = [], onAddToNextGame, onRemoveFromNextGame, onClearNextGame, onSendNextGameToCourt, hoveredQueuePlayer = null }) => {
  // Filter out players in Next Game when checking if blocks are visible
  const nextGamePlayerNumbers = nextGamePlayers.filter(p => p !== null).map(p => p.playerNumber);
  const visibleBlocks = blocks.filter((b) => {
    const remainingPlayers = b.players.filter(p => !nextGamePlayerNumbers.includes(p.playerNumber));
    return remainingPlayers.length > 0;
  });

  // Sort blocks: regular blocks first, then benched blocks
  const sortedBlocks = [...visibleBlocks].sort((a, b) => {
    // Benched blocks go to the bottom
    const aIsBenched = a.benchedType === 'resting' || a.benchedType === 'left';
    const bIsBenched = b.benchedType === 'resting' || b.benchedType === 'left';

    if (aIsBenched && !bIsBenched) return 1;  // a goes after b
    if (!aIsBenched && bIsBenched) return -1; // a goes before b

    // Within benched blocks, resting comes before left
    if (aIsBenched && bIsBenched) {
      if (a.benchedType === 'resting' && b.benchedType === 'left') return -1;
      if (a.benchedType === 'left' && b.benchedType === 'resting') return 1;
    }

    return 0; // Keep original order for same type
  });

  // Check if any courts are in declaring state (partial players + players from that court in queue)
  const isAnyCourtDeclaring = Array.from({ length: courtCount }, (_, i) => {
    const courtNum = i + 1;
    const playersOnCourt = players.filter(p => p.onCourt && p.courtNumber === courtNum).length;
    const playersInQueueFromThisCourt = blocks
      .filter(block => block.sourceCourt === courtNum && !block.closed)
      .flatMap(block => block.players).length;
    
    return playersOnCourt > 0 && playersOnCourt < 4 && playersInQueueFromThisCourt > 0;
  }).some(Boolean);

  // Only show priority court if no courts are declaring results
  // Prioritize partially filled courts (1-3 players) over empty courts (0 players)
  let priorityCourtNum = null;
  if (!isAnyCourtDeclaring) {
    // First, look for partially filled courts (1-3 players)
    const partialIdx = courtOccupancy.findIndex((n) => n > 0 && n < 4);
    if (partialIdx !== -1) {
      priorityCourtNum = partialIdx + 1;
    } else {
      // If no partial courts, find first empty court
      const emptyIdx = courtOccupancy.findIndex((n) => n === 0);
      if (emptyIdx !== -1) {
        priorityCourtNum = emptyIdx + 1;
      }
    }
  }

  // Check if all courts are full (all have 4 players)
  const allCourtsFull = courtOccupancy.length > 0 && courtOccupancy.every(n => n === 4);

  // Find a court with enough space for Next Game players
  let courtForNextGame = null;
  if (nextGamePlayers.length > 0) {
    const spaceNeeded = nextGamePlayers.length;
    const courtIndex = courtOccupancy.findIndex(occupancy => (4 - occupancy) >= spaceNeeded);
    if (courtIndex !== -1) {
      courtForNextGame = courtIndex + 1;
    }
  }

  return (
    <div className="queue">
      {/* Queue instruction header - sticky */}
      {courtCount > 0 && (
        <div
          className={`queue__instruction ${isAnyCourtDeclaring ? 'queue__instruction--declaring' : priorityCourtNum ? '' : 'queue__instruction--waiting'}`}
        >
          {isAnyCourtDeclaring ? (
            <div className="queue__instruction-text">
              Finish declaring game results
            </div>
          ) : priorityCourtNum ? (
            <div className="queue__instruction-text">
              Select {4 - (courtOccupancy[priorityCourtNum - 1] || 0)} players for Court {priorityCourtNum}
            </div>
          ) : (
            <div className="queue__instruction-text">
              All Courts Full
            </div>
          )}
        </div>
      )}

      {/* Scrollable content area */}
      <div className="queue__content">
        {/* Next Game Block - show when courts are full or there are players in it */}
        {(nextGamePlayers.some(p => p !== null) || allCourtsFull) && (
          <div className="queue__next-game">
            <div className="queue__next-game-header">
              <h3 className="queue__next-game-title">Next Game</h3>
              <div className="queue__next-game-actions">
                {nextGamePlayers.length > 0 && (
                  <button
                    type="button"
                    className="queue__next-game-clear"
                    onClick={() => onClearNextGame?.()}
                    title="Clear all players from Next Game"
                  >
                    <i className="fas fa-times"></i>
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="queue__next-game-slots">
              {nextGamePlayers.map((player) => {
                // Find which block this player is in (search in ALL blocks, not just visible ones)
                const playerBlock = blocks.find(block =>
                  block.players.some(p => p.playerNumber === player.playerNumber)
                );

                return (
                  <QueuePlayerCard
                    key={player.playerNumber}
                    player={player}
                    nextGamePlayers={nextGamePlayers}
                    onPlayerClick={null} // No special click behavior - just send to court
                    onPlayerOptions={onPlayerClick} // Standard player options
                    onAssignCourt={(playerNumber, courtNumber) => {
                      if (playerBlock) {
                        onAssignCourt(playerBlock.id, playerNumber, courtNumber);
                      }
                    }}
                    courtCount={courtCount}
                    courtOccupancy={courtOccupancy}
                    priorityCourtNum={priorityCourtNum}
                    showOnlyPriority={!allCourtsFull}
                    onHover={onPlayerHover}
                    shouldPulse={false}
                    shouldPulseBenchButton={false}
                    inNextGameArea={true}
                  />
                );
              })}
              {/* Show empty slots with ghost player on hover */}
              {Array.from({ length: Math.max(0, 4 - nextGamePlayers.length) }).map((_, index) => {
                const actualIndex = nextGamePlayers.length + index;
                const showGhost = hoveredQueuePlayer &&
                                allCourtsFull &&
                                actualIndex === nextGamePlayers.length && // Only show in first empty slot
                                !nextGamePlayers.some(p => p.playerNumber === hoveredQueuePlayer.playerNumber);

                return (
                  <div
                    key={`empty-${index}`}
                    className={`queue__next-game-empty ${showGhost ? 'queue__next-game-empty--ghost' : ''}`}
                    style={{ marginBottom: 8 }}
                  >
                    {showGhost ? (
                      <span className="queue__next-game-ghost">
                        {hoveredQueuePlayer.playerName || `Player #${hoveredQueuePlayer.playerNumber}`}
                      </span>
                    ) : (
                      <span>Empty</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {sortedBlocks.map((block, index) => (
            <QueueBlock
              key={block.id}
              block={block}
              courtCount={courtCount}
              courtOccupancy={courtOccupancy}
              priorityCourtNum={priorityCourtNum}
              onAssignCourt={onAssignCourt}
              onPlayerClick={onPlayerClick}
              onPlayerHover={onPlayerHover}
              shouldHighlight={shouldHighlightFirstPlayer && index === 0 && !block.benchedType}
              shouldHighlightEntireBlock={shouldHighlightEntireBlock && index === 0 && !block.benchedType}
              shouldHighlightBenchButton={shouldHighlightBenchButton && index === 0 && !block.benchedType}
              allCourtsFull={allCourtsFull}
              onAddToNextGame={onAddToNextGame}
              nextGamePlayers={nextGamePlayers}
            />
          ))}
        </AnimatePresence>

        {shouldShowPreviewBlock && (
          <div className="queue__preview-block help-pulse">
            <h3 className="queue__preview-title">
              Players will join the back of the queue here
            </h3>
            <div className="queue__preview-content">
              <div className="queue__preview-side">
                <span className="queue__preview-label">Winners</span>
                <div className="queue__preview-slots">
                  <div className="queue__preview-slot"></div>
                  <div className="queue__preview-slot"></div>
                </div>
              </div>
              <div className="queue__preview-vs">vs</div>
              <div className="queue__preview-side">
                <span className="queue__preview-label">Losers</span>
                <div className="queue__preview-slots">
                  <div className="queue__preview-slot"></div>
                  <div className="queue__preview-slot"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedBlocks.length === 0 && (
          <div className="queue__empty-state">
            No Players Left In Queue
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueList;
