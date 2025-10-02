/**
 * LocalStorage persistence for game state
 */

const STORAGE_KEY = 'badmintonQueue_refactor_state';
const STORAGE_VERSION = 1;

export const saveState = (state) => {
  try {
    const stateToSave = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data: {
        ...state,
        // Don't persist UI state
        ui: undefined,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, clearing saved state');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Check if state is too old (24 hours)
    const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      console.warn('Saved state too old, clearing');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};

// Debounce helper for auto-save
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};