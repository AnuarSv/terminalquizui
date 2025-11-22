import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, GAME_STATES } from '../store/gameStore';
import QuestionCard from './QuestionCard';
import GlitchEffect from './GlitchEffect';

export default function Game() {
  const {
    gameState,
    questions,
    currentQuestionIndex,
    submitAnswer,
    wrongAnswers,
    goToReview,
    resetGame,
    retryWrongQuestions,
    accuracy,
    moveToNextQuestion,
  } = useGameStore();

  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(null);
  const feedbackTimerRef = useRef(null);

  // Set random avatar for each question
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING && questions.length > 0) {
      const randomAvatar = Math.floor(Math.random() * 8) + 1;
      setCurrentAvatar(randomAvatar);
    }
  }, [currentQuestionIndex, gameState, questions.length]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  
  const handleAnswer = (answer) => {
    if (!currentQuestion) return;
    
    // Submit answer and get result
    const result = submitAnswer(answer, currentQuestion);
    
    // Check if result is valid
    if (!result || typeof result.isCorrect === 'undefined') {
      console.error('Invalid result from submitAnswer:', result);
      setFeedback({
        type: 'error',
        text: 'ERROR: Failed to validate answer',
      });
      return;
    }
    
    const correctAnswerText = getCorrectAnswer(currentQuestion);
    setCurrentCorrectAnswer(correctAnswerText);
    setShowAnswer(true);
    
    // Show feedback based on result
    const nextFeedback = {
      type: result.isCorrect ? 'success' : 'error',
      text: result.isCorrect 
        ? `ACCESS GRANTED – CORRECT (${result.score || 0}/${result.totalQuestions || questions.length})` 
        : `ACCESS DENIED – INCORRECT (${result.score || 0}/${result.totalQuestions || questions.length})`,
    };
    setFeedback(nextFeedback);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const handleNext = () => {
    // Reset answer display state
    setShowAnswer(false);
    setCurrentCorrectAnswer(null);
    // Move to next question
    moveToNextQuestion();
  };

  // Reset showAnswer when question changes
  useEffect(() => {
    setShowAnswer(false);
    setCurrentCorrectAnswer(null);
  }, [currentQuestionIndex]);

  const handleRetryFailures = () => {
    const success = retryWrongQuestions();
    if (!success) {
      setFeedback({
        type: 'info',
        text: 'NO FAILURES LEFT TO RETRY',
      });
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
    }
  };

  const getCorrectAnswer = (question) => {
    if (!question) return '';
    if (question.type === 'single_choice') {
      const correct = question.options?.find(opt => opt.is_correct);
      return correct ? `${correct.id}. ${correct.text}` : 'N/A';
    } else if (question.type === 'multiple_choice') {
      const correct = question.options?.filter(opt => opt.is_correct);
      return correct.map(opt => `${opt.id}. ${opt.text}`).join(', ');
    } else if (question.type === 'text_input') {
      return question.accepted_answers?.join(' or ') || 'N/A';
    }
    return 'N/A';
  };

  if (gameState === GAME_STATES.GAME_OVER) {
    return (
      <GlitchEffect
        type="game_over"
        onRestart={resetGame}
        onReview={goToReview}
        onRetryFailures={wrongAnswers.length ? handleRetryFailures : null}
        canRetry={wrongAnswers.length > 0}
      />
    );
  }

  if (gameState === GAME_STATES.WIN) {
    return (
      <GlitchEffect
        type="win"
        onReview={goToReview}
        onRestart={resetGame}
        onRetryFailures={wrongAnswers.length ? handleRetryFailures : null}
        canRetry={wrongAnswers.length > 0}
      />
    );
  }

  if (gameState === GAME_STATES.REVIEW_ERRORS) {
    return <ErrorReview onRestart={resetGame} />;
  }

  if (gameState === GAME_STATES.PLAYING) {
    if (!currentQuestion || !questions || questions.length === 0) {
      return (
        <div className="error-message">
          <span className="text-[#ff0000] font-mono">ERROR: No questions loaded</span>
          <button onClick={resetGame} className="restart-button mt-4">
            [RETURN TO MENU]
          </button>
        </div>
      );
    }
    return (
      <div className="game-container">
        <div className="game-layout">
          {/* Avatar Section */}
          <div className="avatar-section">
            {currentAvatar && (
              <img
                src={`/db/avas/${currentAvatar}.jpg`}
                alt={`User avatar ${currentAvatar}`}
                className="avatar-image"
                onError={(e) => {
                  // Fallback to virus image if avatar fails
                  const img = e.target;
                  if (img.src !== `${window.location.origin}/db/avas/v.jpg`) {
                    img.src = '/db/avas/v.jpg';
                  } else {
                    img.style.display = 'none';
                  }
                }}
              />
            )}
            {currentAvatar && (
              <div className="avatar-label text-[#00ff41] font-mono text-sm mt-2">
                USER_{currentAvatar}
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="question-section">
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              showAnswer={showAnswer}
              correctAnswer={currentCorrectAnswer}
              onNext={showAnswer ? handleNext : null}
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <span className="text-[#00ff41] font-mono text-sm">
            QUESTION {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        {feedback && (
          <div className={`feedback-overlay ${feedback.type}`}>
            {feedback.text}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ErrorReview({ onRestart }) {
  const { wrongAnswers, retryWrongQuestions } = useGameStore();

  return (
    <div className="error-review">
      <div className="review-header mb-8">
        <h2 className="text-[#00ff41] font-mono text-2xl mb-2">
          ERROR LOG REVIEW
        </h2>
        <div className="terminal-border"></div>
      </div>

      <div className="review-content space-y-6">
        {wrongAnswers.length === 0 ? (
          <div className="text-[#00ff41] font-mono">
            NO ERRORS RECORDED. SYSTEM CLEAN.
          </div>
        ) : (
          wrongAnswers.map((error, index) => {
            const question = error.question || {};
            return (
              <div key={index} className="error-item terminal-border p-4">
                <div className="error-question mb-3">
                  <span className="text-[#00ff41] font-mono text-sm">
                    Q{question.id || index + 1}: {question.text || 'Question text not available'}
                  </span>
                </div>
                
                <div className="error-details space-y-2">
                  <div>
                    <span className="text-[#ff0000] font-mono text-sm">
                      YOUR ANSWER:
                    </span>
                    <span className="text-[#00ff41] font-mono text-sm ml-2">
                      {typeof error.userAnswer === 'string' 
                        ? (error.userAnswer || 'No answer provided')
                        : Array.isArray(error.userAnswer)
                        ? (error.userAnswer.length > 0 ? error.userAnswer.join(', ') : 'No answer provided')
                        : 'No answer provided'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[#00ff41] font-mono text-sm">
                      CORRECT ANSWER:
                    </span>
                    <span className="text-[#00ff41] font-mono text-sm ml-2">
                      {error.correctAnswer || 'N/A'}
                    </span>
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-2">
                      <span className="text-[#00ff41] font-mono text-xs opacity-75">
                        EXPLANATION: {question.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={onRestart}
        className="review-button mt-8"
      >
        [RETURN TO ROOT]
      </button>

      {wrongAnswers.length > 0 && (
        <button
          onClick={retryWrongQuestions}
          className="retry-button mt-4"
        >
          [RETRY FAILED QUESTIONS]
        </button>
      )}
    </div>
  );
}

