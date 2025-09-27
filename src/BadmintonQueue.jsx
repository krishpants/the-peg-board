import React, { useState } from 'react';
import './styles/main.scss';
import useBadmintonSession from './hooks/useBadmintonSession';
import Settings from './components/Settings';
import CourtsArea from './components/CourtsArea';
import QueueList from './components/QueueList';
import NameModal from './components/NameModal';
import BulkRenameModal from './components/BulkRenameModal';
import SubstitutionModal from './components/SubstitutionModal';
import BenchModal from './components/BenchModal';

const BadmintonQueue = () => {
  const {
    courtCount,
    playerCount,
    sessionStarted,
    players,
    queueBlocks,
    undoStack,
    setCounts,
    startSession,
    addPlayer,
    resetSession,
    updatePlayerName,
    enqueuePlayerWithState,
    queueGameResult,
    assignCourtFromQueue,
    substitutePlayer,
    setBenchedStatus,
    updatePairingIndex,
    undo,
    canUndo,
  } = useBadmintonSession();

  const [nameModal, setNameModal] = useState({
    open: false,
    playerNumber: null,
    initialName: '',
  });

  const [bulkRenameModal, setBulkRenameModal] = useState(false);

  const [substitutionModal, setSubstitutionModal] = useState({
    open: false,
    player: null,
  });

  const [benchModal, setBenchModal] = useState({
    open: false,
    player: null,
  });

  const [confirmNewSessionModal, setConfirmNewSessionModal] = useState(false);

  const [hoveredQueuePlayer, setHoveredQueuePlayer] = useState(null);
  const [hoveredTargetCourt, setHoveredTargetCourt] = useState(null);


  const openNameModal = (playerNumber, initialName = '') =>
    setNameModal({ open: true, playerNumber, initialName });

  const closeNameModal = () =>
    setNameModal({ open: false, playerNumber: null, initialName: '' });

  const saveNameModal = (newName) => {
    if (nameModal.playerNumber != null) {
      updatePlayerName(nameModal.playerNumber, newName);
    }
    closeNameModal();
  };

  const saveBulkRename = (names) => {
    Object.entries(names).forEach(([playerNumber, name]) => {
      updatePlayerName(parseInt(playerNumber), name);
    });
  };

  const openSubstitutionModal = (player) => {
    setSubstitutionModal({ open: true, player });
  };

  const closeSubstitutionModal = () => {
    setSubstitutionModal({ open: false, player: null });
  };

  const handleSubstitute = (courtPlayer, queuePlayer) => {
    if (substitutePlayer) {
      substitutePlayer(courtPlayer, queuePlayer);
    }
  };

  const openBenchModal = (player) => {
    setBenchModal({ open: true, player });
  };

  const closeBenchModal = () => {
    setBenchModal({ open: false, player: null });
  };

  const handleSetPlayerStatus = (player, status) => {
    if (setBenchedStatus) {
      setBenchedStatus(player, status);
    }
  };

  const handlePlayerHover = (player, courtNum) => {
    setHoveredQueuePlayer(player);
    setHoveredTargetCourt(courtNum);
  };

  const handleSettingsChange = (patch) => setCounts(patch);

  // Only show players who are on court (queued players appear only in the queue)
  const activePlayers = players.filter((p) => p.onCourt);

  // Get all players for bulk rename (both on court and in queue)
  const allPlayersForRename = [
    ...players,
    ...queueBlocks.flatMap(block => block.players)
  ];

  // Track occupancy for each court 1..N (Unknown Court is 0 and unlimited)
  const courtOccupancy = Array.from({ length: courtCount }, (_, i) =>
    players.filter((p) => p.onCourt && p.courtNumber === i + 1).length
  );

  // Calculate priority court (first non-full court)
  const nextIdx = courtOccupancy.findIndex((n) => n < 4);
  const priorityCourtNum = nextIdx !== -1 ? nextIdx + 1 : null;

  return (
    <div className="app">
      {!sessionStarted && (
        <div className="settings-container">
          <div className="settings-card">
            <Settings
              courtCount={courtCount}
              playerCount={playerCount}
              onChange={handleSettingsChange}
            />
            <div className="app__actions">
              <button
                type="button"
                className="start-session-btn"
                onClick={startSession}
                disabled={courtCount < 1 || playerCount < 1}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionStarted && (
        <div className="session">
          <div className="session__layout">
            {/* Court Area (fills remaining space) */}
            <div className="court-area">
              <div className="courts__header">
                <span className="courts__header-title">Session Running</span>
                <div className="courts__header-controls">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    title={canUndo ? `Undo: ${undoStack[undoStack.length - 1]?.action}` : 'Nothing to undo'}
                  >
                    <i className="fas fa-undo"></i> Undo ({undoStack.length})
                  </button>
                  <button type="button" onClick={addPlayer}>
                    <i className="fas fa-user-plus"></i> Add Player
                  </button>
                  <button type="button" onClick={() => setBulkRenameModal(true)}>
                    <i className="fas fa-edit"></i> Rename Players
                  </button>
                  <button type="button" onClick={() => setConfirmNewSessionModal(true)}>
                    <i className="fas fa-sync-alt"></i> New Session
                  </button>
                </div>
              </div>
              <div className="court-area__content">
                <CourtsArea
                  players={activePlayers}
                  courtCount={courtCount}
                  onQueueWinner={(p) => enqueuePlayerWithState(p, 'winner')}
                  onQueueLoser={(p) => enqueuePlayerWithState(p, 'loser')}
                  onQueueGameResult={queueGameResult}
                  onPlayerClick={openSubstitutionModal}
                  queueBlocks={queueBlocks}
                  priorityCourtNum={priorityCourtNum}
                  onUpdatePairing={updatePairingIndex}
                  hoveredPlayer={hoveredQueuePlayer}
                  hoveredTargetCourt={hoveredTargetCourt}
                />
              </div>
            </div>

            {/* Queue Area (fixed 500px column) */}
            <div className="queue-column">
              <QueueList
                blocks={queueBlocks}
                courtCount={courtCount}
                courtOccupancy={courtOccupancy}
                players={activePlayers}
                onAssignCourt={assignCourtFromQueue}
                onPlayerClick={openBenchModal}
                onPlayerHover={handlePlayerHover}
              />
            </div>
          </div>
        </div>
      )}

      <NameModal
        open={nameModal.open}
        playerNumber={nameModal.playerNumber}
        initialName={nameModal.initialName}
        onSave={saveNameModal}
        onClose={closeNameModal}
      />

      <BulkRenameModal
        open={bulkRenameModal}
        players={allPlayersForRename}
        onSave={saveBulkRename}
        onClose={() => setBulkRenameModal(false)}
      />

      <SubstitutionModal
        open={substitutionModal.open}
        player={substitutionModal.player}
        queuedPlayers={queueBlocks
          .filter(block => !block.benchedType)
          .flatMap(block => block.players)}
        onSubstitute={handleSubstitute}
        onClose={closeSubstitutionModal}
      />

      <BenchModal
        open={benchModal.open}
        player={benchModal.player}
        onSetStatus={handleSetPlayerStatus}
        onClose={closeBenchModal}
      />

      {confirmNewSessionModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setConfirmNewSessionModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal modal--confirm">
            <h3 className="modal__title">
              Start New Session?
            </h3>
            <p className="modal__message">
              This will clear all current players, courts, and queue data. Are you sure you want to start a new session?
            </p>
            <div className="modal__actions">
              <button
                type="button"
                onClick={() => setConfirmNewSessionModal(false)}
                className="modal__btn modal__btn--cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetSession();
                  setConfirmNewSessionModal(false);
                }}
                className="modal__btn modal__btn--danger"
              >
                Yes, Start New Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadmintonQueue;
