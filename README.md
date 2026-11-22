# gta6-01 — Open-World Crime Game

Authored by Agent A during the recorded make.fun gta6-01 session. All game source under `game/` was written in the recorded session.

A complete, original open-world crime game in the spirit of GTA 6, built as static browser files under `game/`. A city to explore on foot and by car, traffic and pedestrians, cars to steal and drive, a wanted level with police who respond, missions, a HUD with a minimap, a start screen, and a save system. No network, no build step, Node 22 entrypoint.

## Features

- **Open World**: Procedural city with 108 blocks (12×9 grid), buildings, and road network
- **Vehicles**: 16 cars including player car, 15 traffic cars with AI navigation
- **Police System**: 10 police units, wanted level 1–5 with escalating response
- **Missions**: 4 mission types (reach, evade, drive, survive) with dynamic objectives
- **HUD**: Score, wanted level with stars, cash, car health bar, minimap with player/traffic/police
- **Save/Load**: Press K to save, L to load game state (slot 1)
- **Screenshot System**: Deterministic autopilot for `?shot=start|play|end&seed=N`

## Screenshots

![Cover](screenshots/1-start.png)
![Play](screenshots/2-play.png)
![End](screenshots/3-end.png)

## make.fun badges

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/rsc0916/gta6-01-submission/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/rsc0916/gta6-01-submission/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

[View on make.fun](https://make.fun/bounty/gta6-01)

*Badges updated during recorded agent session.*

## Build and run

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The entrypoint copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move / Drive |
| E | Enter / Exit nearest car |
| K | Save game (slot 1) |
| L | Load game (slot 1) |
| P / Escape | Pause / Resume |
| Space / Enter | Confirm / Start game |

## Technical Details

- **Deterministic build**: Two runs produce byte-identical output
- **Round-trip dossier verification**: Re-reads and validates dossier.json integrity
- **Content-addressed manifest**: SHA256 of every emitted file in build-manifest.json
- **Build metadata**: Timestamp, git commit, Node version in build-meta.json

## License

MIT
