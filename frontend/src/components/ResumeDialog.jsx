import React from 'react';

export default function ResumeDialog({ onResume, onNewGame, savedProgress }) {
  if (!savedProgress) {
    return null;
  }

  const progress = savedProgress;
  const currentQuestion = progress.questions[progress.currentQuestionIndex];
  const totalQuestions = progress.questions.length;
  const progressPercent = Math.round((progress.currentQuestionIndex / totalQuestions) * 100);
  const savedDate = new Date(progress.savedAt);

  return (
    <div className="resume-dialog-overlay">
      <div className="resume-dialog">
        <div className="resume-header mb-6">
          <h2 className="text-[#00ff41] font-mono text-3xl mb-2 text-center">
            SESSION DETECTED
          </h2>
          <div className="terminal-border"></div>
        </div>

        <div className="resume-info mb-6">
          <div className="resume-item mb-3">
            <span className="text-[#00ff41] font-mono text-lg">
              SECTOR: {progress.currentBlock}
            </span>
          </div>
          <div className="resume-item mb-3">
            <span className="text-[#00ff41] font-mono text-lg">
              PROGRESS: {progress.currentQuestionIndex + 1} / {totalQuestions} ({progressPercent}%)
            </span>
          </div>
          <div className="resume-item mb-3">
            <span className="text-[#00ff41] font-mono text-lg">
              SCORE: {progress.score} / {totalQuestions}
            </span>
          </div>
          <div className="resume-item mb-3">
            <span className="text-[#00ff41] font-mono text-sm opacity-75">
              SAVED: {savedDate.toLocaleString()}
            </span>
          </div>
          {currentQuestion && (
            <div className="resume-item mt-4 p-3 border border-[#00ff41] bg-black/40">
              <span className="text-[#00ff41] font-mono text-sm">
                CURRENT QUESTION: {currentQuestion.text?.substring(0, 60)}...
              </span>
            </div>
          )}
        </div>

        <div className="resume-buttons flex gap-4 justify-center">
          <button
            onClick={onResume}
            className="resume-button resume-btn"
          >
            [CONTINUE SESSION]
          </button>
          <button
            onClick={onNewGame}
            className="resume-button new-game-btn"
          >
            [START NEW GAME]
          </button>
        </div>
      </div>
    </div>
  );
}

