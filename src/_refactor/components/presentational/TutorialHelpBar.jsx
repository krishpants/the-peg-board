import React from 'react';

const TutorialHelpBar = ({
  queueCollapsed,
  visibleTips = {},
  court1Players = 0,
  onFinishTutorial
}) => {
  return (
    <div className={`help-bar ${queueCollapsed ? 'help-bar--expanded' : ''}`}>
      <div className="help-bar__content">
        <div className="help-bar__title">
          <i className="fas fa-graduation-cap"></i>
          Tutorial
        </div>
        <div className="help-bar__messages">
          {/* Tip 1: Rename players */}
          {visibleTips.renamePlayers && (
            <div className="help-bar__item">
              <i className="fas fa-edit" style={{ color: '#fff', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Rename your players using the rename button - this will help identify who is who
              </span>
            </div>
          )}

          {/* Tip 2: Assign first players - has 2 arrows (queue + court) */}
          {visibleTips.assignFirst && (
            <div className="help-bar__item">
              <i className="fas fa-hand-pointer" style={{ color: '#fbbf24', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Click on your first player to assign them to Court 1
              </span>
            </div>
          )}

          {/* Tip 4: Fill court */}
          {visibleTips.fillCourt && (
            <div className="help-bar__item">
              <i className="fas fa-users" style={{ color: '#fbbf24', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Add {4 - court1Players} more player{4 - court1Players > 1 ? 's' : ''} from anyone in the queue
              </span>
            </div>
          )}

          {/* Tip 5: Continue adding players */}
          {visibleTips.continueAdding && (
            <div className="help-bar__item">
              <i className="fas fa-user-plus" style={{ color: '#fbbf24', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Continue adding players to fill the remaining slots
              </span>
            </div>
          )}

          {/* Tip 6: Declare winner */}
          {visibleTips.declareWinner && (
            <div className="help-bar__item">
              <i className="fas fa-trophy" style={{ color: '#ef4444', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                When a game ends, click the trophy button to declare the winner
              </span>
            </div>
          )}

          {/* Tip 6: Add new players */}
          {visibleTips.addPlayers && (
            <div className="help-bar__item">
              <i className="fas fa-user-plus" style={{ color: '#10b981', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                If new players arrive, add them with the Add Player button
              </span>
            </div>
          )}

          {/* Tip 7: Plan a game */}
          {visibleTips.planGame && (
            <div className="help-bar__item">
              <i className="fas fa-calendar-check" style={{ color: '#00bfff', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Plan a game with specific players - game will be put in a queue to ensure fairness
              </span>
            </div>
          )}

          {/* Tip 8: Queue blocks */}
          {visibleTips.queueBlocks && (
            <div className="help-bar__item">
              <i className="fas fa-list-ol" style={{ color: '#ef4444', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Court priority is shown in blocks depending on when each group of players came off court or arrived to the session
              </span>
            </div>
          )}

          {/* Tip 9: Substitute player */}
          {visibleTips.substitutePlayer && (
            <div className="help-bar__item">
              <i className="fas fa-exchange-alt" style={{ color: '#fbbf24', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Click on a playing player to substitute them
              </span>
            </div>
          )}

          {/* Tip 10: Rest button */}
          {visibleTips.restButton && (
            <div className="help-bar__item">
              <i className="fa-solid fa-moon" style={{ color: '#a78bfa', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                Use the rest button on queued players to mark them as resting or left session
              </span>
            </div>
          )}

          {/* Tip 11: Undo button */}
          {visibleTips.undoButton && (
            <div className="help-bar__item">
              <i className="fas fa-undo" style={{ color: '#3b82f6', backgroundColor: '#1f2937', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'center', width: '24px', height: '24px', alignItems: 'center' }}></i>
              <span className="help-bar__text">
                You can undo mistakes with the undo button
              </span>
            </div>
          )}

          {/* Finish button - always shown at bottom */}
          <button
            type="button"
            className="help-bar__finish-btn"
            onClick={onFinishTutorial}
          >
            <i className="fas fa-check-circle"></i>
            Finish Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialHelpBar;
