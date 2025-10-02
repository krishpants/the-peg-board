/**
 * Normalized Game State Store
 *
 * Core principle: Single source of truth for all data
 * - Players are stored once in a normalized map
 * - Other structures only store player IDs
 * - All computed values are derived, not stored
 */

export const createInitialState = () => ({
  // Session configuration
  config: {
    courtCount: 4,
    maxPlayers: 20,
    sessionStarted: false,
  },

  // Normalized player data - single source of truth
  // Structure: { [playerNumber]: { playerNumber, name, createdAt } }
  players: {},

  // Player status tracking - where are they?
  // Structure: { [playerNumber]: { location: 'court'|'queue'|'bench', courtNumber?, queueBlockId? } }
  playerStatus: {},

  // Queue blocks - only store player IDs
  // Structure: { [blockId]: { id, playerIds: [], sourceCourt, timestamp, closed } }
  queueBlocks: {},
  queueBlockOrder: [], // Array of blockId in display order

  // Court assignments - only store player IDs
  // Structure: { [courtNumber]: { playerIds: [], pairingIndex: 0, startTime } }
  courts: {},

  // Planned games - only store player IDs
  // Structure: { [gameId]: { id, slots: [playerId|null, ...], createdAt } }
  plannedGames: {},
  plannedGameOrder: [], // Array of gameId in display order

  // UI State (could be separated)
  ui: {
    selectedPlannedGameSlot: null,
    hoveredPlayerId: null,
    hoveredCourtNumber: null,
  }
});

/**
 * Player factory with auto-incrementing ID
 */
export const createPlayer = (playerNumber, name = null) => ({
  playerNumber,
  name: name || `Player #${playerNumber}`,
  createdAt: Date.now(),
});

/**
 * Queue block factory
 */
let queueBlockCounter = 1; // Sequential counter for block IDs

export const resetQueueBlockCounter = () => {
  queueBlockCounter = 1;
};

export const createQueueBlock = (type = 'new_players', sourceCourt = null, explicitDisplayOrder = null) => {
  const blockId = queueBlockCounter++;

  // Display order can be explicitly set, or default based on type
  const displayOrder = explicitDisplayOrder !== null ? explicitDisplayOrder :
    type === 'planned_game' ? null :
    0; // Will be set by reducer based on actual position

  return {
    id: blockId,
    type, // 'new_players', 'game_ended', 'planned_game'
    playerIds: [],
    sourceCourt,
    timestamp: Date.now(),
    closed: type === 'game_ended', // Game ended blocks are immediately closed
    displayOrder,
    targetSlot: type === 'planned_game' ? 0 : null, // Track which slot we're filling
  };
};

/**
 * Planned game factory
 */
export const createPlannedGame = () => ({
  id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  slots: [null, null, null, null],
  createdAt: Date.now(),
});

/**
 * Get player data by ID
 */
export const getPlayer = (state, playerId) => {
  return state.players[playerId] || null;
};

/**
 * Get player's current location
 */
export const getPlayerLocation = (state, playerId) => {
  return state.playerStatus[playerId] || { location: 'unknown' };
};

/**
 * Get all players on a specific court
 */
export const getCourtPlayers = (state, courtNumber) => {
  const court = state.courts[courtNumber];
  if (!court) return [];

  return court.playerIds.map(id => getPlayer(state, id)).filter(Boolean);
};

/**
 * Get all players in a queue block
 */
export const getQueueBlockPlayers = (state, blockId) => {
  const block = state.queueBlocks[blockId];
  if (!block) return [];

  return block.playerIds.map(id => getPlayer(state, id)).filter(Boolean);
};

/**
 * Check if a court has space
 */
export const courtHasSpace = (state, courtNumber) => {
  const court = state.courts[courtNumber];
  return !court || court.playerIds.length < 4;
};

/**
 * Get priority court (first court with space)
 */
export const getPriorityCourt = (state) => {
  // First check partially filled courts
  for (let i = 1; i <= state.config.courtCount; i++) {
    const court = state.courts[i];
    if (court && court.playerIds.length > 0 && court.playerIds.length < 4) {
      return i;
    }
  }

  // Then check empty courts
  for (let i = 1; i <= state.config.courtCount; i++) {
    if (!state.courts[i] || state.courts[i].playerIds.length === 0) {
      return i;
    }
  }

  return null;
};

/**
 * Generate all possible pairings from 4 players
 * Returns array of 3 possible pairing configurations
 */
export const generatePairings = (fourPlayerIds) => {
  if (!fourPlayerIds || fourPlayerIds.length !== 4) return [];
  const [a, b, c, d] = fourPlayerIds;
  return [
    { pair1: [a, b], pair2: [c, d] },
    { pair1: [a, c], pair2: [b, d] },
    { pair1: [a, d], pair2: [b, c] }
  ];
};

/**
 * Get the current pairing for a court based on its pairingIndex
 */
export const getCurrentPairing = (court) => {
  if (!court || court.playerIds.length !== 4) return null;
  const pairings = generatePairings(court.playerIds);
  return pairings[court.pairingIndex] || pairings[0];
};