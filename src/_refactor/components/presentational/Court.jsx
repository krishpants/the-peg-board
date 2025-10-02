import React, { useState } from 'react';
import TimeDisplay from './TimeDisplay';
import { Tutored } from './TutorialArrow';
// import PlayerAvatar from './PlayerAvatar';

const Court = ({
  courtNumber,
  players = [],
  pairing = null,
  startTime = null,
  isPriority = false,
  isPlaying = false,
  hoveredPlayer = null,
  isSelectingForPlannedGame = false,
  isInPlannedGame = () => false,
  showTutorialArrow = false,
  showFillCourtArrow = false,
  showDeclareWinnerArrow = false,
  showSubstituteArrow = false,
  showHelp = false,
  onPlayerClick,
  onPlayerHover,
  onRemoveFromCourt,
  onSubstitutePlayer,
  onRotatePairing,
  onFinishGame
}) => {
  const [hoveredPair, setHoveredPair] = useState(null);
  const playerCount = players.length;
  const isEmpty = playerCount === 0;
  const isFull = playerCount === 4;
  const isWaiting = playerCount > 0 && playerCount < 4;

  // Should we show a ghost player in the next empty slot?
  // Don't show ghost if we're in planned game selection mode
  const showGhost = isPriority && !isFull && hoveredPlayer && !isSelectingForPlannedGame;
  const ghostSlotIndex = showGhost ? playerCount : -1;

  // Helper to get player object from ID
  const getPlayer = (playerId) => players.find(p => p.playerNumber === playerId);

  // Get position for player based on their position in pairing
  const getPositionStyle = (playerNumber, pairing) => {
    if (!pairing) return {};

    // Player cards are 150px x 36px, so we offset by half those values
    const positions = {
      topLeft:  { transform: 'translate(calc(-50% - 75px), calc(-50% - 65px))' },
      topRight: { transform: 'translate(calc(-50% + 75px), calc(-50% - 65px))' },
      botLeft:  { transform: 'translate(calc(-50% - 75px), calc(-50% + 65px))' },
      botRight: { transform: 'translate(calc(-50% + 75px), calc(-50% + 65px))' }
    };

    if (pairing.pair1[0] === playerNumber) return positions.topLeft;
    if (pairing.pair1[1] === playerNumber) return positions.topRight;
    if (pairing.pair2[0] === playerNumber) return positions.botLeft;
    if (pairing.pair2[1] === playerNumber) return positions.botRight;

    return {};
  };

  // Get position style for empty slots
  const getSlotPositionStyle = (slotIndex) => {
    const positions = {
      0: { transform: 'translate(calc(-50% - 75px), calc(-50% - 65px))' },
      1: { transform: 'translate(calc(-50% + 75px), calc(-50% - 65px))' },
      2: { transform: 'translate(calc(-50% - 75px), calc(-50% + 65px))' },
      3: { transform: 'translate(calc(-50% + 75px), calc(-50% + 65px))' }
    };
    return positions[slotIndex] || {};
  };

  // Handle pair winner selection
  const handlePairWinner = (pairNumber) => {
    if (!pairing) return;
    const winningPair = pairNumber === 1 ? pairing.pair1 : pairing.pair2;
    const losingPair = pairNumber === 1 ? pairing.pair2 : pairing.pair1;
    setHoveredPair(null); // Clear hover state when game ends
    onFinishGame(courtNumber, winningPair, losingPair);
  };

  return (
    <div className={`court ${isPriority && !isSelectingForPlannedGame ? 'court--priority' : ''} ${isWaiting ? 'court--waiting' : ''} ${isPlaying ? 'court--playing' : ''}`}>
      {isPriority && !isSelectingForPlannedGame && !showHelp && (
        <div className="court__priority-arrow">
          <i className="fas fa-arrow-down"></i>
        </div>
      )}
      <div className="court__header">
        <h3 className="court__title">Court {courtNumber}</h3>
        <div className="court__status">
          {isEmpty && <span className="court__status-text">Empty</span>}
          {!isEmpty && !isFull && (
            <span className="court__status-text court__status-text--partial">
              {4 - playerCount} More Player{4 - playerCount !== 1 ? 's' : ''}
            </span>
          )}
          {isPlaying && (
            <span className="court__status-text court__status-text--playing">
              Playing {startTime && <TimeDisplay startTime={startTime} format="duration" />}
            </span>
          )}
        </div>
      </div>

      <div className="court__content">
        {isFull && pairing ? (
          // Show pairing layout when court is full
          <div className="court__pairing-container">
            {/* Render players in absolute positions */}
            {players.map((player, index) => {
              const isPair1 = pairing.pair1.includes(player.playerNumber);
              const isPair2 = pairing.pair2.includes(player.playerNumber);

              // Determine position based on pairing
              let positionClass = '';
              if (isPair1) {
                positionClass = pairing.pair1[0] === player.playerNumber ? 'court__pair-player--top-left' : 'court__pair-player--top-right';
              } else if (isPair2) {
                positionClass = pairing.pair2[0] === player.playerNumber ? 'court__pair-player--bottom-left' : 'court__pair-player--bottom-right';
              }

              return (
                <div
                  key={player.playerNumber}
                  className={`court__pair-player court__pair-player--absolute court__pair-player--playing ${positionClass} ${
                    isPair1 && hoveredPair === 1 ? 'winning' :
                    isPair1 && hoveredPair === 2 ? 'losing' :
                    isPair2 && hoveredPair === 2 ? 'winning' :
                    isPair2 && hoveredPair === 1 ? 'losing' : ''
                  } ${isSelectingForPlannedGame && isInPlannedGame(player.playerNumber) ? 'court__pair-player--dimmed' : ''}`}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    ...getPositionStyle(player.playerNumber, pairing),
                    cursor: (isSelectingForPlannedGame && !isInPlannedGame(player.playerNumber)) || !isSelectingForPlannedGame ? 'pointer' : 'default'
                  }}
                  onClick={(e) => {
                    if (isSelectingForPlannedGame && onPlayerClick && !isInPlannedGame(player.playerNumber)) {
                      e.stopPropagation();
                      onPlayerClick(player.playerNumber);
                    } else if (!isSelectingForPlannedGame && onSubstitutePlayer) {
                      e.stopPropagation();
                      onSubstitutePlayer(player.playerNumber, courtNumber);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isSelectingForPlannedGame && !isInPlannedGame(player.playerNumber) && onPlayerHover) {
                      onPlayerHover(player);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isSelectingForPlannedGame && onPlayerHover) {
                      onPlayerHover(null);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (isSelectingForPlannedGame) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <button
                    type="button"
                    className="player-card__name-button"
                    style={{ pointerEvents: isSelectingForPlannedGame ? 'none' : 'auto' }}
                  >
                    {/* <PlayerAvatar name={player.name} size={24} /> */}
                    {player.name || `Player #${player.playerNumber}`}
                    {!isSelectingForPlannedGame && (showSubstituteArrow && index === 0) && (
                      <Tutored show={showSubstituteArrow && index === 0} side="right" direction="left" color="#fbbf24" gap={10} label="Swap Player">
                        <i className="fas fa-exchange-alt player-card__icon" style={{ opacity: 1 }}></i>
                      </Tutored>
                    )}
                    {!isSelectingForPlannedGame && !(showSubstituteArrow && index === 0) && (
                      <i className="fas fa-exchange-alt player-card__icon"></i>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Win buttons - positioned in center */}
            <button
              type="button"
              className={`queue-btn winner court__pair-win-btn court__pair-win-btn--top ${hoveredPair === 2 ? 'losing' : ''}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, calc(-50% - 65px))',
                transformOrigin: 'center center'
              }}
              onClick={() => handlePairWinner(1)}
              onMouseEnter={() => setHoveredPair(1)}
              onMouseLeave={() => setHoveredPair(null)}
            >
              <Tutored show={showDeclareWinnerArrow} side="bottom" direction="up" color="#ef4444" gap={10} label="Click winning pair when finished">
                <i className="fas fa-trophy"></i>
              </Tutored>
            </button>

            <div className="court__vs-divider" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              transformOrigin: 'center center'
            }}>
              <span>vs</span>
            </div>

            <button
              type="button"
              className={`queue-btn winner court__pair-win-btn court__pair-win-btn--bottom ${hoveredPair === 1 ? 'losing' : ''}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, calc(-50% + 65px))',
                transformOrigin: 'center center'
              }}
              onClick={() => handlePairWinner(2)}
              onMouseEnter={() => setHoveredPair(2)}
              onMouseLeave={() => setHoveredPair(null)}
            >
              <i className="fas fa-trophy"></i>
            </button>

          </div>
        ) : (
          // Show 4 slots in 2x2 layout
          <div className="court__pairing-container court__pairing-container--empty">
            {[0, 1, 2, 3].map((slotIndex) => {
              const player = players[slotIndex];

              const positionClass = {
                0: 'court__pair-player--top-left',
                1: 'court__pair-player--top-right',
                2: 'court__pair-player--bottom-left',
                3: 'court__pair-player--bottom-right'
              }[slotIndex];

              if (player) {
                return (
                  <div
                    key={`slot-${slotIndex}`}
                    className={`court__pair-player court__pair-player--absolute court__pair-player--waiting ${positionClass}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      ...getSlotPositionStyle(slotIndex)
                    }}
                  >
                    <button
                      type="button"
                      className="player-card__name-button"
                      onClick={() => onRemoveFromCourt && onRemoveFromCourt(player.playerNumber)}
                      title={`Remove ${player.name} from court`}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* <PlayerAvatar name={player.name} size={24} /> */}
                      {player.name || `Player #${player.playerNumber}`}
                    </button>
                  </div>
                );
              } else if (slotIndex === ghostSlotIndex && hoveredPlayer) {
                // Show ghost player
                return (
                  <div
                    key={`slot-${slotIndex}`}
                    className={`court__slot-ghost ${positionClass}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '150px',
                      height: '36px',
                      boxSizing: 'border-box',
                      ...getSlotPositionStyle(slotIndex)
                    }}
                  >
                    {/* <PlayerAvatar name={hoveredPlayer.name} size={24} /> */}
                    {hoveredPlayer.name || `Player #${hoveredPlayer.playerNumber}`}
                  </div>
                );
              } else {
                // Show empty slot
                return (
                  <Tutored key={`slot-${slotIndex}`} show={showTutorialArrow && slotIndex === 0} side="right" direction="left" color="#fbbf24" gap={-20} label="Fill Court 1 Slot 1">
                    <div
                      className={`court__slot-empty ${positionClass}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '150px',
                        height: '36px',
                        boxSizing: 'border-box',
                        ...getSlotPositionStyle(slotIndex)
                      }}
                    >
                      <span>Empty</span>
                    </div>
                  </Tutored>
                );
              }
            })}

            {/* VS divider - always shown */}
            <Tutored show={showFillCourtArrow} side="right" direction="left" color="#fbbf24" gap={120} label={'Fill The Court'}>
              <div className="court__vs-divider" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center center'
              }}>
                <span>vs</span>
              </div>
            </Tutored>
          </div>
        )}
      </div>

      {/* Footer with rotate button */}
      <button
        type="button"
        className="court__footer court__footer--button"
        onClick={() => onRotatePairing(courtNumber)}
        title="Rotate pairings"
        disabled={!isFull}
      >
        <i className="fas fa-sync-alt"></i>
        {isFull ? 'Rotate Pairings' : 'Waiting for Players'}
      </button>
    </div>
  );
};

export default Court;