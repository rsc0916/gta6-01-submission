// Sunhaven City: tuning, constants and the shared palette.
// Every number the simulation and HUD need lives here, so the game balances
// in one place and reads like a single source of truth.

export const FIELD = { width: 2400, height: 1800 };

/** Fixed simulation step: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** City layout: blocks across/down, road gap between blocks, building sizes. */
export const CITY = {
  blocksX: 12,
  blocksY: 9,
  blockWidth: 200,
  blockHeight: 170,
  roadWidth: 60,
  buildingMinSize: 55,
  buildingMaxSize: 130,
};

/** The player on foot. */
export const PLAYER = {
  radius: 10,
  walkSpeed: 240,
  runSpeed: 380,
  enterRadius: 70,
};

/** A player-driven or traffic car. */
export const CAR = {
  width: 42,
  height: 26,
  maxSpeed: 520,
  accel: 900,
  brake: 1250,
  turnSpeed: 3.3,
  friction: 0.86,
  bumpDamage: 4,
  health: 100,
};

/** Police pursuit and wanted level. */
export const POLICE = {
  maxWanted: 5,
  wantedPerBump: 1,
  wantedPerPoliceHit: 2,
  decaySeconds: 8,
  spawnSeconds: 1.3,
  baseSpeed: 450,
  chaseRadius: 900,
  speedByWanted: [1.00, 1.10, 1.25, 1.40, 1.55, 1.70],
  maxByWanted: [0, 1, 2, 3, 4, 6],
};

/** Mission objectives shown on the HUD. */
export const MISSION = {
  displaySeconds: 8,
  scorePerObjective: 500,
  reachRadius: 90,
  types: ['reach', 'evade', 'drive', 'survive'],
};

/** Screen-space HUD text colours. */
export const HUD = {
  objective: '#7dd3fc',
  objectiveMuted: '#9ca3af',
  wanted: '#f87171',
  score: '#f3f4f6',
  cash: '#9ca3af',
};

/** Colours used by the renderer. */
export const PALETTE = {
  backdrop: '#0b1016',
  road: '#1a1e26',
  roadLine: '#2a323e',
  building: '#242a34',
  buildingRoof: '#2e3644',
  buildingWindow: '#4a5568',
  player: '#7dd3fc',
  playerFoot: '#fbbf24',
  car: '#3b82f6',
  carTraffic: '#94a3b8',
  carPolice: '#ef4444',
  panel: '#111827',
  panelBorder: '#374151',
  text: '#f3f4f6',
  muted: '#9ca3af',
  wanted: '#f87171',
  minimapPlayer: '#7dd3fc',
  minimapPolice: '#ef4444',
  minimapCar: '#94a3b8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score and last save are kept between visits (this browser only). */
export const BEST_KEY = 'sunhaven.best';
export const SAVE_KEY = 'sunhaven.save';

/** Screenshot scenes: seconds of play for each staged scene. */
export const SHOT = { start: 5, play: 26, end: 600 };

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Game identity for the dossier and judge. */
export const GAME_NAME = 'Sunhaven City';
export const GAME_AUTHOR = 'Agent A';
export const GAME_VERSION = '1.0.0';

