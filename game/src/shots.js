// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules forward from a
// fresh world for a fixed number of steps, steered by a simple autopilot, so the frame is what a
// short game really looks like and the same seed always gives the same frame.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;
const DIRECTIONS = [-1, 0, 1];

/** Seconds until moving in `direction` (-1, 0, 1) runs the player into a building; Infinity when it never does. */
function timeToHit(world, direction, horizon) {
  const { state } = world;
  const player = state.player;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const nx = player.x + direction * PLAYER.walkSpeed * t;
    const ny = player.y;
    if (nx < PLAYER.radius || nx > FIELD.width - PLAYER.radius) return t;
    for (const b of state.buildings) {
      if (nx + PLAYER.radius > b.x && nx - PLAYER.radius < b.x + b.w &&
          ny + PLAYER.radius > b.y && ny - PLAYER.radius < b.y + b.h) return t;
    }
  }
  return Infinity;
}

/** Of the safe ways to move, pick one that keeps clear of buildings; else the one hit last. */
function autopilot(world, horizon) {
  const player = world.state.player;
  const centreX = FIELD.width / 2;
  const wanted = player.x > centreX ? -1 : player.x < centreX ? 1 : 0;
  let best = wanted;
  let bestTime = timeToHit(world, wanted, horizon);
  for (let i = 0; i < DIRECTIONS.length && bestTime !== Infinity; i += 1) {
    const time = timeToHit(world, DIRECTIONS[i], horizon);
    if (time > bestTime) { bestTime = time; best = DIRECTIONS[i]; }
  }
  return { hx: best, vy: 0 };
}

/** Set `world` to the named scene (start, play or end; any other name is start) and return the
 * screen to draw over it and the best score to show. */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, { hx: 0, vy: 0, enter: false }, 0);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = 1.0;
  for (let index = 0; index < limit / STEP; index += 1) {
    const move = autopilot(world, horizon);
    const events = world.step(STEP, move, 0);
    if (events & EVENT_OVER) break;
  }
  const over = world.state.gameOver;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
