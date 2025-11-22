import React, { useState, useEffect } from 'react';
import { useGameStore, loadProgressFromStorage } from '../store/gameStore';
import ResumeDialog from './ResumeDialog';

export default function Menu() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const { startGame, resumeGame, clearProgress } = useGameStore();

  // Check for saved progress on mount
  useEffect(() => {
    const saved = loadProgressFromStorage();
    if (saved) {
      setSavedProgress(saved);
      setShowResumeDialog(true);
    } else {
      setSavedProgress(null);
      setShowResumeDialog(false);
    }
  }, []);

  const handleBlockSelect = async (blockId) => {
    setLoading(true);
    setError(null);
    setShowResumeDialog(false);
    
    try {
      const response = await fetch(`/api/questions/${blockId}`);
      if (!response.ok) {
        throw new Error(`Failed to load block ${blockId}`);
      }
      const data = await response.json();
      startGame(blockId, data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (savedProgress) {
      resumeGame(savedProgress);
      setShowResumeDialog(false);
    }
  };

  const handleNewGame = () => {
    // Clear progress from storage and state first
    clearProgress();
    // Close dialog and clear saved progress immediately
    setSavedProgress(null);
    setShowResumeDialog(false);
    // Reset local state
    setError(null);
    setLoading(false);
  };

  return (
    <div className="menu-container">
      {showResumeDialog && savedProgress && (
        <ResumeDialog
          onResume={handleResume}
          onNewGame={handleNewGame}
          savedProgress={savedProgress}
        />
      )}

      <div className="menu-header mb-12">
        <h1 className="text-[#00ff41] font-mono text-5xl mb-4 text-center">
          SYSTEM UNDER ATTACK
        </h1>
        <h2 className="text-[#00ff41] font-mono text-2xl text-center opacity-75">
          SELECT SECTOR TO DEFEND
        </h2>
        <div className="terminal-border mt-6"></div>
      </div>

      {error && (
        <div className="error-message mb-6">
          <span className="text-[#ff0000] font-mono">ERROR: {error}</span>
        </div>
      )}

      <div className="block-selection">
        {[1, 2, 3, 4, 5].map((blockId) => (
          <button
            key={blockId}
            onClick={() => handleBlockSelect(blockId)}
            disabled={loading}
            className="block-button"
          >
            <span className="font-mono text-[#00ff41] text-xl">
              [SECTOR {blockId}]
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-indicator mt-8">
          <span className="text-[#00ff41] font-mono">
            LOADING SECTOR DATA...
          </span>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      )}
    </div>
  );
}

