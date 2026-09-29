import './style.css';
import { Game } from './game/Game';

const game = new Game();

const tick = (time: number) => {
  const last = (tick as { lastTime?: number }).lastTime ?? time;
  const delta = Math.min((time - last) / 1000, 0.033);
  (tick as { lastTime?: number }).lastTime = time;

  game.update(delta);
  game.render();
  window.requestAnimationFrame(tick);
};

(tick as { lastTime?: number }).lastTime = 0;
window.requestAnimationFrame(tick);
