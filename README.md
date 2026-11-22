# gta6-01 — Open-World Crime Game

A complete, original open-world crime game in the spirit of GTA 6, built as static browser files under `game/`. A city to explore on foot and by car, traffic and pedestrians, cars to steal and drive, a wanted level with police who respond, missions, a HUD with a minimap, a start screen, and a save system. No network, no build step, Node 22 entrypoint.

## Screenshots

![Cover](screenshots/1-start.png)
![Play](screenshots/2-play.png)
![End](screenshots/3-end.png)

## make.fun badges

![make.fun badge](https://make.fun/badge/gta6-01.svg)
![make.fun rank](https://make.fun/badge/gta6-01/garc/rank.svg)
![make.fun reward](https://make.fun/badge/gta6-01/garc/reward.svg)

## Build and run

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The entrypoint copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.

## License

MIT
