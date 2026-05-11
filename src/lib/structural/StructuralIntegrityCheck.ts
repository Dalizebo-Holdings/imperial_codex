/**
 * StructuralIntegrityCheck — startup validator for mandatory repository paths.
 *
 * Checks that every path required by Requirement 8 exists on the filesystem.
 * For each missing path a STRUCTURAL_INTEGRITY_WARNING is emitted to the
 * console (startup log only — not an HTTP error).
 *
 * Returns a summary: { ok: boolean, missingPaths: string[] }
 *
 * References: Requirement 8.6, Design §Startup Sequence, Design §Error Code Registry
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Mandatory paths (relative to the repository root / process.cwd())
// ---------------------------------------------------------------------------

export const MANDATORY_PATHS: ReadonlyArray<string> = [
  'core/KERNEL_V16_MASTER.md',
  'core/PILLARS.md',
  'core/LIBRARY.md',
  'os-modules',
  'vault/CLEARANCE_CODES.json',
  'instruments',
  'rituals/GRABOVOI_SEQUENCES.md',
  'rituals/SIGIL_LOG.md',
];

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface StructuralIntegrityResult {
  /** true when every mandatory path exists; false if one or more are missing */
  ok: boolean;
  /** Absolute paths that were not found on the filesystem */
  missingPaths: string[];
}

// ---------------------------------------------------------------------------
// Main checker
// ---------------------------------------------------------------------------

/**
 * Run the structural integrity check.
 *
 * @param rootDir  Repository root to resolve paths against.
 *                 Defaults to `process.cwd()`. Override in tests.
 */
export function checkStructuralIntegrity(rootDir?: string): StructuralIntegrityResult {
  const root = rootDir ?? process.cwd();
  const missingPaths: string[] = [];

  for (const relativePath of MANDATORY_PATHS) {
    const absolutePath = path.resolve(root, relativePath);

    if (!fs.existsSync(absolutePath)) {
      missingPaths.push(absolutePath);
      console.warn(
        `[StructuralIntegrityCheck] STRUCTURAL_INTEGRITY_WARNING: mandatory path missing: ${absolutePath}`
      );
    }
  }

  return {
    ok: missingPaths.length === 0,
    missingPaths,
  };
}
