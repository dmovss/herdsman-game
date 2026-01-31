import { Game } from './core/Game';
import './style.css';

async function main() {
  const container = document.getElementById('game-container');
  
  if (!container) {
    throw new Error('Game container not found');
  }

  try {
    const game = Game.getInstance();
    await game.initialize(container);
  } catch (error) {
    container.innerHTML = `
      <div style="
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
        background: #d32f2f;
        border-radius: 10px;
        margin: 20px;
      ">
        <h1>Game Failed to Load</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

window.addEventListener('beforeunload', () => {
  const game = Game.getInstance();
  if (game) {
    game.destroy();
  }
});