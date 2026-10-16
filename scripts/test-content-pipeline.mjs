#!/usr/bin/env node
/**
 * test-content-pipeline.mjs
 *
 * A tiny, dependency-free test for the Gaelic content pipeline. Two things
 * it checks HARD (process exits 1 if either fails):
 *
 *   1. The pipeline mechanics work end-to-end: build-content.mjs can turn a
 *      gaelic_strings.json row into a shipped bundle entry, respecting the
 *      PENDING safety gate.
 *   2. The one string this task wired through the pipeline - Game 3's
 *      "Sin thu fhèin!" encouragement line - is no longer a hard-coded
 *      literal in public/game.js, and is instead requested from
 *      GaelicStrings.get(...).
 *
 * It also REPORTS (does not fail on) how many lines in public/game.js still
 * contain a hard-coded Gaelic character outside the two voice-system files
 * that already isolate their Gaelic into id->audio maps. That count is the
 * real migration backlog; see the content pipeline doc in
 * studio/pods/engineering for why this task deliberately wired one string
 * rather than claiming the whole file is migrated.
 *
 * Usage: node scripts/test-content-pipeline.mjs
 */

import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContent } from './build-content.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const GAME_JS = join(REPO_ROOT, 'public', 'game.js');
const FIXTURE = join(__dirname, 'fixtures', 'gaelic_strings.fixture.json');
const WIRED_ID = 'game3.encouragement.sin_thu_fhein';
const WIRED_GAELIC = 'Sin thu fhèin!';

const GAELIC_CHAR_RE = /[àèìòùÀÈÌÒÙ]/;
// Files that already isolate their Gaelic strings into an id/key -> audio-file
// map (a different, pre-existing migration, not part of this task's scope).
const KNOWN_ISOLATED_FILES = ['giomach-voice.js', 'ruairidh-voice.js'];

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}`);
    failures++;
  }
}

console.log('== 1. Pipeline mechanics (fixture, --include-pending, proves the transform) ==');
const tmpDir = mkdtempSync(join(tmpdir(), 'scotling-content-test-'));
const tmpOutput = join(tmpDir, 'gaelic_strings.json');
try {
  const bundle = buildContent({
    inputPath: FIXTURE,
    outputPath: tmpOutput,
    includePending: true,
    log: () => {},
    warn: () => {}
  });
  check('fixture builds without throwing', true);
  check(`shipped bundle contains "${WIRED_ID}"`, Boolean(bundle.strings[WIRED_ID]));
  check(
    `shipped gaelic text matches the attested source ("${WIRED_GAELIC}")`,
    bundle.strings[WIRED_ID]?.gaelic === WIRED_GAELIC
  );
} catch (err) {
  check(`fixture builds without throwing (error: ${err.message})`, false);
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log('== 2. Pipeline mechanics (real studio master, production default: PENDING excluded) ==');
try {
  const studioMaster = resolve(REPO_ROOT, '..', 'scotling-studio', 'studio', 'content', 'gaelic_strings.json');
  const prodTmpDir = mkdtempSync(join(tmpdir(), 'scotling-content-prod-test-'));
  const prodTmpOutput = join(prodTmpDir, 'gaelic_strings.json');
  const prodBundle = buildContent({
    inputPath: studioMaster,
    outputPath: prodTmpOutput,
    includePending: false,
    log: () => {},
    warn: () => {}
  });
  check('real studio master is reachable and parses', true);
  check(
    'production default never ships a PENDING row (none ratified yet, so 0 strings is correct)',
    prodBundle._meta.shipped_count === 0 || Object.values(prodBundle.strings).every((r) => r.verified_by !== 'PENDING')
  );
  rmSync(prodTmpDir, { recursive: true, force: true });
} catch (err) {
  check(`real studio master reachable (error: ${err.message})`, false);
}

console.log('== 3. One v1 string is actually wired through the loader in public/game.js ==');
const gameJs = readFileSync(GAME_JS, 'utf8');
const oldHardCodedArray = `this.encouragementMessages = ["Sin thu fhèin!", "Sgoinneil!", "Fìor Mhath!"];`;
check('the old fully-hard-coded array literal is gone', !gameJs.includes(oldHardCodedArray));
check(
  `game.js calls gaelicStrings.get('${WIRED_ID}')`,
  gameJs.includes(`gaelicStrings.get('${WIRED_ID}')`)
);
check(
  `the wired string's literal text is gone from game.js's array (still fine elsewhere, e.g. this file's own comments)`,
  !/this\.encouragementMessages\s*=\s*\[\s*"Sin thu fhèin!"/.test(gameJs)
);

console.log('== 4. Backlog report (informational only - does not fail the test) ==');
const lines = gameJs.split('\n');
const remaining = lines
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(({ line }) => GAELIC_CHAR_RE.test(line));
console.log(
  `  public/game.js still has ${remaining.length} line(s) with a hard-coded Gaelic character ` +
  `outside the loader (only 1 string has been migrated in this task). ` +
  `KNOWN_ISOLATED_FILES (${KNOWN_ISOLATED_FILES.join(', ')}) are a separate, pre-existing ` +
  `audio-key migration and are not counted here since they are game.js only.`
);

console.log('');
if (failures > 0) {
  console.error(`FAILED: ${failures} check(s) did not pass.`);
  process.exit(1);
} else {
  console.log('All hard checks passed.');
  process.exit(0);
}
