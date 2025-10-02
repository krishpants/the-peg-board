import React, { useReducer, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createInitialState, getPriorityCourt } from './store/gameStore';
import { gameReducer } from './store/reducers/gameReducer';
import { saveState, loadState, clearState, debounce } from './store/persistence';
import { undoableReducer } from './store/undoableReducer';
import Settings from './components/presentational/Settings';
import CourtsArea from './components/presentational/CourtsArea';
import QueueArea from './components/presentational/QueueArea';
import Modal from './components/presentational/Modal';
import GameResultModal from './components/presentational/GameResultModal';
import BulkRenameModal from './components/presentational/BulkRenameModal';
import MarkPlayerModal from './components/presentational/MarkPlayerModal';
import SubstitutePlayerModal from './components/presentational/SubstitutePlayerModal';
import RestorePlayersModal from './components/presentational/RestorePlayersModal';
import WelcomeModal from './components/presentational/WelcomeModal';
import TutorialHelpBar from './components/presentational/TutorialHelpBar';
import { Tutored } from './components/presentational/TutorialArrow';
import { getCurrentPairing } from './store/gameStore';
import './styles/refactor.scss'; // Use refactored styles only

/**
 * Minimal refactored version - just session start and basic court display
 */
const BadmintonQueue_refactor = () => {
  // Try to load saved state, otherwise use initial state with undo/redo support
  const [undoableState, dispatch] = useReducer(
    undoableReducer(gameReducer),
    null,
    () => {
      const savedState = loadState();
      if (savedState && savedState.config.sessionStarted) {
        console.log('Restored saved session');
        // Wrap saved state in undoable structure
        return {
          past: [],
          present: savedState,
          future: []
        };
      }
      return {
        past: [],
        present: createInitialState(),
        future: []
      };
    }
  );

  // Extract present state for use in component
  const state = undoableState.present;
  const canUndo = undoableState.past.length > 0;
  const canRedo = undoableState.future.length > 0;
  const [tempConfig, setTempConfig] = useState({
    courtCount: 4,
    playerCount: 20
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showBulkRenameModal, setShowBulkRenameModal] = useState(false);
  const [gameResultModal, setGameResultModal] = useState({
    isOpen: false,
    courtNumber: null
  });
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [markPlayerModal, setMarkPlayerModal] = useState({
    isOpen: false,
    playerId: null
  });
  const [substituteModal, setSubstituteModal] = useState({
    isOpen: false,
    playerId: null,
    courtNumber: null
  });
  const [showRestorePlayersModal, setShowRestorePlayersModal] = useState(false);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  // Tutorial state
  const [showHelp, setShowHelp] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('badminton-help-completed');
      return savedPreference !== 'true';
    }
    return true;
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-collapse on medium screens when first loading
      if (window.innerWidth <= 1350 && queueCollapsed === false && state.config.sessionStarted) {
        setQueueCollapsed(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.config.sessionStarted]);

  // Create debounced save function
  const debouncedSave = useMemo(
    () => debounce((stateToSave) => {
      if (stateToSave.config.sessionStarted) {
        saveState(stateToSave);
      }
    }, 500),
    []
  );

  // Auto-save state changes
  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);

  const handleSettingsChange = (changes) => {
    setTempConfig(prev => ({ ...prev, ...changes }));
  };

  const handleStartSession = () => {
    // Check if there's a saved session
    const savedState = loadState();
    if (savedState && savedState.config.sessionStarted) {
      setShowNewSessionModal(true);
      return;
    }

    // Reset tutorial preference on new session
    localStorage.removeItem('badminton-help-completed');
    setShowHelp(true);

    dispatch({
      type: 'START_SESSION',
      payload: tempConfig
    });

    // Show welcome modal
    setShowWelcomeModal(true);
  };

  const handleConfirmNewSession = () => {
    clearState(); // Clear the saved session
    dispatch({
      type: 'START_SESSION',
      payload: tempConfig
    });
    setShowNewSessionModal(false);
  };

  // Track in-flight game completions to prevent duplicates
  const completingGamesRef = useRef(new Set());

  const handleAddPlayer = () => {
    dispatch({ type: 'ADD_PLAYER' });
  };

  const handleSendToCourt = (playerId, courtNumber) => {
    // Clear hover state when player is sent to court
    if (hoveredPlayer && hoveredPlayer.playerNumber === playerId) {
      setHoveredPlayer(null);
    }
    dispatch({
      type: 'ASSIGN_TO_COURT',
      payload: { playerId, courtNumber }
    });
  };

  const handleRotatePairing = (courtNumber) => {
    dispatch({
      type: 'ROTATE_PAIRING',
      payload: { courtNumber }
    });
  };

  const handleFinishGame = (courtNumber, winningPair = null, losingPair = null) => {
    // Check if we're already processing this court
    if (completingGamesRef.current.has(courtNumber)) {
      return; // Already processing, ignore duplicate call
    }

    // Check if court still has players (prevent duplicate finish calls)
    const court = state.courts[courtNumber];
    if (!court || court.playerIds.length !== 4) {
      return; // Court is already being cleared or doesn't have 4 players
    }

    if (winningPair && losingPair) {
      // Mark as in-flight
      completingGamesRef.current.add(courtNumber);

      // Direct selection from court (via trophy buttons)
      dispatch({
        type: 'COMPLETE_GAME',
        payload: { courtNumber, winningPair, losingPair }
      });

      // Clear in-flight marker after a short delay
      setTimeout(() => {
        completingGamesRef.current.delete(courtNumber);
      }, 500);
    } else {
      // Open modal for selection
      setGameResultModal({
        isOpen: true,
        courtNumber
      });
    }
  };

  const handleGameResult = (winningPair, losingPair) => {
    const { courtNumber } = gameResultModal;
    // Clear hover state when game completes
    setHoveredPlayer(null);
    dispatch({
      type: 'COMPLETE_GAME',
      payload: { courtNumber, winningPair, losingPair }
    });
    setGameResultModal({ isOpen: false, courtNumber: null });
  };

  const handleBulkRename = (updates) => {
    dispatch({
      type: 'BULK_UPDATE_PLAYER_NAMES',
      payload: { updates }
    });
    setShowBulkRenameModal(false);
  };

  // Planned game handlers
  const handleCreatePlannedGame = () => {
    dispatch({ type: 'CREATE_PLANNED_GAME' });
  };

  const handleSelectPlannedGameSlot = (blockId, slotIndex) => {
    dispatch({
      type: 'SET_PLANNED_GAME_SLOT',
      payload: { blockId, slotIndex }
    });
  };

  const handleAddPlayerToPlannedGame = (blockId, playerId) => {
    dispatch({
      type: 'ADD_PLAYER_TO_PLANNED_GAME',
      payload: { blockId, playerId }
    });
  };

  const handleRemovePlayerFromPlannedGame = (blockId, slotIndex) => {
    dispatch({
      type: 'REMOVE_PLAYER_FROM_PLANNED_GAME',
      payload: { blockId, slotIndex }
    });
  };

  const handleDeletePlannedGame = (blockId) => {
    dispatch({
      type: 'DELETE_PLANNED_GAME',
      payload: { blockId }
    });
  };

  const handleCalculatePosition = (blockId, position) => {
    dispatch({
      type: 'UPDATE_PLANNED_GAME_POSITION',
      payload: { blockId, position }
    });
  };

  const handleRemoveFromCourt = (playerId) => {
    dispatch({
      type: 'REMOVE_FROM_COURT',
      payload: { playerId }
    });
  };

  // Mark player as left/resting handlers
  const handleMarkAsLeft = (playerId) => {
    dispatch({
      type: 'MARK_PLAYER_AS_LEFT',
      payload: { playerId }
    });
    setMarkPlayerModal({ isOpen: false, playerId: null });
  };

  const handleMarkAsResting = (playerId) => {
    dispatch({
      type: 'MARK_PLAYER_AS_RESTING',
      payload: { playerId }
    });
    setMarkPlayerModal({ isOpen: false, playerId: null });
  };

  // Substitute player handler
  const handleSubstitute = (playerToRemove, playerToAdd, courtNumber) => {
    dispatch({
      type: 'SUBSTITUTE_PLAYER',
      payload: { playerToRemove, playerToAdd, courtNumber }
    });
    setSubstituteModal({ isOpen: false, playerId: null, courtNumber: null });
  };

  // Restore player handler
  const handleRestorePlayer = (playerId) => {
    dispatch({
      type: 'RESTORE_PLAYER',
      payload: { playerId }
    });
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (canUndo) {
      dispatch({ type: 'UNDO' });
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      dispatch({ type: 'REDO' });
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+Z / Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Cmd+Shift+Z / Ctrl+Shift+Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Cmd+Y / Ctrl+Y for redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  // Tutorial handlers
  const handleFinishTutorial = () => {
    setShowHelp(false);
    localStorage.setItem('badminton-help-completed', 'true');
  };

  const handleSkipTutorial = () => {
    setShowWelcomeModal(false);
    setShowHelp(false);
    localStorage.setItem('badminton-help-completed', 'true');
  };

  const handleStartTutorial = () => {
    setShowWelcomeModal(false);
  };

  // Tutorial visibility logic
  const activePlayers = Object.values(state.players).filter(p =>
    state.playerStatus[p.playerNumber]?.state !== 'left'
  );
  const allDefaultNames = activePlayers.every(p => p.name.startsWith('Player #'));

  const court1Players = state.courts[1] ? state.courts[1].playerIds.length : 0;

  // Get priority court
  const priorityCourt = getPriorityCourt(state);

  const noPlayersOnCourt = Object.values(state.courts).every(court => court.playerIds.length === 0);
  const court1PartiallyFilled = court1Players >= 1 && court1Players < 4;
  const court1Full = court1Players === 4;
  const totalPlayersOnCourt = Object.values(state.courts).reduce((sum, court) => sum + court.playerIds.length, 0);
  const maxCourtCapacity = state.config.courtCount * 4;
  const hasEmptyCourtSlots = totalPlayersOnCourt < maxCourtCapacity;
  const hasAnyDeclaredGames = Object.values(state.queueBlocks).some(block => block && block.type === 'game_ended');

  // Determine which tutorial tips should be visible
  const visibleTips = {};
  if (showHelp) {
    // First 5 tips - show before any games are declared
    if (!hasAnyDeclaredGames) {
      // Tip 1: Rename players - show if all players have default names
      visibleTips.renamePlayers = allDefaultNames;

      // Tip 2: Assign first players - show when no players are on court at all
      visibleTips.assignFirst = noPlayersOnCourt && !court1PartiallyFilled;

      // Tip 3: Fill court - show when court 1 has 1-3 players (not full)
      visibleTips.fillCourt = court1PartiallyFilled && !noPlayersOnCourt;

      // Tip 4: Continue adding - show when court 1 is full but not all courts are full
      visibleTips.continueAdding = court1Full && hasEmptyCourtSlots;

      // Tip 5: Declare winner - show as soon as court 1 is full
      visibleTips.declareWinner = court1Full;
    } else {
      // After first game is declared, show remaining tips
      // Tip 6: Add players - show when there's at least one queue block
      visibleTips.addPlayers = true;

      // Tip 7: Rest button - show when there are queued players
      visibleTips.restButton = true;

      // Tip 8: Queue blocks - show when there are multiple queue blocks
      visibleTips.queueBlocks = true;

      // Tip 9: Substitute player - show when there are players on court
      visibleTips.substitutePlayer = true;

      // Tip 10: Undo button - show always after first game
      visibleTips.undoButton = true;

      // Tip 11: Plan a game - show when there are queued players
      visibleTips.planGame = true;
    }
  }

  if (!state.config.sessionStarted) {
    return (
      <>
        <div className="app">
          <div className="settings-container">
            <div className="settings-card">
              <Settings
                courtCount={tempConfig.courtCount}
                playerCount={tempConfig.playerCount}
                onChange={handleSettingsChange}
              />
              <div className="app__actions">
                <button
                  type="button"
                  className="start-session-btn"
                  onClick={handleStartSession}
                  disabled={tempConfig.courtCount < 1 || tempConfig.playerCount < 1}
                >
                  Let's go!
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* New Session Warning Modal */}
        <Modal
          isOpen={showNewSessionModal}
          title="Existing Session Found"
          message="You have an existing session. Starting a new session will clear all data. Continue?"
          onConfirm={handleConfirmNewSession}
          onCancel={() => setShowNewSessionModal(false)}
          confirmText="Start New Session"
          cancelText="Cancel"
        />
      </>
    );
  }

  const playerCount = Object.keys(state.players).length;
  const restingPlayerCount = Object.values(state.players).filter(p =>
    state.playerStatus[p.playerNumber]?.state === 'resting' ||
    state.playerStatus[p.playerNumber]?.state === 'left'
  ).length;

  const handleResetSession = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = () => {
    clearState(); // Clear saved state
    dispatch({ type: 'RESET_SESSION' });
    setShowResetModal(false);
  };

  return (
    <div className="session">
      {/* Full-width menu bar */}
      <div className="session__menu">
        <div className="session__menu-brand">
          <img src="/peg_white.png" alt="Logo" className="session__menu-logo" />
          <span className="session__menu-title">THE PEG BOARD</span>
          <button
            type="button"
            onClick={handleResetSession}
            title="New Session"
            className="session__menu-new"
          >
            <i className="fas fa-plus"></i>
            <span> New Session</span>
          </button>
        </div>
        <div className="session__menu-controls">
          <Tutored show={visibleTips.undoButton} side="bottom" direction="up" color="#3b82f6" gap={10} label="Undo">
            <button
              type="button"
              onClick={handleUndo}
              className="session__menu-btn"
              title="Undo (Cmd/Ctrl+Z)"
              disabled={!canUndo}
            >
              <i className="fas fa-undo"></i>
              {windowWidth > 800 && <span> Undo</span>}
            </button>
          </Tutored>
          {restingPlayerCount > 0 && (
            <button
              type="button"
              onClick={() => setShowRestorePlayersModal(true)}
              className="session__menu-btn"
              title="Resting Players"
            >
              <i className="fa-solid fa-moon"></i>
              <span> Resting Players ({restingPlayerCount})</span>
            </button>
          )}
          <Tutored show={visibleTips.renamePlayers} side="bottom" direction="up" color="white" gap={10} label="Rename">
            <button
              type="button"
              onClick={() => setShowBulkRenameModal(true)}
              className="session__menu-btn"
              title="Rename Players"
            >
              <i className="fas fa-edit"></i>
              <span> Rename Players</span>
            </button>
          </Tutored>
          <button
            type="button"
            onClick={() => setQueueCollapsed(!queueCollapsed)}
            title={queueCollapsed ? "Show Court Queue" : "Hide Court Queue"}
            className={`session__menu-btn ${queueCollapsed ? 'active' : ''}`}
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
              courts={state.courts}
              players={state.players}
              courtCount={state.config.courtCount}
              priorityCourt={priorityCourt}
              hoveredPlayer={hoveredPlayer}
              queueBlocks={state.queueBlocks}
              isSelectingForPlannedGame={!!state.ui?.selectedPlannedGameSlot}
              visibleTips={visibleTips}
              onPlayerClick={(playerId) => {
                if (state.ui?.selectedPlannedGameSlot) {
                  handleAddPlayerToPlannedGame(state.ui.selectedPlannedGameSlot.blockId, playerId);
                }
              }}
              onPlayerHover={setHoveredPlayer}
              onRemoveFromCourt={handleRemoveFromCourt}
              onSubstitutePlayer={(playerId, courtNumber) => setSubstituteModal({ isOpen: true, playerId, courtNumber })}
              onRotatePairing={handleRotatePairing}
              onFinishGame={handleFinishGame}
            />
          </div>
        </div>

        {/* Queue Area */}
        <div className={`queue-column ${queueCollapsed ? 'queue-column--collapsed' : ''}`}>
          {!queueCollapsed && (
            <>
              <div className="queue-column__content">
                <QueueArea
                players={state.players}
                playerStatus={state.playerStatus}
                queueBlocks={state.queueBlocks}
                queueBlockOrder={state.queueBlockOrder}
                courts={state.courts}
                priorityCourt={priorityCourt}
                hoveredPlayer={hoveredPlayer}
                selectedPlannedGameSlot={state.ui?.selectedPlannedGameSlot}
                shouldShowPreviewBlock={visibleTips.declareWinner}
                visibleTips={visibleTips}
                onSendToCourt={handleSendToCourt}
                onPlayerHover={setHoveredPlayer}
                onCreatePlannedGame={handleCreatePlannedGame}
                onSelectPlannedGameSlot={handleSelectPlannedGameSlot}
                onAddPlayerToPlannedGame={handleAddPlayerToPlannedGame}
                onDeletePlannedGame={handleDeletePlannedGame}
                onCalculatePosition={handleCalculatePosition}
                onMarkPlayer={(playerId) => setMarkPlayerModal({ isOpen: true, playerId })}
              />
              </div>

              {/* Fixed Add Player button */}
              <Tutored show={visibleTips.addPlayers} side="top" direction="down" color="#10b981" gap={70} label="Add Player">
                <button
                  type="button"
                  className="queue-column__add-player"
                  onClick={handleAddPlayer}
                >
                  <i className="fas fa-plus"></i>
                  <span> Add Player</span>
                </button>
              </Tutored>
            </>
          )}
        </div>

        {/* Backdrop for overlay mode */}
        {!queueCollapsed && windowWidth <= 1350 && (
          <div
            className="queue-backdrop"
            onClick={() => setQueueCollapsed(true)}
          />
        )}
      </div>

      {/* Reset Session Modal */}
      <Modal
        isOpen={showResetModal}
        title="Start New Session"
        message="Starting a new session will clear all current data. Are you sure?"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
        confirmText="Start New Session"
        cancelText="Cancel"
      />

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={gameResultModal.isOpen}
        courtNumber={gameResultModal.courtNumber}
        pairing={gameResultModal.courtNumber ? getCurrentPairing(state.courts[gameResultModal.courtNumber]) : null}
        players={state.players}
        onConfirm={handleGameResult}
        onCancel={() => setGameResultModal({ isOpen: false, courtNumber: null })}
      />

      {/* Bulk Rename Modal */}
      <BulkRenameModal
        isOpen={showBulkRenameModal}
        players={state.players}
        onSave={handleBulkRename}
        onCancel={() => setShowBulkRenameModal(false)}
      />

      {/* Mark Player Modal */}
      <MarkPlayerModal
        isOpen={markPlayerModal.isOpen}
        player={markPlayerModal.playerId ? state.players[markPlayerModal.playerId] : null}
        onMarkAsLeft={handleMarkAsLeft}
        onMarkAsResting={handleMarkAsResting}
        onCancel={() => setMarkPlayerModal({ isOpen: false, playerId: null })}
      />

      {/* Substitute Player Modal */}
      <SubstitutePlayerModal
        isOpen={substituteModal.isOpen}
        player={substituteModal.playerId ? state.players[substituteModal.playerId] : null}
        courtNumber={substituteModal.courtNumber}
        availablePlayers={Object.values(state.players).filter(p => {
          const status = state.playerStatus[p.playerNumber];
          // Only show queue players not in planned games and not resting/left
          return status?.location === 'queue' &&
                 status?.state !== 'resting' &&
                 status?.state !== 'left' &&
                 !Object.values(state.queueBlocks).some(block =>
                   block.type === 'planned_game' &&
                   block.playerIds &&
                   block.playerIds.includes(p.playerNumber)
                 );
        })}
        onSubstitute={handleSubstitute}
        onCancel={() => setSubstituteModal({ isOpen: false, playerId: null, courtNumber: null })}
      />

      {/* Restore Players Modal */}
      <RestorePlayersModal
        isOpen={showRestorePlayersModal}
        restingPlayers={Object.values(state.players).filter(p =>
          state.playerStatus[p.playerNumber]?.state === 'resting'
        )}
        leftPlayers={Object.values(state.players).filter(p =>
          state.playerStatus[p.playerNumber]?.state === 'left'
        )}
        onRestore={(playerId) => {
          handleRestorePlayer(playerId);
          setShowRestorePlayersModal(false);
        }}
        onCancel={() => setShowRestorePlayersModal(false)}
      />

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal
          onSkipTutorial={handleSkipTutorial}
          onStart={handleStartTutorial}
        />
      )}

      {/* Tutorial Help Bar */}
      {showHelp && (
        <TutorialHelpBar
          queueCollapsed={queueCollapsed}
          visibleTips={visibleTips}
          court1Players={court1Players}
          onFinishTutorial={handleFinishTutorial}
        />
      )}
    </div>
  );
};

export default BadmintonQueue_refactor;