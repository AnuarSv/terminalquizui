import { create } from 'zustand';

const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN',
  REVIEW_ERRORS: 'REVIEW_ERRORS',
};

const STORAGE_KEY = 'network_defense_game_progress';

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: GAME_STATES.MENU,
  currentBlock: null,
  currentQuestionIndex: 0,
  questions: [],
  score: 0,
  wrongAnswers: [],
  accuracy: 0,
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  
  startGame: (blockId, questions) => {
    set({
      currentBlock: blockId,
      questions: questions,
      currentQuestionIndex: 0,
      score: 0,
      wrongAnswers: [],
      gameState: GAME_STATES.PLAYING,
      accuracy: 0,
    });
    saveProgressToStorage();
  },
  
  resumeGame: (savedState) => {
    set({
      currentBlock: savedState.currentBlock,
      questions: savedState.questions,
      currentQuestionIndex: savedState.currentQuestionIndex,
      score: savedState.score,
      wrongAnswers: savedState.wrongAnswers || [],
      gameState: GAME_STATES.PLAYING,
      accuracy: 0,
    });
  },
  
  clearProgress: () => {
    localStorage.removeItem(STORAGE_KEY);
    // Reset game state
    set({
      gameState: GAME_STATES.MENU,
      currentBlock: null,
      currentQuestionIndex: 0,
      questions: [],
      score: 0,
      wrongAnswers: [],
      accuracy: 0,
    });
  },
  
  submitAnswer: (userAnswer, question) => {
    const { questions, currentQuestionIndex, score, wrongAnswers } = get();
    let isCorrect = false;
    
    // Validate answer based on question type
    if (question.type === 'single_choice') {
      // Empty answer is wrong
      if (!userAnswer || userAnswer === '') {
        isCorrect = false;
      } else {
        const selectedOption = question.options?.find(opt => opt.id === userAnswer);
        isCorrect = selectedOption?.is_correct === true;
      }
    } else if (question.type === 'multiple_choice') {
      const correctOptions = question.options?.filter(opt => opt.is_correct).map(opt => opt.id) || [];
      const userSelections = Array.isArray(userAnswer) ? userAnswer : [];
      
      // Must select at least one option and match all correct ones
      if (userSelections.length === 0 || correctOptions.length === 0) {
        isCorrect = false;
      } else {
        isCorrect = 
          userSelections.length === correctOptions.length &&
          userSelections.every(id => correctOptions.includes(id)) &&
          correctOptions.every(id => userSelections.includes(id));
      }
    } else if (question.type === 'text_input') {
      const acceptedAnswers = question.accepted_answers || [];
      
      // Empty answer is wrong
      if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim() === '') {
        isCorrect = false;
      } else {
        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        const matchMode = question.match_mode || 'fuzzy';
        
        if (matchMode === 'exact') {
          isCorrect = acceptedAnswers.some(
            ans => ans.trim().toLowerCase() === normalizedUserAnswer
          );
        } else {
          // Fuzzy matching: normalize whitespace and compare
          isCorrect = acceptedAnswers.some(ans => {
            const normalizedAns = ans.trim().toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedUser = normalizedUserAnswer.replace(/\s+/g, ' ').trim();
            // Exact match or contains match
            return normalizedAns === normalizedUser || 
                   normalizedAns.includes(normalizedUser) ||
                   normalizedUser.includes(normalizedAns);
          });
        }
      }
    }
    
    // Calculate new score
    const newScore = isCorrect ? score + 1 : score;
    const newWrongAnswers = isCorrect 
      ? wrongAnswers 
      : [
          ...wrongAnswers,
          {
            question,
            userAnswer,
            correctAnswer: getCorrectAnswer(question),
          },
        ];
    
    // Update score and wrong answers, but don't move to next question yet
    set({ 
      score: newScore,
      wrongAnswers: newWrongAnswers,
    });
    saveProgressToStorage();
    
    const isLastQuestion = currentQuestionIndex + 1 >= questions.length;
    return { 
      isCorrect, 
      finished: isLastQuestion, 
      isLastQuestion,
      score: newScore,
      totalQuestions: questions.length
    };
  },
  
  resetGame: () => {
    set({
      gameState: GAME_STATES.MENU,
      currentBlock: null,
      currentQuestionIndex: 0,
      questions: [],
      score: 0,
      wrongAnswers: [],
      accuracy: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
  },
  
  goToReview: () => {
    set({ gameState: GAME_STATES.REVIEW_ERRORS });
  },
  
  moveToNextQuestion: () => {
    const { questions, currentQuestionIndex, score, wrongAnswers } = get();
    const isLastQuestion = currentQuestionIndex + 1 >= questions.length;
    
    if (isLastQuestion) {
      // Game finished - check win/loss
      const totalQuestions = questions.length || 1;
      const accuracy = score / totalQuestions;
      const nextState = accuracy >= 0.7 ? GAME_STATES.WIN : GAME_STATES.GAME_OVER;
      
      set({ 
        accuracy,
        gameState: nextState,
      });
      // Clear progress when game is finished
      localStorage.removeItem(STORAGE_KEY);
    } else {
      set({ 
        currentQuestionIndex: currentQuestionIndex + 1 
      });
      saveProgressToStorage();
    }
  },
  
  retryWrongQuestions: () => {
    const { wrongAnswers } = get();
    if (!wrongAnswers.length) return false;
    
    const retryQuestions = wrongAnswers
      .map(entry => entry.question)
      .filter(Boolean);
    
    if (!retryQuestions.length) return false;
    
    set({
      questions: retryQuestions,
      currentQuestionIndex: 0,
      score: 0,
      wrongAnswers: [],
      gameState: GAME_STATES.PLAYING,
      accuracy: 0,
    });
    
    return true;
  },
}));

// Helper function to get correct answer display
function getCorrectAnswer(question) {
  if (question.type === 'single_choice') {
    const correct = question.options.find(opt => opt.is_correct);
    return correct ? `${correct.id}. ${correct.text}` : 'N/A';
  } else if (question.type === 'multiple_choice') {
    const correct = question.options.filter(opt => opt.is_correct);
    return correct.map(opt => `${opt.id}. ${opt.text}`).join(', ');
  } else if (question.type === 'text_input') {
    return question.accepted_answers?.join(' or ') || 'N/A';
  }
  return 'N/A';
}

// Save progress to localStorage
function saveProgressToStorage() {
  const state = useGameStore.getState();
  // Only save if game is in progress
  if (state.gameState === GAME_STATES.PLAYING && state.questions.length > 0) {
    const progress = {
      currentBlock: state.currentBlock,
      currentQuestionIndex: state.currentQuestionIndex,
      questions: state.questions,
      score: state.score,
      wrongAnswers: state.wrongAnswers,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }
}

// Load progress from localStorage
export function loadProgressFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const progress = JSON.parse(saved);
    // Validate saved progress
    if (progress && progress.questions && progress.questions.length > 0) {
      return progress;
    }
    return null;
  } catch (e) {
    console.error('Failed to load progress:', e);
    return null;
  }
}

export { GAME_STATES };

