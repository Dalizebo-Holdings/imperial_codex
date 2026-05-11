/**
 * Property 2: Pillar Code Uniqueness and Range
 *
 * For any collection of Pillar records loaded into the registry, every code
 * SHALL be unique and SHALL fall within the range 001-207 (inclusive,
 * zero-padded). No two Pillars may share the same code.
 *
 * Validates: Requirements 2.1
 *
 * // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
 */

import * as fc from 'fast-check';
import { validatePillar, padCode, PILLAR_CODE_MIN, PILLAR_CODE_MAX } from '@/lib/pillars/PillarLoader';
import type { Pillar } from '@/lib/pillars/types';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates a valid zero-padded Pillar code string in range 001–207 */
const validCodeArb = fc
  .integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX })
  .map((n) => padCode(n));

/** Generates an out-of-range code (< 001 or > 207) */
const outOfRangeCodeArb = fc.oneof(
  fc.integer({ min: 0, max: 0 }).map((n) => padCode(n)),           // "000"
  fc.integer({ min: 208, max: 999 }).map((n) => padCode(n))        // "208"–"999"
);

/** Generates a minimal valid Pillar record */
const validPillarArb = validCodeArb.map(
  (code): Pillar => ({
    code,
    cluster: 'Fiscal Weaponization',
    title: `Pillar ${code}`,
    body: `Body for pillar ${code}`,
  })
);

// ---------------------------------------------------------------------------
// Property 2a: Every valid code is in range 001–207
// ---------------------------------------------------------------------------

describe('Property 2: Pillar Code Uniqueness and Range', () => {
  it('every valid code falls within 001–207 (inclusive)', () => {
    // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
    fc.assert(
      fc.property(validCodeArb, (code) => {
        const num = parseInt(code, 10);
        return num >= PILLAR_CODE_MIN && num <= PILLAR_CODE_MAX;
      }),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 2b: Out-of-range codes fail validation
  // ---------------------------------------------------------------------------
  it('out-of-range codes fail validation with a range error', () => {
    // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const pillar: Partial<Pillar> = {
          code,
          cluster: 'Fiscal Weaponization',
          title: 'Test',
          body: 'Test body',
        };
        const errors = validatePillar(pillar, new Set());
        return errors.some(
          (e) => e.includes('outside the valid range') || e.includes('outside')
        );
      }),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 2c: Duplicate codes fail validation
  // ---------------------------------------------------------------------------
  it('duplicate codes fail validation', () => {
    // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
    fc.assert(
      fc.property(validCodeArb, (code) => {
        const seenCodes = new Set<string>([code]); // code already seen
        const pillar: Partial<Pillar> = {
          code,
          cluster: 'Fiscal Weaponization',
          title: 'Test',
          body: 'Test body',
        };
        const errors = validatePillar(pillar, seenCodes);
        return errors.some((e) => e.includes('Duplicate'));
      }),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 2d: A collection of Pillars with unique valid codes passes
  //              uniqueness check (no duplicate errors)
  // ---------------------------------------------------------------------------
  it('a collection of Pillars with unique valid codes has no duplicate errors', () => {
    // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
    fc.assert(
      fc.property(
        fc.uniqueArray(validPillarArb, {
          selector: (p) => p.code,
          minLength: 1,
          maxLength: 20,
        }),
        (pillars) => {
          const seenCodes = new Set<string>();
          for (const pillar of pillars) {
            const errors = validatePillar(pillar, seenCodes);
            if (errors.some((e) => e.includes('Duplicate'))) return false;
            seenCodes.add(pillar.code);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 2e: padCode produces a 3-digit zero-padded string for any
  //              integer in 1–207
  // ---------------------------------------------------------------------------
  it('padCode produces a 3-digit zero-padded string for any integer in 1–207', () => {
    // Feature: imperial-codex-v16, Property 2: Pillar Code Uniqueness and Range
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (n) => {
          const code = padCode(n);
          return /^\d{3}$/.test(code) && parseInt(code, 10) === n;
        }
      ),
      { numRuns: 207 }
    );
  });
});
