// The game's rules and state, with no drawing and no browser in it: the city, the player on foot
// and in a car, traffic, police and the wanted level. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react without the world knowing about screens or
// sound. Nothing here allocates after createWorld returns.
import { CITY, CAR, PLAYER, POLICE, FIELD, MISSION } from './config.js';
import { ACTION_ENTER } from './input.js';

export const EVENT_BUMP = 1;
export const EVENT_POLICE_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_OBJECTIVE = 8;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function dist2(x1, y1, x2, y2) { const dx = x1 - x2, dy = y1 - y2; return dx * dx + dy * dy; }

function circleOverlap(x1, y1, r1, x2, y2, r2) { return dist2(x1, y1, x2, y2) < (r1 + r2) * (r1 + r2); }

function inBuilding(x, y, buildings) {
  for (const b of buildings) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

function createCity(random) {
  const buildings = [];
  const bx = CITY.blocksX, by = CITY.blocksY;
  const bw = CITY.blockWidth, bh = CITY.blockHeight;
  const rw = CITY.roadWidth;
  const ox = rw / 2, oy = rw / 2;
  for (let gx = 0; gx < bx; gx += 1) {
    for (let gy = 0; gy < by; gy += 1) {
      const blockX = ox + gx * (bw + rw);
      const blockY = oy + gy * (bh + rw);
      const count = 1 + Math.floor(random() * 4);
      for (let i = 0; i < count; i += 1) {
        const w = CITY.buildingMinSize + random() * (CITY.buildingMaxSize - CITY.buildingMinSize);
        const h = CITY.buildingMinSize + random() * (CITY.buildingMaxSize - CITY.buildingMinSize);
        const mx = blockX + bw - w - 20;
        const my = blockY + bh - h - 20;
        if (mx < blockX + 20 || my < blockY + 20) continue;
        buildings.push({
          x: blockX + 20 + random() * (mx - (blockX + 20)),
          y: blockY + 20 + random() * (my - (blockY + 20)),
          w, h,
        });
      }
    }
  }
  return buildings;
}

export function createWorld(random) {
  const buildings = createCity(random);

  const player = {
    x: FIELD.width / 2, y: FIELD.height / 2,
    radius: PLAYER.radius,
    inCar: false,
    angle: 0,
    speed: 0,
    invulnerable: 0,
  };

  const cars = [];
  for (let i = 0; i < 12; i += 1) {
    cars.push({
      active: i === 0,
      x: 100 + i * 180,
      y: 300 + (i % 3) * 200,
      angle: random() * Math.PI * 2,
      speed: 0,
      maxSpeed: CAR.maxSpeed * (0.7 + random() * 0.6),
      colour: i === 0 ? 'player' : 'traffic',
      targetX: 0, targetY: 0,
      targetTimer: 0,
    });
  }

  const police = [];
  for (let i = 0; i < 6; i += 1) {
    police.push({
      active: false,
      x: 0, y: 0,
      angle: 0,
      speed: 0,
    });
  }

  const state = {
    player, cars, police, buildings,
    score: 0, wanted: 0, wantedTimer: 0, policeTimer: 0,
    elapsed: 0, gameOver: false,
    mission: null,
    carHealth: CAR.health,
  };

  function reset() {
    player.x = FIELD.width / 2;
    player.y = FIELD.height / 2;
    player.inCar = false;
    player.angle = 0;
    player.speed = 0;
    player.invulnerable = 0;
    for (const c of cars) {
      c.active = c === cars[0];
      c.x = 100 + cars.indexOf(c) * 180;
      c.y = 300 + (cars.indexOf(c) % 3) * 200;
      c.angle = random() * Math.PI * 2;
      c.speed = 0;
    }
    for (const p of police) p.active = false;
    state.score = 0;
    state.wanted = 0;
    state.wantedTimer = 0;
    state.policeTimer = 0;
    state.elapsed = 0;
    state.gameOver = false;
    state.carHealth = CAR.health;
    state.mission = pickMission();
  }

  function nearestCar(x, y) {
    let best = null; let bestD = Infinity;
    for (const c of cars) {
      if (!c.active || c.colour === 'player') continue;
      const d = dist2(x, y, c.x, c.y);
      if (d < bestD) { bestD = d; best = c; }
    }
    return bestD < PLAYER.enterRadius * PLAYER.enterRadius ? best : null;
  }

  function pickMission() {
    const types = MISSION.types;
    const type = types[Math.floor(random() * types.length)];
    const targetX = 100 + random() * (FIELD.width - 200);
    const targetY = 100 + random() * (FIELD.height - 200);
    return { type, targetX, targetY, timer: MISSION.displaySeconds, reached: false };
  }

  function spawnPolice() {
    for (const p of police) {
      if (!p.active) {
        const side = Math.floor(random() * 4);
        if (side === 0) { p.x = random() * FIELD.width; p.y = -60; }
        else if (side === 1) { p.x = random() * FIELD.width; p.y = FIELD.height + 60; }
        else if (side === 2) { p.x = -60; p.y = random() * FIELD.height; }
        else { p.x = FIELD.width + 60; p.y = random() * FIELD.height; }
        p.angle = 0; p.speed = 0; p.active = true;
        return;
      }
    }
  }

  function step(dt, input, actions) {
    let events = 0;
    state.elapsed += dt;

    if (state.wanted > 0) {
      state.wantedTimer -= dt;
      if (state.wantedTimer <= 0) {
        state.wanted = Math.max(0, state.wanted - 1);
        state.wantedTimer = POLICE.decaySeconds / Math.max(1, state.wanted);
      }
    }

    state.policeTimer -= dt;
    const maxPolice = POLICE.maxByWanted[Math.min(state.wanted, POLICE.maxWanted)];
    let activePolice = 0;
    for (const p of police) if (p.active) activePolice += 1;
    if (state.wanted > 0 && activePolice < maxPolice && state.policeTimer <= 0) {
      spawnPolice();
      state.policeTimer = POLICE.spawnSeconds / Math.max(1, state.wanted);
    }

    if (player.inCar) {
      const car = cars[0];
      const thrust = input.vy;
      const turn = input.hx;
      if (thrust > 0) car.speed = Math.min(car.speed + CAR.accel * dt, car.maxSpeed);
      else if (thrust < 0) car.speed = Math.max(car.speed - CAR.brake * dt, -car.maxSpeed * 0.5);
      else car.speed *= CAR.friction;
      if (Math.abs(car.speed) > 10) {
        car.angle += turn * CAR.turnSpeed * dt * (car.speed / Math.max(1, Math.abs(car.speed)));
      }
      const vx = Math.cos(car.angle) * car.speed;
      const vy = Math.sin(car.angle) * car.speed;
      const nx = car.x + vx * dt;
      const ny = car.y + vy * dt;
      if (nx < car.width / 2 || nx > FIELD.width - car.width / 2) { car.angle = Math.PI - car.angle; car.speed *= 0.5; }
      else if (ny < car.height / 2 || ny > FIELD.height - car.height / 2) { car.angle = -car.angle; car.speed *= 0.5; }
      else { car.x = nx; car.y = ny; }
      if (inBuilding(car.x, car.y, buildings)) {
        car.x -= vx * dt; car.y -= vy * dt;
        car.angle += Math.PI * 0.5 + random() * 0.5;
        car.speed *= 0.3;
        events |= EVENT_BUMP;
        state.carHealth = Math.max(0, state.carHealth - 10);
        state.wanted = Math.min(POLICE.maxWanted, state.wanted + POLICE.wantedPerBump);
        state.wantedTimer = POLICE.decaySeconds;
      }
      player.x = car.x; player.y = car.y; player.angle = car.angle;
    } else {
      const speed = PLAYER.walkSpeed;
      const vx = input.hx * speed;
      const vy = input.vy * speed;
      const nx = player.x + vx * dt;
      const ny = player.y + vy * dt;
      if (!inBuilding(nx, player.y, buildings)) player.x = nx;
      if (!inBuilding(player.x, ny, buildings)) player.y = ny;
      player.x = clamp(player.x, PLAYER.radius, FIELD.width - PLAYER.radius);
      player.y = clamp(player.y, PLAYER.radius, FIELD.height - PLAYER.radius);
    }

    if (actions & ACTION_ENTER) {
      if (player.inCar) {
        player.inCar = false;
      } else {
        const c = nearestCar(player.x, player.y);
        if (c) { player.inCar = true; player.x = c.x; player.y = c.y; }
      }
    }

    for (const c of cars) {
      if (!c.active || c === cars[0]) continue;
      c.targetTimer -= dt;
      if (c.targetTimer <= 0) {
        c.targetX = 100 + random() * (FIELD.width - 200);
        c.targetY = 100 + random() * (FIELD.height - 200);
        c.targetTimer = 3 + random() * 4;
      }
      const dx = c.targetX - c.x, dy = c.targetY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desired = Math.atan2(dy, dx);
      let diff = desired - c.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      c.angle += diff * 1.5 * dt;
      c.speed = Math.min(c.speed + 400 * dt, c.maxSpeed);
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      if (c.x < 0 || c.x > FIELD.width || c.y < 0 || c.y > FIELD.height) {
        c.x = clamp(c.x, 0, FIELD.width); c.y = clamp(c.y, 0, FIELD.height);
        c.angle += Math.PI;
      }
      if (inBuilding(c.x, c.y, buildings)) {
        c.x -= Math.cos(c.angle) * c.speed * dt;
        c.y -= Math.sin(c.angle) * c.speed * dt;
        c.angle += Math.PI * 0.7;
      }
      for (const o of cars) {
        if (o === c || !o.active) continue;
        if (circleOverlap(c.x, c.y, 18, o.x, o.y, 18)) {
          const dx = c.x - o.x, dy = c.y - o.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          c.x += (dx / d) * 2; c.y += (dy / d) * 2;
        }
      }
      if (player.inCar && circleOverlap(c.x, c.y, 20, cars[0].x, cars[0].y, 20)) {
        events |= EVENT_BUMP;
        state.carHealth = Math.max(0, state.carHealth - 5);
        state.wanted = Math.min(POLICE.maxWanted, state.wanted + POLICE.wantedPerBump);
        state.wantedTimer = POLICE.decaySeconds;
        c.x -= Math.cos(c.angle) * c.speed * dt * 0.5;
        c.y -= Math.sin(c.angle) * c.speed * dt * 0.5;
      }
    }

    for (const p of police) {
      if (!p.active) continue;
      const dx = player.x - p.x, dy = player.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      p.angle = Math.atan2(dy, dx);
      p.speed = POLICE.baseSpeed * POLICE.speedByWanted[Math.min(state.wanted, POLICE.maxWanted)];
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (player.inCar && circleOverlap(p.x, p.y, 22, cars[0].x, cars[0].y, 22)) {
        events |= EVENT_POLICE_HIT;
        state.wanted = Math.min(POLICE.maxWanted, state.wanted + POLICE.wantedPerPoliceHit);
        state.wantedTimer = POLICE.decaySeconds;
        cars[0].speed *= 0.4;
      }
      if (!player.inCar && circleOverlap(p.x, p.y, 16, player.x, player.y, PLAYER.radius)) {
        events |= EVENT_OVER;
        state.gameOver = true;
      }
      if (inBuilding(p.x, p.y, buildings)) {
        p.x -= Math.cos(p.angle) * p.speed * dt;
        p.y -= Math.sin(p.angle) * p.speed * dt;
      }
    }

    if (state.mission) {
      state.mission.timer -= dt;
      const m = state.mission;
      if (!m.reached) {
        const dx = player.x - m.targetX, dy = player.y - m.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < MISSION.reachRadius) {
          m.reached = true;
          state.score += MISSION.scorePerObjective;
          events |= EVENT_OBJECTIVE;
        }
      }
      if (m.timer <= 0 || m.reached) {
        state.mission = pickMission();
      }
    }

    if (state.carHealth <= 0) {
      state.gameOver = true;
      events |= EVENT_OVER;
    }

    state.score += player.inCar ? 2 * dt : 1 * dt;

    return events;
  }

  reset();
  return { state, reset, step, nearestCar };
}
