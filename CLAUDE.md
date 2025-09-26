# Claude Code Session Notes

## Project Overview
Badminton queue management app with player tracking, court assignments, and game result management.

## Recent Work: Framer Motion Animations

### What Was Implemented
- Added framer-motion animations to show player movements and court rotations
- Installed framer-motion package via npm
- Implemented animations across multiple components

### Key Components Modified

#### 1. PlayerCard.jsx (`src/components/PlayerCard.jsx`)
- Converted to motion.div with layoutId for cross-component tracking
- Added enter/exit animations with spring physics
- Implemented hover/tap effects on buttons
- Uses `layoutId={`player-${player.playerNumber}`}` for movement tracking

#### 2. QueuePlayerCard.jsx (`src/components/QueuePlayerCard.jsx`)
- Added motion wrapper with slide animations
- Implemented hover/tap effects on court assignment buttons
- Maintains layoutId consistency for player tracking between queue and court

#### 3. QueueBlock.jsx (`src/components/QueueBlock.jsx`)
- Added staggered animations for winner/loser sections
- Implemented AnimatePresence for smooth enter/exit transitions
- Added spring animations for block appearance

#### 4. CourtsArea.jsx (`src/components/CourtsArea.jsx`) - Main Focus
**Problem**: Court pairing rotation animations were challenging to implement
**Solutions Tried**: 
- Layout animations with layoutId (had issues with centering/indirect paths)
- AnimatePresence with container fade (too generic)
- **Final Solution**: Selective fade animation with directional movement

**Current Implementation**:
- Tracks previous pairing state to detect which players moved
- Only animates players who actually changed positions
- Players fade in from the direction they came from:
  - Horizontal swaps: slide from left/right (±30px)
  - Vertical swaps: slide from above/below (±40px)  
  - Diagonal swaps: combination movement (±20px horizontal, ±40px vertical)
- Duration: 0.6s with easeOut transition

#### 5. Styles (`src/styles/main.scss`)
- Fixed player card dimensions (120px x 36px) to prevent warping during animations
- Added motion-specific CSS classes
- Set box-sizing: border-box for consistent sizing
- Added positioning contexts for animation support

### Animation Approach Evolution
1. **Started with**: Full layout animations using layoutId
2. **Problem**: Players took indirect paths (centering issues) during rotation
3. **Tried**: Container-level AnimatePresence (fade whole pairing)
4. **User Feedback**: "I liked the motion, it showed the user what had happened to the pairings"
5. **Final Solution**: Selective fade with directional movement - only animate moved players

### Current State
- ✅ Player movement between queue and court works well
- ✅ Queue block animations working smoothly
- ✅ Court rotation shows which players moved with directional hints
- ⚠️ Court rotation animation is "functionally fine" but could be refined further

### User Preferences Noted
- Preferred individual player movement over container animations
- Wanted to see "what had happened to the pairings" 
- Liked directional movement but felt current implementation could be improved
- Animation should be slower and show movement direction

### Future Considerations
- Court rotation animation could be revisited for better visual polish
- Current selective fade approach works but may need refinement
- Consider alternative animation strategies if layout animations can be made to work smoothly

### Technical Notes
- Uses tween transitions instead of spring for more predictable movement paths
- Each player card has unique keys that include pairing index for proper re-renders
- Movement detection compares player positions between previous and current pairings
- Animation only triggers for players who actually moved positions

## Planned Future Features

### 1. Offline Functionality
- **Goal**: App should work without internet connection
- **Implementation Ideas**: 
  - Service Worker for caching
  - Local storage for game state
  - Offline-first architecture
  - Sync when connection restored

### 2. State Persistence 
- **Goal**: Prevent data loss on accidental page reload
- **Implementation Ideas**:
  - Auto-save to localStorage/sessionStorage
  - Periodic state snapshots
  - Recovery mechanism on page load
  - User confirmation before losing unsaved changes

### 3. Enhanced User Experience
- **Better Instructions**: Clear guidance for new users
- **Inline Help Tips**: Contextual tooltips and hints
- **Onboarding Flow**: Step-by-step introduction to features
- **Interactive Tutorials**: Show users how to use key functions

### 4. User Guidance Improvements
- **Court Management**: How to assign players, rotate pairings
- **Queue System**: Understanding winner/loser flow
- **Game Results**: Best practices for recording outcomes
- **Priority Courts**: When and how to use priority system

## Development Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- Check for lint/typecheck commands if needed for code quality

## Session History
- **Session 1**: Implemented framer-motion animations for player movements and court rotations