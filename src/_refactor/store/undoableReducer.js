/**
 * Undoable Reducer - Wraps any reducer with undo/redo functionality
 */

const MAX_HISTORY = 50; // Keep last 50 states

// Actions that should be recorded in history (undoable actions)
const UNDOABLE_ACTIONS = [
  'ASSIGN_TO_COURT',
  'REMOVE_FROM_COURT',
  'COMPLETE_GAME',
  'ROTATE_PAIRING',
  'ADD_PLAYER',
  'MARK_PLAYER_AS_LEFT',
  'MARK_PLAYER_AS_RESTING',
  'SUBSTITUTE_PLAYER',
  'CREATE_PLANNED_GAME',
  'ADD_PLAYER_TO_PLANNED_GAME',
  'REMOVE_PLAYER_FROM_PLANNED_GAME',
  'DELETE_PLANNED_GAME',
];

// Helper to check if a state has empty planned games that would be auto-deleted
const hasEmptyPlannedGames = (state) => {
  return Object.values(state.queueBlocks).some(block =>
    block.type === 'planned_game' &&
    block.playerIds.every(id => id === null)
  );
};

// Helper to validate and clean UI state after undo/redo
const cleanUIState = (state) => {
  if (!state.ui || !state.ui.selectedPlannedGameSlot) {
    return state;
  }

  const { blockId } = state.ui.selectedPlannedGameSlot;

  // Check if the selected planned game block still exists
  if (!state.queueBlocks[blockId] || state.queueBlocks[blockId].type !== 'planned_game') {
    // Clear invalid selection
    return {
      ...state,
      ui: {
        ...state.ui,
        selectedPlannedGameSlot: null,
      },
    };
  }

  return state;
};

export const undoableReducer = (reducer) => {
  return (state, action) => {
    const { past, present, future } = state;

    switch (action.type) {
      case 'UNDO': {
        if (!past || past.length === 0) {
          return state; // Nothing to undo
        }

        let newPast = [...past];
        let statesSkipped = [];
        let targetState = null;

        // Keep going back through history, skipping transient states with empty planned games
        while (newPast.length > 0) {
          const candidate = newPast[newPast.length - 1];
          newPast = newPast.slice(0, newPast.length - 1);

          // If this state has empty planned games, skip it and keep going
          if (hasEmptyPlannedGames(candidate)) {
            statesSkipped.push(candidate);
            continue;
          }

          // Found a stable state
          targetState = candidate;
          break;
        }

        // If we couldn't find a stable state, just use the most recent one
        if (!targetState) {
          targetState = past[past.length - 1];
          newPast = past.slice(0, past.length - 1);
          statesSkipped = [];
        }

        // Simply restore the target state without running it through the reducer
        return {
          past: newPast,
          present: cleanUIState(targetState),
          future: [present, ...statesSkipped, ...future], // Add skipped states to future
        };
      }

      case 'REDO': {
        if (!future || future.length === 0) {
          return state; // Nothing to redo
        }

        let newFuture = [...future];
        let statesSkipped = [];
        let targetState = null;

        // Keep going forward through history, skipping transient states with empty planned games
        while (newFuture.length > 0) {
          const candidate = newFuture[0];
          newFuture = newFuture.slice(1);

          // If this state has empty planned games, skip it and keep going
          if (hasEmptyPlannedGames(candidate)) {
            statesSkipped.push(candidate);
            continue;
          }

          // Found a stable state
          targetState = candidate;
          break;
        }

        // If we couldn't find a stable state, just use the first one
        if (!targetState) {
          targetState = future[0];
          newFuture = future.slice(1);
          statesSkipped = [];
        }

        // Simply restore the target state without running it through the reducer
        return {
          past: [...past, present, ...statesSkipped], // Add skipped states to past
          present: cleanUIState(targetState),
          future: newFuture,
        };
      }

      case 'RESET_SESSION':
      case 'START_SESSION': {
        // These actions reset history
        const newPresent = reducer(present, action);
        return {
          past: [],
          present: newPresent,
          future: [],
        };
      }

      default: {
        // Run the actual reducer
        const newPresent = reducer(present, action);

        // If state didn't change, don't record it
        if (newPresent === present) {
          return state;
        }

        // If this is an undoable action, record it in history
        if (UNDOABLE_ACTIONS.includes(action.type)) {
          return {
            past: [...past, present].slice(-MAX_HISTORY), // Keep last MAX_HISTORY states
            present: newPresent,
            future: [], // Clear future when a new action is performed
          };
        }

        // For non-undoable actions (like UI updates), just update present without recording
        return {
          past,
          present: newPresent,
          future,
        };
      }
    }
  };
};

// Helper to initialize undoable state
export const createUndoableState = (initialState) => ({
  past: [],
  present: initialState,
  future: [],
});
