import React from 'react';
import QueueBlock from './QueueBlock';

const QueueList = ({ blocks, courtCount, courtOccupancy = [], players = [], onAssignCourt, onPlayerClick }) => {
  const visibleBlocks = blocks.filter((b) => b.players.length > 0);

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
  const nextIdx = courtOccupancy.findIndex((n) => n < 4);
  const priorityCourtNum = !isAnyCourtDeclaring && nextIdx !== -1 ? nextIdx + 1 : null;

  return (
    <div className="queue">
      {/* Queue instruction header - sticky */}
      {sortedBlocks.length > 0 && (
        <div
          key={isAnyCourtDeclaring ? 'declaring' : (priorityCourtNum || 'full')}
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
              All courts full - players waiting
            </div>
          )}
        </div>
      )}

      {/* Scrollable content area */}
      <div className="queue__content">
        {sortedBlocks.map((block) => (
          <QueueBlock
            key={block.id}
            block={block}
            courtCount={courtCount}
            courtOccupancy={courtOccupancy}
            priorityCourtNum={priorityCourtNum}
            onAssignCourt={onAssignCourt}
            onPlayerClick={onPlayerClick}
          />
        ))}

        {sortedBlocks.length === 0 && (
          <div className="queue__empty-state">
            No one queued yet. Add players to Queue to form blocks of 4.
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueList;
