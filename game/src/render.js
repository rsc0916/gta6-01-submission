// Drawing only: the world's state and the current screen in, pixels out. The
// 2400x1800 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. The city, cars, player, police, HUD with
// minimap, and panels are all drawn here. Text that holds a number is rebuilt
// only when the number changes, so a frame allocates nothing.
import { CITY, CAR, POLICE, PLAYER, FIELD, FONT, PALETTE, HUD, SAVE_KEY, GAME_NAME, GAME_AUTHOR, GAME_VERSION } from './config.js';
import { EVENT_BUMP, EVENT_POLICE_HIT, EVENT_SAVED, EVENT_LOADED } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const MINIMAP = { size: 160, x: 24, y: 100 };

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const wantedLabel = cachedLabel('Wanted ');
  const cashLabel = cachedLabel('$');
  let savedFlash = 0;
  let loadedFlash = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawRoads() {
    context.fillStyle = PALETTE.road;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const bx = CITY.blocksX, by = CITY.blocksY;
    const bw = CITY.blockWidth, bh = CITY.blockHeight;
    const rw = CITY.roadWidth;
    const ox = rw / 2, oy = rw / 2;
    for (let gx = 0; gx <= bx; gx += 1) {
      const x = ox + gx * (bw + rw) - rw / 2;
      context.fillStyle = PALETTE.road;
      context.fillRect(x, 0, rw, FIELD.height);
    }
    for (let gy = 0; gy <= by; gy += 1) {
      const y = oy + gy * (bh + rw) - rw / 2;
      context.fillStyle = PALETTE.road;
      context.fillRect(0, y, FIELD.width, rw);
    }
    context.strokeStyle = PALETTE.roadLine;
    context.lineWidth = 4;
    context.setLineDash([40, 40]);
    for (let gx = 0; gx <= bx; gx += 1) {
      const x = ox + gx * (bw + rw);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, FIELD.height);
      context.stroke();
    }
    for (let gy = 0; gy <= by; gy += 1) {
      const y = oy + gy * (bh + rw);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(FIELD.width, y);
      context.stroke();
    }
    context.setLineDash([]);
  }

  function drawBuildings(buildings) {
    for (const b of buildings) {
      context.fillStyle = PALETTE.building;
      context.fillRect(b.x, b.y, b.w, b.h);
      context.fillStyle = PALETTE.buildingRoof;
      context.fillRect(b.x, b.y, b.w, 14);
      context.fillStyle = PALETTE.buildingWindow;
      const cols = Math.max(1, Math.floor(b.w / 34));
      const rows = Math.max(1, Math.floor(b.h / 30));
      for (let cx = 0; cx < cols; cx += 1) {
        for (let ry = 0; ry < rows; ry += 1) {
          const wx = b.x + 14 + cx * 34;
          const wy = b.y + 22 + ry * 30;
          if (wx + 10 <= b.x + b.w && wy + 10 <= b.y + b.h) {
            context.fillRect(wx, wy, 10, 10);
          }
        }
      }
    }
  }

  function drawCar(c, isPlayer) {
    context.save();
    context.translate(c.x, c.y);
    context.rotate(c.angle);
    const w = CAR.width, h = CAR.height;
    context.fillStyle = isPlayer ? PALETTE.player : c.colour === 'police' ? PALETTE.carPolice : PALETTE.carTraffic;
    context.fillRect(-w / 2, -h / 2, w, h);
    context.fillStyle = isPlayer ? PALETTE.car : 'rgba(255,255,255,0.35)';
    context.fillRect(-w / 2 + 4, -h / 2, w - 8, 10);
    context.restore();
  }

  function drawPlayerFoot(player) {
    context.fillStyle = PALETTE.playerFoot;
    context.beginPath();
    context.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.player;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(player.x, player.y, PLAYER.radius + 4, 0, Math.PI * 2);
    context.stroke();
  }

  function drawMinimap(player, cars, police) {
    const m = MINIMAP;
    context.save();
    context.translate(m.x, m.y);
    context.fillStyle = PALETTE.panel;
    context.fillRect(0, 0, m.size, m.size);
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 2;
    context.strokeRect(0, 0, m.size, m.size);
    const sx = m.size / FIELD.width;
    const sy = m.size / FIELD.height;
    context.fillStyle = PALETTE.minimapPlayer;
    context.fillRect(player.x * sx - 2, player.y * sy - 2, 4, 4);
    context.fillStyle = PALETTE.minimapCar;
    for (const c of cars) {
      if (!c.active || c.colour === 'player') continue;
      context.fillRect(c.x * sx - 1, c.y * sy - 1, 2, 2);
    }
    context.fillStyle = PALETTE.minimapPolice;
    for (const p of police) {
      if (!p.active) continue;
      context.fillRect(p.x * sx - 1, p.y * sy - 1, 2, 2);
    }
    context.fillStyle = PALETTE.text;
    context.font = '14px ' + FONT;
    context.textAlign = 'left';
    context.fillText('City', 6, 18);
    context.restore();
  }

  function drawWantedStars(wanted) {
    const x = FIELD.width - 24;
    const y = 24;
    for (let i = 0; i < POLICE.maxWanted; i += 1) {
      context.fillStyle = i < wanted ? PALETTE.wanted : '#1f2937';
      context.beginPath();
      context.moveTo(x - i * 24, y);
      context.lineTo(x - i * 24 - 6, y + 8);
      context.lineTo(x - i * 24 + 3, y + 8);
      context.lineTo(x - i * 24 - 2, y + 12);
      context.lineTo(x - i * 24 + 5, y + 14);
      context.lineTo(x - i * 24, y + 10);
      context.lineTo(x - i * 24 + 5, y + 16);
      context.lineTo(x - i * 24 - 2, y + 18);
      context.lineTo(x - i * 24 + 3, y + 22);
      context.lineTo(x - i * 24 - 6, y + 20);
      context.closePath();
      context.fill();
    }
  }

  function drawPanel(title, lines, prompt) {
    const width = 640;
    const top = 150;
    const line = 36;
    const bottom = 80;
    const height = top + lines.length * line + bottom;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, width, height);
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 3;
    context.strokeRect(x, y, width, height);
    context.textBaseline = 'alphabetic';
    text(title, canvas.width / 2, y + 90, 52, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], canvas.width / 2, y + top + i * line, 24, PALETTE.muted, 'center');
    }
    text(prompt, canvas.width / 2, y + height - 44, 28, PALETTE.playerFoot, 'center');
  }

  const TITLE_LINES = [
    'Sunhaven City',
    'A top-down open-world crime game: drive, evade, survive.',
    'WASD or arrows to move. E to enter or exit the nearest car.',
    'K to save, L to load. Bumping cars and police raises wanted.',
    'Police chase you. Stay alive as long as you can.',
  ];
  const PAUSED_LINES = ['The city waits for you.'];
  const OVER_LINES = ['', ''];

  function draw(state, screen, best, mission) {
    const { player, cars, police, buildings } = state;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    drawRoads();
    drawBuildings(buildings);

    for (const c of cars) {
      if (c.active && c.colour !== 'player') drawCar(c, false);
    }
    for (const p of police) {
      if (p.active) { const tmp = { x: p.x, y: p.y, angle: p.angle, colour: 'police' }; drawCar(tmp, false); }
    }
    if (player.inCar) drawCar(cars[0], true);
    if (!player.inCar) {
      if (player.invulnerable === 0 || Math.floor(player.invulnerable * 10) % 2 === 1) {
        drawPlayerFoot(player);
      }
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.textBaseline = 'top';
    text(scoreLabel(Math.floor(state.score)), 24, 20, 28, PALETTE.text, 'left');
    text(wantedLabel(state.wanted), FIELD.width / 2 - 60, 20, 28, state.wanted > 0 ? PALETTE.wanted : PALETTE.muted, 'left');
    drawWantedStars(state.wanted);
    text(cashLabel(Math.floor(state.score / 10)), 24, 56, 22, PALETTE.muted, 'left');
    if (player.inCar) {
      const healthW = 120;
      const healthH = 10;
      const hx = 24;
      const hy = 86;
      context.fillStyle = '#1f2937';
      context.fillRect(hx, hy, healthW, healthH);
      context.fillStyle = state.carHealth > 50 ? '#4ade80' : state.carHealth > 25 ? '#fbbf24' : '#ef4444';
      context.fillRect(hx, hy, Math.round((state.carHealth / CAR.health) * healthW), healthH);
      context.strokeStyle = '#374151';
      context.lineWidth = 1;
      context.strokeRect(hx, hy, healthW, healthH);
      text('Car Health', hx, hy - 6, 14, PALETTE.muted, 'left');
    }
    if (mission && mission.timer > 0) {
      const label = mission.type === 'reach' ? 'Reach the marker' : mission.type === 'evade' ? 'Evade the police' : mission.type === 'drive' ? 'Drive safely' : 'Survive';
      text('Objective: ' + label, FIELD.width - 24, 20, 20, HUD.objective, 'right');
      text(Math.ceil(mission.timer) + 's', FIELD.width - 24, 44, 16, HUD.objectiveMuted, 'right');
    }
    drawMinimap(player, cars, police);

    const hint = player.inCar
      ? 'E: exit car   K: save   L: load   P: pause'
      : 'E: enter car   K: save   L: load   P: pause';
    text(hint, FIELD.width - 24, 20, 20, PALETTE.muted, 'right');

    // Draw save/load flash messages
    if (savedFlash > 0) {
      text('Game Saved!', FIELD.width / 2, FIELD.height - 60, 28, '#4ade80', 'center');
      savedFlash -= 1/60;
    }
    if (loadedFlash > 0) {
      text('Game Loaded!', FIELD.width / 2, FIELD.height - 60, 28, '#7dd3fc', 'center');
      loadedFlash -= 1/60;
    }

    if (screen === SCREEN_TITLE) {
      TITLE_LINES[0] = GAME_NAME + ' v' + GAME_VERSION;
      TITLE_LINES[4] = 'By ' + GAME_AUTHOR + ' | Best: ' + Math.floor(best);
      drawPanel(TITLE_LINES[0], TITLE_LINES.slice(1), 'Press Space or click to start');
      return;
    }
    context.textBaseline = 'top';
    text(scoreLabel(Math.floor(state.score)), 24, 20, 28, PALETTE.text, 'left');
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = 'Game over. Score ' + Math.floor(state.score);
      OVER_LINES[1] = 'Best ' + Math.floor(best);
      drawPanel('Busted', OVER_LINES, 'Press Space or click to play again');
    }
  }

  // Expose flash triggers
  const renderer = { draw };
  renderer.flashSaved = () => { savedFlash = 2; };
  renderer.flashLoaded = () => { loadedFlash = 2; };

  resize();
  window.addEventListener('resize', resize);
  return renderer;
}

