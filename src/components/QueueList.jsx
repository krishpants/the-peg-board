import React from 'react';
import { AnimatePresence } from 'framer-motion';
import QueueBlock from './QueueBlock';
import QueuePlayerCard from './QueuePlayerCard';

const QueueList = ({ blocks, courtCount, courtOccupancy = [], players = [], activePlayers = [], onAssignCourt, onPlayerClick, onPlayerHover, shouldHighlightFirstPlayer, shouldHighlightEntireBlock, shouldShowPreviewBlock, shouldHighlightBenchButton, plannedGames = [], onCreatePlannedGame, onUpdatePlannedGameSlot, onRemovePlannedGame, onClearPlannedGame, hoveredQueuePlayer = null }) => {
  // For now, show all blocks (planned games will be handled separately)
  const visibleBlocks = blocks;

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

  // TODO: Implement court assignment for planned games

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
        {/* Add Plan a Game button */}
        <button
          type="button"
          className="queue__add-planned-game"
          onClick={() => onCreatePlannedGame()}
        >
          <i className="fas fa-clipboard-list"></i>
          Plan a Game
        </button>

        {/* Display merged queue blocks and planned games */}
        <AnimatePresence>
          {displayItems.map((item) => {
            if (item.type === 'separator') {
              return (
                <div key={item.key} className="queue__separator">
                  <span>{item.label}</span>
                </div>
              );
            }

            if (item.type === 'planned-game') {
              return (
                <PlannedGameBlock
                  key={item.key}
                  plannedGame={item.data}
                  blocks={blocks}
                  players={activePlayers}
                  courtCount={courtCount}
                  courtOccupancy={courtOccupancy}
                  priorityCourtNum={priorityCourtNum}
                  onAssignCourt={onAssignCourt}
                  onPlayerClick={handlePlayerClickForPlannedGame}
                  onPlayerHover={onPlayerHover}
                  onUpdateSlot={onUpdatePlannedGameSlot}
                  onClearGame={onClearPlannedGame}
                  onRemoveGame={onRemovePlannedGame}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSlotSelect}
                  statusMessage={item.statusMessage}
                  priority={item.priority}
                />
              );
            }

            // Regular queue block
            const block = item.data;
            const index = sortedBlocks.indexOf(block);
            return (
              <QueueBlock
                key={item.key}
                block={block}
                courtCount={courtCount}
                courtOccupancy={courtOccupancy}
                priorityCourtNum={priorityCourtNum}
                onAssignCourt={onAssignCourt}
                onPlayerClick={selectedSlot ? (player) => handlePlayerClickForPlannedGame(player) : onPlayerClick}
                onPlayerHover={onPlayerHover}
                shouldHighlight={shouldHighlightFirstPlayer && index === 0 && !block.benchedType}
                shouldHighlightEntireBlock={shouldHighlightEntireBlock && index === 0 && !block.benchedType}
                shouldHighlightBenchButton={shouldHighlightBenchButton && index === 0 && !block.benchedType}
                allCourtsFull={allCourtsFull}
              />
            );
          })}
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
