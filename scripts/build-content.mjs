#!/usr/bin/env node
/**
 * build-content.mjs
 *
 * Reads the studio's master Gaelic strings file:
 *   ~/scotling-studio/studio/content/gaelic_strings.json
 * and writes the browser-facing bundle the game actually fetches at runtime:
 *   ~/scotling-v2/public/content/gaelic_strings.json
 *
 * Why this exists: game.js must never hard-code Gaelic (CLAUDE.md 4.1 - only the
 * Gaelic Language Lead edits `gaelic`/`source_url`, and nothing a model wrote can
 * ship unreviewed). This script is the one-way door between the studio's
 * governed content store and the product's public assets.
 *
 * Safety default: rows with verified_by === "PENDING" are EXCLUDED from the
 * shipped bundle unless --include-pending is passed. This is deliberate, not an
 * oversight: entrenched article 4 says nothing reaches a real child until the
 * human checks on the Founder Card are done. --include-pending exists only for
 * local dev/testing of the pipeline mechanics (see scripts/test-content-pipeline.mjs)
 * and must never be used for a deployed build.
 *
 * Usage:
 *   node scripts/build-content.mjs
 *   node scripts/build-content.mjs --input <path> --output <path> --include-pending
 *
 * Exit codes: 0 on success (including a legitimate "0 strings shipped" build
 * while nothing is ratified yet). Non-zero on a missing/invalid input file or
 * duplicate ids, because those indicate a broken pipeline, not an empty one.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED_FIELDS = [
  'id', 'gaelic', 'english_gloss', 'usage_context',
  'category', 'source_url', 'confidence', 'dialect_note', 'verified_by'
];

function parseArgs(argv) {
  const args = { includePending: false, input: null, output: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--include-pending') args.includePending = true;
    else if (a === '--input') args.input = argv[++i];
    else if (a === '--output') args.output = argv[++i];
  }
  return args;
}

export function buildContent({ inputPath, outputPath, includePending, log = console.log, warn = console.warn }) {
  if (!existsSync(inputPath)) {
    throw new Error(
      `Cannot find studio Gaelic strings master at: ${inputPath}\n` +
      `This script expects ~/scotling-studio to be checked out as a sibling of ~/scotling-v2. ` +
      `Pass --input <path> to point at it explicitly if your checkout layout differs.`
    );
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (err) {
    throw new Error(`Studio Gaelic strings master is not valid JSON (${inputPath}): ${err.message}`);
  }

  if (!raw || !Array.isArray(raw.strings)) {
    throw new Error(`Studio Gaelic strings master at ${inputPath} is missing a "strings" array.`);
  }

  const shipped = {};
  const seenIds = new Set();
  let pendingExcluded = 0;
  let malformedSkipped = 0;

  for (const row of raw.strings) {
    const missing = REQUIRED_FIELDS.filter((f) => !row || row[f] === undefined || row[f] === null || row[f] === '');
    if (missing.length > 0) {
      warn(`[build-content] skipping malformed row (missing: ${missing.join(', ')}): ${JSON.stringify(row)}`);
      malformedSkipped++;
      continue;
    }

    if (seenIds.has(row.id)) {
      throw new Error(`Duplicate Gaelic string id in master file: "${row.id}". Ids must be unique.`);
    }
    seenIds.add(row.id);

    if (row.verified_by === 'PENDING' && !includePending) {
      pendingExcluded++;
      continue;
    }

    shipped[row.id] = {
      gaelic: row.gaelic,
      english_gloss: row.english_gloss,
      usage_context: row.usage_context,
      category: row.category,
      source_url: row.source_url,
      confidence: row.confidence,
      dialect_note: row.dialect_note,
      verified_by: row.verified_by
    };
  }

  const bundle = {
    _meta: {
      generated_at: new Date().toISOString(),
      generated_by: 'scripts/build-content.mjs',
      source: inputPath,
      source_row_count: raw.strings.length,
      shipped_count: Object.keys(shipped).length,
      pending_excluded_count: pendingExcluded,
      malformed_skipped_count: malformedSkipped,
      include_pending: includePending
    },
    strings: shipped
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(bundle, null, 2) + '\n', 'utf8');

  log(
    `[build-content] wrote ${outputPath}\n` +
    `  source rows: ${raw.strings.length} | shipped: ${bundle._meta.shipped_count} | ` +
    `pending excluded: ${pendingExcluded} | malformed skipped: ${malformedSkipped} | ` +
    `include_pending=${includePending}`
  );

  return bundle;
}

// Only run as a CLI when invoked directly (so tests can import buildContent()).
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input ?? resolve(__dirname, '../../scotling-studio/studio/content/gaelic_strings.json'));
  const outputPath = resolve(args.output ?? resolve(__dirname, '../public/content/gaelic_strings.json'));

  try {
    buildContent({ inputPath, outputPath, includePending: args.includePending });
  } catch (err) {
    console.error(`[build-content] FAILED: ${err.message}`);
    process.exit(1);
  }
}
