/**
 * Unit tests for StructuralIntegrityCheck
 *
 * Covers:
 *  - all mandatory paths present → ok: true, no warnings emitted
 *  - each individual missing path → ok: false, correct STRUCTURAL_INTEGRITY_WARNING logged
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  checkStructuralIntegrity,
  MANDATORY_PATHS,
  type StructuralIntegrityResult,
} from '../StructuralIntegrityCheck';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temporary directory that contains ALL mandatory paths so we have
 * a clean "all-present" baseline.
 */
function createFullStructure(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sic-test-'));

  for (const rel of MANDATORY_PATHS) {
    const abs = path.join(root, rel);
    const dir = path.dirname(abs);
    fs.mkdirSync(dir, { recursive: true });

    // Directories (no extension) → create as directory; files → create as file
    if (!path.extname(rel)) {
      fs.mkdirSync(abs, { recursive: true });
    } else {
      fs.writeFileSync(abs, '', 'utf-8');
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StructuralIntegrityCheck', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // 1. All paths present
  // -------------------------------------------------------------------------
  describe('when all mandatory paths are present', () => {
    it('returns ok: true', () => {
      const root = createFullStructure();
      const result: StructuralIntegrityResult = checkStructuralIntegrity(root);
      expect(result.ok).toBe(true);
    });

    it('returns an empty missingPaths array', () => {
      const root = createFullStructure();
      const result = checkStructuralIntegrity(root);
      expect(result.missingPaths).toHaveLength(0);
    });

    it('does not emit any warnings', () => {
      const root = createFullStructure();
      checkStructuralIntegrity(root);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Each individual missing path emits the correct warning
  // -------------------------------------------------------------------------
  describe('when a mandatory path is missing', () => {
    it.each(MANDATORY_PATHS)(
      'detects missing path "%s" and emits STRUCTURAL_INTEGRITY_WARNING',
      (missingRelPath) => {
        // Build a full structure then remove the one path under test
        const root = createFullStructure();
        const absTarget = path.join(root, missingRelPath);

        // Remove file or directory
        if (fs.statSync(absTarget).isDirectory()) {
          fs.rmdirSync(absTarget, { recursive: true } as fs.RmDirOptions);
        } else {
          fs.unlinkSync(absTarget);
        }

        const result = checkStructuralIntegrity(root);

        // ok should be false
        expect(result.ok).toBe(false);

        // The absolute path should appear in missingPaths
        expect(result.missingPaths).toContain(absTarget);

        // A STRUCTURAL_INTEGRITY_WARNING should have been logged
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('STRUCTURAL_INTEGRITY_WARNING')
        );

        // The warning should mention the specific missing path
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(absTarget)
        );
      }
    );
  });

  // -------------------------------------------------------------------------
  // 3. Multiple missing paths
  // -------------------------------------------------------------------------
  describe('when multiple mandatory paths are missing', () => {
    it('reports all missing paths', () => {
      // Use an empty temp directory — nothing exists
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sic-empty-'));

      const result = checkStructuralIntegrity(root);

      expect(result.ok).toBe(false);
      expect(result.missingPaths).toHaveLength(MANDATORY_PATHS.length);
    });

    it('emits one warning per missing path', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sic-empty-'));

      checkStructuralIntegrity(root);

      expect(warnSpy).toHaveBeenCalledTimes(MANDATORY_PATHS.length);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Returned missingPaths are absolute
  // -------------------------------------------------------------------------
  describe('missingPaths format', () => {
    it('returns absolute paths, not relative ones', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sic-abs-'));

      const result = checkStructuralIntegrity(root);

      for (const p of result.missingPaths) {
        expect(path.isAbsolute(p)).toBe(true);
      }
    });
  });
});
