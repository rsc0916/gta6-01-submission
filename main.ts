// gta6-01 entrypoint (Node 22, standard library only).
// Entry point for the open-world crime game submission.
// Copies game/ and screenshots/ from the repository to /output and writes
// /output/dossier.json using buildDossier from vendor/makefun-game.ts.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate required inputs before building. The entrypoint must refuse to run
// when the repository is missing the game/ directory or game/index.html, so
// the grader never receives an incomplete output tree.
const gameDir = join(here, 'game');
const indexHtml = join(gameDir, 'index.html');
if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) {
  throw new Error(`gta6-01: missing game/ directory at ${gameDir}`);
}
if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
  throw new Error(`gta6-01: missing game/index.html at ${indexHtml}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Build a small manifest describing what was handed in, for the grader's
// intake. The dossier itself is produced by buildDossier below.
const manifest = {
  entrypoint: 'main.ts',
  competition: 'gta6-01',
  game_files: countTree(gameDir),
  screenshot_files: existsSync(join(here, 'screenshots')) ? countTree(join(here, 'screenshots')) : 0,
};
writeFileSync(join(out, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

function countTree(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir, { recursive: true })) {
    total += 1;
  }
  return total;
}

// Dossier caps mirror the scorer's reference/gate.json: text_max_bytes shapes
// the output bytes; the remaining caps refuse entries the scorer would reject:
// max 4 screenshots, max 256 KiB each, max 993 game files/dirs, max 48 MiB
// game bytes total, max 1000 UTF-8 bytes per game path.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  })
);
