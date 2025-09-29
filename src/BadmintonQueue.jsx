import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
    plannedGames,
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
    createPlannedGame,
    updatePlannedGameSlot,
    removePlannedGame,
    clearPlannedGame,
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [hoveredQueuePlayer, setHoveredQueuePlayer] = useState(null);
  const [hoveredTargetCourt, setHoveredTargetCourt] = useState(null);

  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  // Show help/tutorial, but remember if dismissed during current session
  const [showHelp, setShowHelp] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('badminton-help-completed');
      return savedPreference !== 'true';
    }
    return true;
  });

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-collapse on medium screens when first loading
      if (window.innerWidth <= 1350 && queueCollapsed === false && sessionStarted) {
        setQueueCollapsed(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sessionStarted]);


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

  const handleFinishTutorial = () => {
    setShowHelp(false);
    localStorage.setItem('badminton-help-completed', 'true');
  };

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

  // Calculate priority court (prioritize partially filled over empty)
  let priorityCourtNum = null;
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

  // Check if all players have default names
  const allDefaultNames = allPlayersForRename.every(p =>
    !p.playerName || p.playerName === `Player #${p.playerNumber}`
  );

  // Check if no players are on court
  const noPlayersOnCourt = activePlayers.length === 0;

  // Check if some players have been renamed (but not all)
  const somePlayersRenamed = !allDefaultNames && allPlayersForRename.some(p =>
    p.playerName && p.playerName !== `Player #${p.playerNumber}`
  );

  // Check if we should highlight first queue player (only when help is shown)
  const shouldHighlightFirstPlayer = showHelp && somePlayersRenamed && noPlayersOnCourt && queueBlocks.length > 0;

  // Check if Court 1 is partially filled (1-3 players)
  const court1Players = activePlayers.filter(p => p.courtNumber === 1).length;
  const court1PartiallyFilled = court1Players >= 1 && court1Players < 4;
  const shouldHelpFillCourt1 = showHelp && court1PartiallyFilled && queueBlocks.length > 0;

  // Check if Court 1 is full but no games declared yet
  const court1Full = court1Players === 4;
  const hasAnyDeclaredGames = queueBlocks.some(block =>
    block.sourceCourt > 0 && block.players.some(p => p.lastState === 'winner' || p.lastState === 'loser')
  );
  const shouldHelpDeclareWinner = showHelp && court1Full && !hasAnyDeclaredGames;

  // Check if there are empty court slots and players available to fill them
  const totalPlayersOnCourt = activePlayers.length;
  const totalCourtCapacity = courtCount * 4;
  const hasEmptyCourtSlots = totalPlayersOnCourt < totalCourtCapacity;
  const hasQueuedPlayers = queueBlocks.some(block =>
    !block.benchedType && block.players.length > 0
  );
  const canContinueAddingPlayers = hasEmptyCourtSlots && hasQueuedPlayers;

  // Show final help tips after at least one game has been declared
  const shouldShowFinalTips = showHelp && hasAnyDeclaredGames;

  // Check if any courts are full (4 players) and no partial courts
  const hasFullCourts = Array.from({ length: courtCount }, (_, i) => {
    const courtNum = i + 1;
    const playersOnCourt = activePlayers.filter(p => p.courtNumber === courtNum).length;
    return playersOnCourt === 4;
  }).some(Boolean);

  const hasPartialCourts = Array.from({ length: courtCount }, (_, i) => {
    const courtNum = i + 1;
    const playersOnCourt = activePlayers.filter(p => p.courtNumber === courtNum).length;
    return playersOnCourt > 0 && playersOnCourt < 4;
  }).some(Boolean);

  const shouldShowClickWinningPair = showHelp && hasFullCourts && !hasPartialCourts && hasAnyDeclaredGames;

  // Check if we need to pulse the queue toggle when it's collapsed
  const shouldPulseQueueToggle = showHelp && queueCollapsed && (
    (allDefaultNames && noPlayersOnCourt) || // First help step
    shouldHighlightFirstPlayer || // Need to assign first player
    shouldHelpFillCourt1 // Need to fill Court 1
  );

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
                onClick={() => {
                  // Reset tutorial preference on new session
                  localStorage.removeItem('badminton-help-completed');
                  setShowHelp(true);
                  startSession();
                  setShowWelcomeModal(true);
                }}
                disabled={courtCount < 1 || playerCount < 1}
              >
                Let's go!
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionStarted && (
        <div className="session">
          {/* Full-width menu bar */}
          <div className="session__menu">
            <div className="session__menu-brand">
              <img src="/peg_white.png" alt="Logo" className="session__menu-logo" />
              {windowWidth > 800 && <span className="session__menu-title">THE PEG BOARD</span>}
              <button type="button" onClick={() => setConfirmNewSessionModal(true)} title="New Session" className="session__menu-new">
                <i className="fas fa-plus"></i>
                {windowWidth > 800 && <span> New Session</span>}
              </button>
            </div>
            <div className="session__menu-controls">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title={canUndo ? `Undo: ${undoStack[undoStack.length - 1]?.action}` : 'Nothing to undo'}
                className={shouldShowFinalTips ? 'help-pulse' : ''}
              >
                <i className="fas fa-undo"></i>
                {windowWidth > 800 && <span> Undo</span>}
              </button>
              <button
                type="button"
                onClick={() => setBulkRenameModal(true)}
                title="Rename Players"
                className={showHelp && allDefaultNames && noPlayersOnCourt ? 'help-pulse' : ''}
              >
                <i className="fas fa-edit"></i>
                {windowWidth > 800 && <span> Rename Players</span>}
              </button>
              <button
                type="button"
                onClick={() => setQueueCollapsed(!queueCollapsed)}
                title={queueCollapsed ? "Show Court Queue" : "Hide Court Queue"}
                className={`${shouldPulseQueueToggle ? 'help-pulse' : ''} ${queueCollapsed ? 'active' : ''}`}
              >
                <i className="fas fa-list"></i>
                {windowWidth > 800 && <span> {queueCollapsed ? 'Show' : 'Hide'} Court Queue</span>}
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="session__content">
            {/* Court Area */}
            <div className={`court-area ${queueCollapsed ? 'court-area--expanded' : ''}`}>
              <div className="court-area__inner">
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
                  shouldHighlightFirstEmptySlot={shouldHighlightFirstPlayer}
                  shouldHighlightRemainingSlots={shouldHelpFillCourt1}
                  shouldHighlightVictoryButtons={shouldHelpDeclareWinner}
                />
                {showHelp && (
                  <div className={`help-bar ${queueCollapsed ? 'help-bar--expanded' : ''}`}>
                    <button
                      type="button"
                      className="help-bar__close"
                      onClick={handleFinishTutorial}
                      title="Skip Tutorial"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className="help-bar__content">
                      <div className="help-bar__title">
                        <i className="fas fa-graduation-cap"></i>
                        Tutorial
                      </div>
                      <div className="help-bar__messages">
                        {shouldShowFinalTips && !allDefaultNames && !noPlayersOnCourt && !shouldHighlightFirstPlayer && !shouldHelpFillCourt1 && !shouldHelpDeclareWinner && !priorityCourtNum ? (
                          <>
                            <div className="help-bar__tips">
                              <div className="help-bar__tips-header">
                                <i className="fas fa-lightbulb"></i>
                                More Tips...
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-user-plus"></i>
                                <span className="help-bar__text">
                                  If new players arrive, add them with the Add Player button
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-ellipsis-v"></i>
                                <span className="help-bar__text">
                                  Use the 3-dot button on queued players to mark them as resting or left session
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-list-ol"></i>
                                <span className="help-bar__text">
                                  Players are queued in blocks - prioritize players towards the top when picking games for fairness
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-undo"></i>
                                <span className="help-bar__text">
                                  You can undo mistakes with the undo button
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="help-bar__finish-btn"
                              onClick={handleFinishTutorial}
                            >
                              <i className="fas fa-check-circle"></i>
                              Finish Tutorial
                            </button>
                          </>
                        ) : allDefaultNames && noPlayersOnCourt ? (
                          <>
                            <div className="help-bar__item help-bar__item--primary">
                              <i className="fas fa-edit"></i>
                              <span className="help-bar__text">
                                Rename your players using the rename button - this will help identify who is who
                              </span>
                            </div>
                            <div className="help-bar__item help-bar__item--secondary">
                              <i className="fas fa-mouse-pointer"></i>
                              <span className="help-bar__text">
                                Click in the queue area to start adding your first players to Court 1
                              </span>
                            </div>
                          </>
                        ) : shouldHighlightFirstPlayer ? (
                          <div className="help-bar__item help-bar__item--primary">
                            <i className="fas fa-hand-pointer"></i>
                            <span className="help-bar__text">
                              Click on players in the queue to assign them to Court 1
                            </span>
                          </div>
                        ) : shouldHelpFillCourt1 ? (
                          <div className="help-bar__item help-bar__item--primary">
                            <i className="fas fa-users"></i>
                            <span className="help-bar__text">
                              Add {4 - court1Players} more player{4 - court1Players > 1 ? 's' : ''} from anyone in the queue
                            </span>
                          </div>
                        ) : shouldHelpDeclareWinner ? (
                          <>
                            <div className="help-bar__item help-bar__item--primary">
                              <i className="fas fa-trophy"></i>
                              <span className="help-bar__text">
                                When a game ends, click the trophy button to declare the winner
                              </span>
                            </div>
                            {canContinueAddingPlayers && (
                              <div className="help-bar__item help-bar__item--secondary">
                                <i className="fas fa-user-plus"></i>
                                <span className="help-bar__text">
                                  Continue adding players to fill the remaining slots
                                </span>
                              </div>
                            )}
                          </>
                        ) : shouldShowFinalTips ? (
                          <>
                            <div className="help-bar__tips">
                              <div className="help-bar__tips-header">
                                <i className="fas fa-lightbulb"></i>
                                More Tips...
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-user-plus"></i>
                                <span className="help-bar__text">
                                  If new players arrive, add them with the Add Player button
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-ellipsis-v"></i>
                                <span className="help-bar__text">
                                  Use the 3-dot button on queued players to mark them as resting or left session
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-list-ol"></i>
                                <span className="help-bar__text">
                                  Players are queued in blocks - prioritize players towards the top when picking games for fairness
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-exchange-alt"></i>
                                <span className="help-bar__text">
                                  Click on a playing player to substitute them
                                </span>
                              </div>
                              <div className="help-bar__item help-bar__item--primary">
                                <i className="fas fa-undo"></i>
                                <span className="help-bar__text">
                                  You can undo mistakes with the undo button
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="help-bar__finish-btn"
                              onClick={handleFinishTutorial}
                            >
                              <i className="fas fa-check-circle"></i>
                              Finish Tutorial
                            </button>
                          </>
                        ) : priorityCourtNum ? (
                          <div className="help-bar__item">
                            <i className="fas fa-user-plus"></i>
                            <span className="help-bar__text">
                              Click on players in the queue to assign them to Court {priorityCourtNum}
                            </span>
                          </div>
                        ) : (
                          <div className="help-bar__item">
                            <i className="fas fa-clock"></i>
                            <span className="help-bar__text">
                              All courts are full - players will automatically queue
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Queue Area (collapsible column) */}
            <div className={`queue-column ${queueCollapsed ? 'queue-column--collapsed' : ''}`}>
              <AnimatePresence>
                {!queueCollapsed && (
                  <motion.div
                    className="queue-column__content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QueueList
                      blocks={queueBlocks}
                      courtCount={courtCount}
                      courtOccupancy={courtOccupancy}
                      players={activePlayers}
                      onAssignCourt={assignCourtFromQueue}
                      onPlayerClick={openBenchModal}
                      onPlayerHover={handlePlayerHover}
                      shouldHighlightFirstPlayer={shouldHighlightFirstPlayer}
                      shouldHighlightEntireBlock={shouldHelpFillCourt1}
                      shouldShowPreviewBlock={shouldHelpDeclareWinner}
                      shouldHighlightBenchButton={shouldShowFinalTips}
                      plannedGames={plannedGames}
                      onCreatePlannedGame={createPlannedGame}
                      onUpdatePlannedGameSlot={updatePlannedGameSlot}
                      onRemovePlannedGame={removePlannedGame}
                      onClearPlannedGame={clearPlannedGame}
                      hoveredQueuePlayer={hoveredQueuePlayer}
                      activePlayers={players}
                    />
                    <button
                      type="button"
                      className={`queue-column__add-player ${shouldShowFinalTips ? 'help-pulse' : ''}`}
                      onClick={addPlayer}
                      title="Add Player to Queue"
                    >
                      <i className="fas fa-user-plus"></i>
                      <span>Add Player</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Backdrop for overlay mode */}
            <AnimatePresence>
              {!queueCollapsed && windowWidth <= 1350 && (
                <motion.div
                  className="queue-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setQueueCollapsed(true)}
                />
              )}
            </AnimatePresence>
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
                  // Reset tutorial preference on new session
                  localStorage.removeItem('badminton-help-completed');
                  setShowHelp(true);
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

      {showWelcomeModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowWelcomeModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal modal--welcome">
            <div className="modal__header-icon">
              <i className="fas fa-hands-clapping"></i>
            </div>
            <h3 className="modal__title">
              Welcome! Let's get everyone playing
            </h3>
            <p className="modal__message">
              Courts are on the left, the queue is on the right. Players move from queue to courts and back again.
            </p>
            <div className="modal__tips">
              <div className="modal__tip">
                <i className="fas fa-user-edit"></i>
                <span>Start by renaming players with their real names</span>
              </div>
              <div className="modal__tip">
                <i className="fas fa-hand-pointer"></i>
                <span>Click players in the queue to assign them to a free court</span>
              </div>
              <div className="modal__tip">
                <i className="fas fa-trophy"></i>
                <span>End a game by clicking the winning pair</span>
              </div>
              <div className="modal__tip">
                <i className="fas fa-clock"></i>
                <span>The app displays what order everyone came off court and which game they just played</span>
              </div>
            </div>
            <p className="modal__footer-text">
              Look for the tutorial bar at the bottom for step-by-step guidance!
            </p>
            <div className="modal__actions">
              <button
                type="button"
                onClick={() => {
                  setShowWelcomeModal(false);
                  setShowHelp(false);
                  localStorage.setItem('badminton-help-completed', 'true');
                }}
                className="modal__btn modal__btn--secondary"
              >
                Skip Tutorial
              </button>
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="modal__btn modal__btn--primary"
              >
                Let's get started!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadmintonQueue;
