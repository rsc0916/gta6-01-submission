// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot, so the frame is what a short game really looks like and the
// same seed always gives the same frame. The autopilot enters the player's car
// and drives it, so the play and end scenes show the car, traffic and the
// police response rather than only a walking player.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function stageShot(name, world) {
  world.reset();
  if (name === 'start') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { hx: 0, vy: 0, enter: false }, 0);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  let targetX = FIELD.width / 2;
  let targetY = FIELD.height / 2;
  let targetTimer = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    const state = world.state;
    const player = state.player;
    const car = state.cars[0];
    let hx = 0;
    let vy = 0;
    let enter = 0;
    if (!player.inCar) {
      const c = world.nearestCar(player.x, player.y);
      enter = c ? 1 : 0;
      if (c) {
        const d = Math.abs(c.x - player.x) + Math.abs(c.y - player.y) || 1;
        hx = clamp((c.x - player.x) / d, -1, 1);
        vy = clamp((c.y - player.y) / d, -1, 1);
      }
    } else {
      targetTimer -= STEP;
      if (targetTimer <= 0) {
        targetX = 120 + (i * 37 % (FIELD.width - 240));
        targetY = 120 + (i * 53 % (FIELD.height - 240));
        targetTimer = 5;
      }
      const dx = targetX - car.x;
      const dy = targetY - car.y;
      const desired = Math.atan2(dy, dx);
      let diff = desired - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      hx = clamp(diff * 1.5, -1, 1);
      vy = Math.abs(diff) < 0.6 ? 1 : 0;
    }
    const events = world.step(STEP, { hx, vy, enter: enter ? 1 : 0 }, 0);
    if (events & EVENT_OVER) break;
  }
  const over = world.state.gameOver;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
