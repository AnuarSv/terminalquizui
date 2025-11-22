import React, { useState, useEffect } from 'react';

export default function GlitchEffect({ type, onRestart, onReview, onRetryFailures, canRetry, accuracy }) {
  const [glitchActive, setGlitchActive] = useState(true);

  useEffect(() => {
    let interval;
    let timeoutId;
    if (type === 'game_over') {
      document.body.classList.add('death-glitch');
      interval = setInterval(() => {
        setGlitchActive((prev) => !prev);
      }, 100);
      
      timeoutId = setTimeout(() => {
        if (interval) {
          clearInterval(interval);
        }
        setGlitchActive(false);
      }, 2000);
    } else {
      document.body.classList.remove('death-glitch');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.body.classList.remove('death-glitch');
    };
  }, [type]);

  const formattedAccuracy = typeof accuracy === 'number'
    ? `${Math.round(accuracy * 100)}%`
    : null;

  if (type === 'game_over') {
    return (
      <div className={`glitch-container ${glitchActive ? 'glitch-active' : ''}`}>
        <div className="death-overlay" />
        <div className="game-over-screen">
          <div className="virus-image-container">
            <img
              src="/db/avas/v.jpg"
              alt="Virus"
              className="virus-image"
            />
          </div>
          <div className="game-over-message">
            <h1 className="text-[#ff0000] font-mono text-4xl mb-4 glitch-text">
              SYSTEM BREACHED
            </h1>
            <h2 className="text-[#ff0000] font-mono text-2xl mb-8 glitch-text">
              VIRUS UPLOAD COMPLETE
            </h2>
            {formattedAccuracy && (
              <p className="text-[#ff0000] font-mono text-xl mb-6">
                ACCURACY: {formattedAccuracy}
              </p>
            )}
            <div className="win-buttons space-x-4">
              {canRetry && (
                <button onClick={onRetryFailures} className="retry-button">
                  [RETRY FAILED SECTORS]
                </button>
              )}
              {onReview && (
                <button onClick={onReview} className="review-button">
                  [REVIEW LOGS]
                </button>
              )}
              <button onClick={onRestart} className="restart-button">
                [REBOOT SYSTEM]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'win') {
    return (
      <div className="win-screen">
        <div className="win-animation">
          <div className="success-message">
            <h1 className="text-[#00ff41] font-mono text-4xl mb-4">
              THREAT NEUTRALIZED
            </h1>
            <h2 className="text-[#00ff41] font-mono text-2xl mb-8">
              SECTOR SECURE
            </h2>
            {formattedAccuracy && (
              <p className="text-[#00ff41] font-mono text-xl mb-6">
                ACCURACY: {formattedAccuracy}
              </p>
            )}
            <div className="win-buttons space-x-4">
              {canRetry && (
                <button onClick={onRetryFailures} className="retry-button">
                  [RETRY FAILED SECTORS]
                </button>
              )}
              <button onClick={onReview} className="review-button">
                [REVIEW LOGS]
              </button>
              <button onClick={onRestart} className="restart-button">
                [RETURN TO ROOT]
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

