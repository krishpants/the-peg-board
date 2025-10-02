import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import QueueBlock from './QueueBlock';
import QueuePlayerCard from './QueuePlayerCard';
import PlannedGameBlock from './PlannedGameBlock';

const QueueList = ({ blocks, courtCount, courtOccupancy = [], players = [], activePlayers = [], onAssignCourt, onPlayerClick, onPlayerHover, shouldHighlightFirstPlayer, shouldHighlightEntireBlock, shouldShowPreviewBlock, shouldHighlightBenchButton, plannedGames = [], onCreatePlannedGame, onUpdatePlannedGameSlot, onRemovePlannedGame, onClearPlannedGame, hoveredQueuePlayer = null, onSlotSelectionChange }) => {
  // For now, show all blocks (planned games will be handled separately)
  const visibleBlocks = blocks;

  // Collect all players currently in planned games
  const playersInPlannedGames = plannedGames.flatMap(game =>
    game.slots.filter(slot => slot !== null)
  );

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

  // State for click-to-add interaction
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Calculate position for each planned game
  const getPlannedGamePosition = (plannedGame) => {
    let lowestBlockIndex = -1;
    let hasPlayingPlayer = false;
    let hasAnyPlayers = false;

    plannedGame.slots.forEach(slot => {
      if (!slot) return;

      hasAnyPlayers = true;

      // Check if player is currently on court
      const isPlaying = activePlayers.some(p =>
        p.playerNumber === slot.playerNumber && p.onCourt
      );

      if (isPlaying) {
        hasPlayingPlayer = true;
        return;
      }

      // Find player's block position
      const blockIndex = sortedBlocks.findIndex(block =>
        block.players.some(p => p.playerNumber === slot.playerNumber)
      );

      if (blockIndex > lowestBlockIndex) {
        lowestBlockIndex = blockIndex;
      }
    });

    // If no players yet, position at top
    if (!hasAnyPlayers) {
      return {
        position: 0,
        hasPlayingPlayer: false,
        reason: '👥 Waiting for players to be added'
      };
    }

    return {
      position: hasPlayingPlayer ? 'bottom' : lowestBlockIndex,
      hasPlayingPlayer,
      reason: hasPlayingPlayer
        ? '⏳ Waiting for players to finish'
        : lowestBlockIndex > 2
        ? '💡 Slightly longer wait for fairness'
        : '✅ Ready when court available'
    };
  };

  // Build display list with planned games in correct positions
  const buildDisplayList = () => {
    const displayItems = [];
    const processedGames = new Set();

    // First, add any planned games that should appear at the top (position 0)
    plannedGames.forEach(game => {
      const position = getPlannedGamePosition(game);
      if (position.position === 0 && !position.hasPlayingPlayer) {
        displayItems.push({
          type: 'planned-game',
          data: game,
          key: `planned-${game.id}`,
          statusMessage: position.reason,
          priority: 'normal'
        });
        processedGames.add(game.id);
      }
    });

    // Process each block and insert planned games above them
    sortedBlocks.forEach((block, index) => {
      // Add planned games that should appear above this block
      plannedGames.forEach(game => {
        if (processedGames.has(game.id)) return;

        const position = getPlannedGamePosition(game);
        if (position.position === index && !position.hasPlayingPlayer) {
          displayItems.push({
            type: 'planned-game',
            data: game,
            key: `planned-${game.id}`,
            statusMessage: position.reason,
            priority: 'normal'
          });
          processedGames.add(game.id);
        }
      });

      // Add the regular block
      displayItems.push({
        type: 'block',
        data: block,
        key: `block-${block.id}`
      });
    });

    // Add separator if there are games with playing players
    const bottomGames = plannedGames.filter(game => {
      const position = getPlannedGamePosition(game);
      return position.hasPlayingPlayer;
    });

    if (bottomGames.length > 0) {
      displayItems.push({
        type: 'separator',
        key: 'separator',
        label: 'Games waiting for players to finish'
      });

      // Add planned games with playing players at bottom
      bottomGames.forEach(game => {
        const position = getPlannedGamePosition(game);
        displayItems.push({
          type: 'planned-game',
          data: game,
          key: `planned-${game.id}`,
          statusMessage: position.reason,
          priority: 'low'
        });
      });
    }

    return displayItems;
  };

  const displayItems = buildDisplayList();

  // Handle slot selection for click-to-add
  const handleSlotSelect = (slotId) => {
    const newSelection = slotId === selectedSlot ? null : slotId;
    setSelectedSlot(newSelection);
    onSlotSelectionChange?.(newSelection);
  };

  // Handle player click when slot is selected
  const handlePlayerClickForPlannedGame = (player) => {
    if (selectedSlot) {
      // Check if player is already in any planned game
      const isAlreadyInPlannedGame = playersInPlannedGames.some(
        p => p.playerNumber === player.playerNumber
      );

      if (isAlreadyInPlannedGame) {
        // Don't add player if they're already in a planned game
        setSelectedSlot(null);
        onSlotSelectionChange?.(null);
        return;
      }

      // selectedSlot is like "game-123456-0" where 0 is the slot index
      const lastDashIndex = selectedSlot.lastIndexOf('-');
      const gameId = selectedSlot.substring(0, lastDashIndex);
      const slotIndex = parseInt(selectedSlot.substring(lastDashIndex + 1));
      onUpdatePlannedGameSlot(gameId, slotIndex, player);
      setSelectedSlot(null);
      onSlotSelectionChange?.(null);
    } else {
      onPlayerClick?.(player);
    }
  };

  // Handle ESC key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedSlot) {
        setSelectedSlot(null);
        onSlotSelectionChange?.(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlot, onSlotSelectionChange]);

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
                isSelectingForPlannedGame={!!selectedSlot}
                playersInPlannedGames={playersInPlannedGames}
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
