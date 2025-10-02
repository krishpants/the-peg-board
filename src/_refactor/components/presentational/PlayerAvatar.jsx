import React from 'react';

/**
 * PlayerAvatar - Generates a consistent pixel-art identicon for a player
 * based on their name. Uses an 8x10 grid with symmetry and center-weighted dot placement.
 */

// Simple hash function to convert string to number
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate bright neon color from hash
const getColorFromHash = (hash) => {
  // Bright neon colors that pop on black
  const neonColors = [
    '#ff006e', // Hot Pink
    '#fb5607', // Orange
    '#ffbe0b', // Yellow
    '#8ac926', // Lime Green
    '#1ec8a5', // Cyan
    '#3a86ff', // Blue
    '#8338ec', // Purple
    '#ff006e', // Magenta
    '#00f5ff', // Electric Cyan
    '#39ff14', // Neon Green
    '#fe00fe', // Neon Magenta
    '#ff073a', // Neon Red
  ];

  return neonColors[hash % neonColors.length];
};

// Seeded random number generator
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get probability for a position based on distance from center
const getProbability = (x, y, width, height) => {
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

  // Probability decreases with distance from center
  // Higher overall probability for fuller patterns
  // At center: ~0.85, at edges: ~0.45
  return 0.85 - (distance / maxDistance) * 0.4;
};

// Generate pixel grid pattern
const generatePattern = (name) => {
  const hash = hashString(name || 'Player');
  const color = getColorFromHash(hash);

  // Determine symmetry type from hash (0: vertical, 1: horizontal, 2: both, 3: rotational)
  const symmetryType = hash % 4;

  const width = 8;
  const height = 8;
  const grid = Array(height).fill(null).map(() => Array(width).fill(false));

  // Generate base pattern with center-weighted probability
  let seed = hash;

  if (symmetryType === 0) {
    // Vertical symmetry - generate left half
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < Math.ceil(width / 2); x++) {
        const probability = getProbability(x, y, width, height);
        const random = seededRandom(seed++);
        grid[y][x] = random < probability;
      }
    }
    // Mirror to right half
    for (let y = 0; y < height; y++) {
      for (let x = Math.ceil(width / 2); x < width; x++) {
        grid[y][x] = grid[y][width - 1 - x];
      }
    }
  } else if (symmetryType === 1) {
    // Horizontal symmetry - generate top half
    for (let y = 0; y < Math.ceil(height / 2); y++) {
      for (let x = 0; x < width; x++) {
        const probability = getProbability(x, y, width, height);
        const random = seededRandom(seed++);
        grid[y][x] = random < probability;
      }
    }
    // Mirror to bottom half
    for (let y = Math.ceil(height / 2); y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x] = grid[height - 1 - y][x];
      }
    }
  } else if (symmetryType === 2) {
    // Both axes symmetry - generate top-left quarter
    for (let y = 0; y < Math.ceil(height / 2); y++) {
      for (let x = 0; x < Math.ceil(width / 2); x++) {
        const probability = getProbability(x, y, width, height);
        const random = seededRandom(seed++);
        grid[y][x] = random < probability;
      }
    }
    // Mirror horizontally first
    for (let y = 0; y < Math.ceil(height / 2); y++) {
      for (let x = Math.ceil(width / 2); x < width; x++) {
        grid[y][x] = grid[y][width - 1 - x];
      }
    }
    // Then mirror vertically
    for (let y = Math.ceil(height / 2); y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x] = grid[height - 1 - y][x];
      }
    }
  } else {
    // Rotational symmetry - generate top-left quarter
    for (let y = 0; y < Math.ceil(height / 2); y++) {
      for (let x = 0; x < Math.ceil(width / 2); x++) {
        const probability = getProbability(x, y, width, height);
        const random = seededRandom(seed++);
        grid[y][x] = random < probability;
      }
    }
    // Apply 180-degree rotational symmetry
    for (let y = 0; y < Math.ceil(height / 2); y++) {
      for (let x = 0; x < Math.ceil(width / 2); x++) {
        grid[height - 1 - y][width - 1 - x] = grid[y][x];
      }
    }
  }

  return { grid, color, width, height };
};

const PlayerAvatar = ({ name, size = 24, className = '' }) => {
  const { grid, color, width, height } = generatePattern(name);

  return (
    <div
      className={`player-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative'
      }}
      title={name}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
      >
        {grid.map((row, y) =>
          row.map((filled, x) =>
            filled ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={color}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export default PlayerAvatar;
