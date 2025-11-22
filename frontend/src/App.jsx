import React from 'react';
import { useGameStore, GAME_STATES } from './store/gameStore';
import TerminalUI from './components/TerminalUI';
import Menu from './components/Menu';
import Game from './components/Game';

function App() {
  const { gameState } = useGameStore();

  return (
    <TerminalUI>
      <div className="app-container">
        {gameState === GAME_STATES.MENU && <Menu />}
        {gameState !== GAME_STATES.MENU && <Game />}
      </div>
    </TerminalUI>
  );
}

export default App;
