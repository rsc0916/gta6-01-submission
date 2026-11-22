// Every tuning number and colour in one place. The playfield is a fixed 2400x1800 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 2400, height: 1800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The city: blocks across and down, and the road gap between blocks. */
export const CITY = {
  blocksX: 8,
  blocksY: 6,
  blockWidth: 260,
  blockHeight: 220,
  roadWidth: 60,
  buildingMinSize: 70,
  buildingMaxSize: 150,
};

/** The player on foot. */
export const PLAYER = {
  radius: 10,
  walkSpeed: 260,
  runSpeed: 400,
  enterRadius: 70,
};

/** A car. */
export const CAR = {
  width: 40,
  height: 24,
  maxSpeed: 520,
  accel: 900,
  brake: 1200,
  turnSpeed: 3.2,
  friction: 0.86,
  bumpDamage: 4,
  health: 100,
};

/** Police. */
export const POLICE = {
  maxWanted: 5,
  wantedPerBump: 1,
  wantedPerPoliceHit: 2,
  decaySeconds: 8,
  spawnSeconds: 1.5,
  baseSpeed: 460,
  chaseRadius: 900,
  speedByWanted: [1.00, 1.10, 1.25, 1.40, 1.55, 1.70],
  maxByWanted: [0, 1, 2, 3, 4, 6],
};

/** Mission objectives shown to the player. */
export const MISSION = {
  displaySeconds: 8,
  scorePerObjective: 500,
  reachRadius: 90,
  types: ['reach', 'evade', 'drive'],
};

/** Screen-space HUD text colours. */
export const HUD = {
  objective: '#7dd3fc',
  objectiveMuted: '#9ca3af',
  wanted: '#f87171',
  score: '#f3f4f6',
  cash: '#9ca3af',
};

/** Colours. */
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

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sunhaven.best';

/** Screenshot scenes: seconds of play for each staged scene. */
export const SHOT = { start: 5, play: 26, end: 600 };
