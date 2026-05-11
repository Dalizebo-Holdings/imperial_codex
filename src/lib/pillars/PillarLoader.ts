/**
 * PillarLoader — reads, parses, and validates /core/PILLARS.md.
 *
 * Responsibilities:
 *  - Parse the Markdown file: each Pillar is a YAML front-matter block
 *    (code, cluster, title) followed by body text, separated by `---`
 *  - Validate each Pillar: unique code, range 001–207, valid cluster
 *  - Populate InMemoryStore.pillars Map and pillarSearchIndex Fuse.js instance
 *  - Return a summary of loaded pillars and any validation errors
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Pillar, PillarCluster } from './types';
import { getStore } from '@/lib/store/InMemoryStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PILLAR_CODE_MIN = 1;
export const PILLAR_CODE_MAX = 207;

export const CANONICAL_CLUSTERS: ReadonlySet<PillarCluster> = new Set<PillarCluster>([
  'Fiscal Weaponization',
  'Hegemony & Capture',
  'Infrastructure & Physical Dominance',
  'Cognitive Dominance & Succession',
  'Singularity Laws',
]);

/** Cluster ranges (inclusive) for validation */
export const CLUSTER_RANGES: ReadonlyMap<PillarCluster, { min: number; max: number }> = new Map([
  ['Fiscal Weaponization', { min: 1, max: 40 }],
  ['Hegemony & Capture', { min: 41, max: 105 }],
  ['Infrastructure & Physical Dominance', { min: 106, max: 150 }],
  ['Cognitive Dominance & Succession', { min: 151, max: 200 }],
  ['Singularity Laws', { min: 201, max: 207 }],
]);

const DEFAULT_PILLARS_PATH = path.resolve(process.cwd(), 'core', 'PILLARS.md');

