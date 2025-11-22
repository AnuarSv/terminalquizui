import React, { useState, useEffect, useRef } from 'react';

export default function QuestionCard({ question, onAnswer, showAnswer, correctAnswer, onNext }) {
  const [typedText, setTypedText] = useState('');
  const [selectedSingle, setSelectedSingle] = useState('');
  const [selectedMultiple, setSelectedMultiple] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const textInputRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    if (!question?.text) return;
    
    setIsTyping(true);
    setTypedText('');
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < question.text.length) {
        setTypedText(question.text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30); // 30ms per character
    
    return () => clearInterval(typeInterval);
  }, [question?.id]);


  // Reset selections on question change
  useEffect(() => {
    setSelectedSingle('');
    setSelectedMultiple([]);
    setTextInput('');
  }, [question?.id]);

  // Auto-focus text input
  useEffect(() => {
    if (question?.type === 'text_input' && textInputRef.current && !isTyping) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [question?.type, isTyping]);

  const handleSubmit = () => {
    let answer;
    if (question.type === 'single_choice') {
      answer = selectedSingle || '';
    } else if (question.type === 'multiple_choice') {
      answer = selectedMultiple.length > 0 ? selectedMultiple : [];
    } else if (question.type === 'text_input') {
      answer = textInput.trim() || '';
    }
    
    // Always submit, even if empty (will be marked as wrong)
    onAnswer(answer);
  };

  const handleMultipleToggle = (optionId) => {
    setSelectedMultiple((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };


  if (!question) return null;

  return (
    <div className="question-card">
      {/* Question Text */}
      <div className="question-text mb-6">
        <span className="text-[#00ff41]">{typedText}</span>
        {isTyping && <span className="cursor-blink">|</span>}
      </div>

      {/* Image Context */}
      {question.image_context && (
        <div className="image-context mb-6">
          <img
            src={`/db/qimgs/${question.image_context}.png`}
            alt="Question diagram"
            className="terminal-image"
            onError={(e) => {
              // Try without extension if .png fails
              const img = e.target;
              if (!img.dataset.triedJpg) {
                img.dataset.triedJpg = 'true';
                img.src = `/db/qimgs/${question.image_context}.jpg`;
              } else {
                img.style.display = 'none';
              }
            }}
          />
        </div>
      )}

      {/* Answer Options */}
      <div className="answer-options">
        {question.type === 'single_choice' && (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isSelected = selectedSingle === option.id;
              const showResult = showAnswer;
              const isCorrect = option.is_correct;
              const isWrongSelected = showResult && isSelected && !isCorrect;
              const isCorrectOption = showResult && isCorrect;
              
              return (
                <label
                  key={option.id}
                  className={`option-label cursor-pointer flex items-center gap-3 ${
                    isWrongSelected ? 'wrong-answer' : ''
                  } ${isCorrectOption ? 'correct-answer' : ''}`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedSingle(e.target.value)}
                    className="radio-input"
                    disabled={showAnswer}
                  />
                  <span className="radio-text">
                    [{isSelected ? 'x' : ' '}] {option.id}. {option.text}
                    {showResult && isCorrect && <span className="ml-2 text-[#00ff41]">✓</span>}
                    {showResult && isWrongSelected && <span className="ml-2 text-[#ff0000]">✗</span>}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isSelected = selectedMultiple.includes(option.id);
              const showResult = showAnswer;
              const isCorrect = option.is_correct;
              const isWrongSelected = showResult && isSelected && !isCorrect;
              const isCorrectOption = showResult && isCorrect;
              const isCorrectSelected = showResult && isSelected && isCorrect;
              
              return (
                <label
                  key={option.id}
                  className={`option-label cursor-pointer flex items-center gap-3 ${
                    isWrongSelected ? 'wrong-answer' : ''
                  } ${isCorrectOption ? 'correct-answer' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleMultipleToggle(option.id)}
                    className="checkbox-input"
                    disabled={showAnswer}
                  />
                  <span className="checkbox-text">
                    [{isSelected ? 'x' : ' '}] {option.id}. {option.text}
                    {showResult && isCorrect && <span className="ml-2 text-[#00ff41]">✓</span>}
                    {showResult && isWrongSelected && <span className="ml-2 text-[#ff0000]">✗</span>}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'text_input' && !isTyping && (
          <div className="text-input-container">
            <div className="input-prompt">
              <span className="text-[#00ff41]">&gt; </span>
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                className="text-input"
                autoFocus
              />
              <span className="cursor-blink">_</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!isTyping && !showAnswer && (
        <button
          onClick={handleSubmit}
          className="submit-button mt-6"
        >
          [SUBMIT]
        </button>
      )}

      {/* Show Correct Answer */}
      {showAnswer && correctAnswer && (
        <div className="correct-answer-display mt-6 p-4 border border-[#00ff41] bg-black/40">
          <div className="text-[#00ff41] font-mono text-lg mb-2">
            CORRECT ANSWER:
          </div>
          <div className="text-[#00ff41] font-mono text-base mb-4">
            {correctAnswer}
          </div>
          {onNext && (
            <button
              onClick={onNext}
              className="submit-button"
            >
              [NEXT QUESTION]
            </button>
          )}
        </div>
      )}
    </div>
  );
}

