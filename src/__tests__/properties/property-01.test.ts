/**
 * Property 1: Kernel Identifier Set Validation
 *
 * For any set of OS_Module identifier strings parsed from the Kernel
 * configuration file, the validator SHALL accept the set if and only if it
 * contains exactly the 36 canonical slugs (no more, no fewer, no
 * substitutions). For any set that differs from the canonical 36, the
 * validator SHALL return a halted status and a diff listing every missing
 * and every unexpected identifier.
 *
 * Validates: Requirements 1.4, 1.5
 *
 * // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
 */

import * as fc from 'fast-check';
import { validateSlugs, CANONICAL_SLUGS } from '@/lib/kernel/KernelLoader';

const CANONICAL_ARRAY = [...CANONICAL_SLUGS];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates a random non-canonical slug (guaranteed not in CANONICAL_SLUGS). */
const nonCanonicalSlug = fc
  .stringMatching(/^[A-Z]{2,8}-OS$/)
  .filter((s) => !CANONICAL_SLUGS.has(s));

// ---------------------------------------------------------------------------
// Property 1: Accept iff exactly the canonical 36
// ---------------------------------------------------------------------------

describe('Property 1: Kernel Identifier Set Validation', () => {
  // -------------------------------------------------------------------------
  // 1a. The canonical set is always accepted
  // -------------------------------------------------------------------------
  it('accepts any permutation of the exact canonical 36 slugs', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    fc.assert(
      fc.property(
        // Shuffle the canonical array in an arbitrary order
        fc.shuffledSubarray(CANONICAL_ARRAY, { minLength: 36, maxLength: 36 }),
        (slugs) => {
          const result = validateSlugs(slugs);
          return (
            result.ok === true &&
            result.missing.length === 0 &&
            result.unexpected.length === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 1b. Any set missing at least one canonical slug is rejected
  // -------------------------------------------------------------------------
  it('rejects any set that is missing at least one canonical slug', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    fc.assert(
      fc.property(
        // Pick a strict subset of the canonical slugs (1 to 35 of them)
        fc.shuffledSubarray(CANONICAL_ARRAY, { minLength: 1, maxLength: 35 }),
        (slugs) => {
          const result = validateSlugs(slugs);
          return (
            result.ok === false &&
            result.missing.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 1c. Any set containing an unexpected slug is rejected
  // -------------------------------------------------------------------------
  it('rejects any set that contains an unexpected (non-canonical) slug', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    fc.assert(
      fc.property(
        // Full canonical set plus at least one extra non-canonical slug
        fc.array(nonCanonicalSlug, { minLength: 1, maxLength: 5 }),
        (extras) => {
          const slugs = [...CANONICAL_ARRAY, ...extras];
          const result = validateSlugs(slugs);
          return (
            result.ok === false &&
            result.unexpected.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 1d. The diff lists every missing slug
  // -------------------------------------------------------------------------
  it('lists every missing slug in the diff when slugs are absent', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    fc.assert(
      fc.property(
        // Drop between 1 and 10 slugs from the canonical set
        fc.integer({ min: 1, max: 10 }).chain((dropCount) =>
          fc.shuffledSubarray(CANONICAL_ARRAY, {
            minLength: 36 - dropCount,
            maxLength: 36 - dropCount,
          })
        ),
        (slugs) => {
          const result = validateSlugs(slugs);
          const presentSet = new Set(slugs);
          const expectedMissing = CANONICAL_ARRAY.filter((s) => !presentSet.has(s));

          // Every expected-missing slug must appear in result.missing
          return expectedMissing.every((s) => result.missing.includes(s));
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 1e. The diff lists every unexpected slug
  // -------------------------------------------------------------------------
  it('lists every unexpected slug in the diff when extras are present', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    fc.assert(
      fc.property(
        fc.array(nonCanonicalSlug, { minLength: 1, maxLength: 5 }),
        (extras) => {
          // Use only the extras (no canonical slugs) to guarantee unexpected entries
          const result = validateSlugs(extras);
          return extras.every((s) => result.unexpected.includes(s));
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 1f. Empty set is rejected with all 36 slugs listed as missing
  // -------------------------------------------------------------------------
  it('rejects an empty slug set and lists all 36 canonical slugs as missing', () => {
    // Feature: imperial-codex-v16, Property 1: Kernel Identifier Set Validation
    const result = validateSlugs([]);
    expect(result.ok).toBe(false);
    expect(result.missing).toHaveLength(36);
    expect(result.unexpected).toHaveLength(0);
  });
});