const PILLAR_FUSE_OPTIONS: IFuseOptions<Pillar> = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'body', weight: 0.3 },
    { name: 'cluster', weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.4,
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface PillarLoadResult {
  pillars: Pillar[];
  validationErrors: string[];
  /** Total records parsed (including invalid ones) */
  parsedCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Zero-pad a number to 3 digits.
 */
export function padCode(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Parse the numeric value from a zero-padded code string.
 * Returns NaN if the string is not a valid code.
 */
export function parseCode(code: string): number {
  if (!/^\d{3}$/.test(code)) return NaN;
  return parseInt(code, 10);
}

/**
 * Validate a single Pillar record.
 * Returns an array of error strings (empty = valid).
 */
export function validatePillar(
  pillar: Partial<Pillar>,
  seenCodes: Set<string>
): string[] {
  const errors: string[] = [];

  // Code presence and format
  if (!pillar.code || typeof pillar.code !== 'string') {
    errors.push(`Missing or invalid code field`);
    return errors; // can't continue without a code
  }

  const codeStr = pillar.code;

  if (!/^\d{3}$/.test(codeStr)) {
    errors.push(`Code "${codeStr}" is not a valid three-digit zero-padded string`);
    return errors;
  }

  const codeNum = parseInt(codeStr, 10);

  // Range check
  if (codeNum < PILLAR_CODE_MIN || codeNum > PILLAR_CODE_MAX) {
    errors.push(
      `Code "${codeStr}" is outside the valid range ${padCode(PILLAR_CODE_MIN)}–${padCode(PILLAR_CODE_MAX)}`
    );
  }

  // Uniqueness check
  if (seenCodes.has(codeStr)) {
    errors.push(`Duplicate code "${codeStr}"`);
  }

  // Cluster check
  if (!pillar.cluster || !CANONICAL_CLUSTERS.has(pillar.cluster as PillarCluster)) {
    errors.push(
      `Code "${codeStr}" has invalid cluster "${pillar.cluster}". ` +
        `Must be one of: ${[...CANONICAL_CLUSTERS].join(', ')}`
    );
  } else {
    // Cluster membership range check
    const range = CLUSTER_RANGES.get(pillar.cluster as PillarCluster);
    if (range && (codeNum < range.min || codeNum > range.max)) {
      errors.push(
        `Code "${codeStr}" belongs to cluster "${pillar.cluster}" but falls outside ` +
          `that cluster's range ${padCode(range.min)}–${padCode(range.max)}`
      );
    }
  }

  // Title check
  if (!pillar.title || typeof pillar.title !== 'string' || pillar.title.trim() === '') {
    errors.push(`Code "${codeStr}" is missing a title`);
  }

  // Body check
  if (!pillar.body || typeof pillar.body !== 'string' || pillar.body.trim() === '') {
    errors.push(`Code "${codeStr}" is missing body text`);
  }

  return errors;
}

/**
 * Parse PILLARS.md content into an array of raw Pillar-like objects.
 *
 * The file format is a sequence of YAML front-matter blocks separated by
 * `---` delimiters.  Each block looks like:
 *
 * ```
 * ---
 * code: "001"
 * cluster: "Fiscal Weaponization"
 * title: "Capital Supremacy"
 * ---
 *
 * Body text here...
 *
 * ---
 * code: "002"
 * ...
 * ```
 *
 * We split on the pattern `\n---\ncode:` to isolate each pillar section,
 * then use gray-matter to parse the front-matter from each section.
 */
export function parsePillarsContent(
  rawContent: string
): Array<{ code: string; cluster: string; title: string; body: string }> {
  const results: Array<{ code: string; cluster: string; title: string; body: string }> = [];

  // Split the file into individual pillar blocks.
  // Each block starts with `---\ncode:` and ends before the next `---\ncode:`.
  // We reconstruct the `---` prefix so gray-matter can parse it.
  const blockPattern = /(?:^|\n)---\n(?=code:)/g;
  const parts = rawContent.split(blockPattern).filter((p) => p.trim().length > 0);

  for (const part of parts) {
    // Reconstruct the front-matter block with leading `---`
    const block = `---\n${part.trimStart()}`;

    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(block);
    } catch {
      // Skip malformed blocks
      continue;
    }

    const { data, content } = parsed;

    if (!data.code) continue; // not a pillar block

    results.push({
      code: String(data.code),
      cluster: String(data.cluster ?? ''),
      title: String(data.title ?? ''),
      body: content.trim(),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

/**
 * Load and validate all Pillars from /core/PILLARS.md.
 * Populates InMemoryStore.pillars and InMemoryStore.pillarSearchIndex.
 *
 * @param filePath  Override the default path (useful in tests).
 */
export async function loadPillars(filePath?: string): Promise<PillarLoadResult> {
  const pillarsPath = filePath ?? DEFAULT_PILLARS_PATH;
  const validationErrors: string[] = [];

  // ------------------------------------------------------------------
  // 1. Read the file
  // ------------------------------------------------------------------
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(pillarsPath, 'utf-8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    const isNotFound = nodeErr?.code === 'ENOENT';
    const errorCode = isNotFound ? 'PILLAR_FILE_MISSING' : 'PILLAR_FILE_UNREADABLE';
    const errorMessage = isNotFound
      ? `Pillars file not found: ${pillarsPath}`
      : `Pillars file unreadable: ${pillarsPath} — ${err instanceof Error ? err.message : String(err)}`;

    console.error(`[PillarLoader] ${errorCode}: ${errorMessage}`);

    return { pillars: [], validationErrors: [errorMessage], parsedCount: 0 };
  }

  // ------------------------------------------------------------------
  // 2. Parse with remark to validate Markdown is well-formed
  // ------------------------------------------------------------------
  try {
    await remark().process(rawContent);
  } catch (err) {
    console.warn(`[PillarLoader] Markdown parse warning: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 3. Parse pillar blocks
  // ------------------------------------------------------------------
  const rawPillars = parsePillarsContent(rawContent);
  const parsedCount = rawPillars.length;

  // ------------------------------------------------------------------
  // 4. Validate and collect valid pillars
  // ------------------------------------------------------------------
  const seenCodes = new Set<string>();
  const validPillars: Pillar[] = [];

  for (const raw of rawPillars) {
    const errors = validatePillar(raw as Partial<Pillar>, seenCodes);

    if (errors.length > 0) {
      for (const e of errors) {
        console.warn(`[PillarLoader] Validation error: ${e}`);
        validationErrors.push(e);
      }
      // Still register the code as seen to catch duplicates
      if (raw.code) seenCodes.add(raw.code);
      continue;
    }

    seenCodes.add(raw.code);
    validPillars.push({
      code: raw.code,
      cluster: raw.cluster as PillarCluster,
      title: raw.title,
      body: raw.body,
    });
  }

  // ------------------------------------------------------------------
  // 5. Populate InMemoryStore
  // ------------------------------------------------------------------
  const store = getStore();

  // Rebuild the pillars Map
  store.pillars.clear();
  for (const pillar of validPillars) {
    store.pillars.set(pillar.code, pillar);
  }

  // Rebuild the Fuse.js search index
  const newIndex = new Fuse<Pillar>(validPillars, PILLAR_FUSE_OPTIONS);
  // Replace the search index on the store object in-place
  (store as { pillarSearchIndex: Fuse<Pillar> }).pillarSearchIndex = newIndex;

  console.info(
    `[PillarLoader] Loaded ${validPillars.length} valid Pillars ` +
      `(${validationErrors.length} validation errors, ${parsedCount} parsed).`
  );

  return { pillars: validPillars, validationErrors, parsedCount };
}
