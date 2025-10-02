import React from 'react';

const WelcomeModal = ({ onSkipTutorial, onStart }) => {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onStart()}
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
            onClick={onSkipTutorial}
            className="modal__btn modal__btn--secondary"
          >
            Skip Tutorial
          </button>
          <button
            type="button"
            onClick={onStart}
            className="modal__btn modal__btn--primary"
          >
            Let's get started!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
