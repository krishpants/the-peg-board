import React from 'react';
import Court from './Court';
import { Tutored } from './TutorialArrow';
import { getCurrentPairing } from '../../store/gameStore';

const CourtsArea = ({
  courts,
  players,
  courtCount,
  priorityCourt,
  hoveredPlayer,
  queueBlocks,
  isSelectingForPlannedGame,
  visibleTips,
  onPlayerClick,
  onPlayerHover,
  onRemoveFromCourt,
  onSubstitutePlayer,
  onRotatePairing,
  onFinishGame
}) => {
  // Check if a player is in a planned game
  const isInPlannedGame = (playerId) => {
    if (!queueBlocks) return false;
    return Object.values(queueBlocks).some(block =>
      block && block.type === 'planned_game' &&
      block.playerIds && block.playerIds.includes(playerId)
    );
  };
  // Build court display data
  const courtDisplays = Array.from({ length: courtCount }, (_, i) => {
    const courtNum = i + 1;
    const court = courts[courtNum] || { playerIds: [], pairingIndex: 0 };

    // Get player objects for this court
    const courtPlayers = court.playerIds
      .map(id => players[id])
      .filter(Boolean);

    // Get current pairing if court is full
    const pairing = court.playerIds.length === 4
      ? getCurrentPairing(court)
      : null;

    return {
      courtNumber: courtNum,
      players: courtPlayers,
      pairing,
      startTime: court.startTime,
      isPriority: courtNum === priorityCourt,
      isPlaying: court.playerIds.length === 4,
    };
  });

  return (
    <div className="courts-area">
      {courtDisplays.map(court => (
        <Court
          key={court.courtNumber}
          courtNumber={court.courtNumber}
          players={court.players}
          pairing={court.pairing}
          startTime={court.startTime}
          isPriority={court.isPriority}
          isPlaying={court.isPlaying}
          hoveredPlayer={hoveredPlayer}
          isSelectingForPlannedGame={isSelectingForPlannedGame}
          isInPlannedGame={isInPlannedGame}
          showTutorialArrow={(visibleTips.renamePlayers || visibleTips.assignFirst) && court.courtNumber === 1 && court.players.length === 0}
          showFillCourtArrow={visibleTips.fillCourt && court.courtNumber === 1}
          showDeclareWinnerArrow={visibleTips.declareWinner && court.courtNumber === 1}
          showSubstituteArrow={visibleTips.substitutePlayer && court.courtNumber === 1 && court.isPlaying}
          showHelp={Object.keys(visibleTips).length > 0}
          onPlayerClick={onPlayerClick}
          onPlayerHover={onPlayerHover}
          onRemoveFromCourt={onRemoveFromCourt}
          onSubstitutePlayer={onSubstitutePlayer}
          onRotatePairing={onRotatePairing}
          onFinishGame={onFinishGame}
        />
      ))}
    </div>
  );
};

export default CourtsArea;