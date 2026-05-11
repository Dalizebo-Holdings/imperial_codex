/**
 * Property 6: Out-of-Range Pillar Code Returns Structured Error
 *
 * For any integer code outside the range 001-207, querying the Pillar
 * registry SHALL return a structured error response that identifies the
 * submitted code and states it is outside the valid range.
 *
 * Validates: Requirements 2.5
 *
 * // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
 */

import * as fc from 'fast-check';
import { PillarService } from '@/lib/pillars/PillarService';
import { resetStore, getStore } from '@/lib/store/InMemoryStore';
import { padCode, PILLAR_CODE_MIN, PILLAR_CODE_MAX } from '@/lib/pillars/PillarLoader';
import type { Pillar } from '@/lib/pillars/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clusterForCode(codeNum: number): Pillar['cluster'] {
  if (codeNum <= 40) return 'Fiscal Weaponization';
  if (codeNum <= 105) return 'Hegemony & Capture';
  if (codeNum <= 150) return 'Infrastructure & Physical Dominance';
  if (codeNum <= 200) return 'Cognitive Dominance & Succession';
  return 'Singularity Laws';
}

function makePillar(codeNum: number): Pillar {
  const code = padCode(codeNum);
  return {
    code,
    cluster: clusterForCode(codeNum),
    title: `Pillar ${code} Title`,
    body: `Body text for pillar ${code}`,
  };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Generates a zero-padded code string for an integer strictly below 001
 * (i.e. "000") or strictly above 207 (i.e. "208"–"999").
 */
const outOfRangeCodeArb = fc.oneof(
  // Below minimum: only "000" is a valid 3-digit representation of 0
  fc.constant(padCode(0)),
  // Above maximum: 208–999
  fc.integer({ min: PILLAR_CODE_MAX + 1, max: 999 }).map((n) => padCode(n))
);

// ---------------------------------------------------------------------------
// Property 6: Out-of-range code returns structured error
// ---------------------------------------------------------------------------

describe('Property 6: Out-of-Range Pillar Code Returns Structured Error', () => {
  let service: PillarService;

  beforeEach(() => {
    resetStore();
    service = new PillarService();
    // Populate the store with all 207 pillars so the test is not trivially
    // returning PILLAR_NOT_FOUND due to an empty store.
    const store = getStore();
    for (let i = PILLAR_CODE_MIN; i <= PILLAR_CODE_MAX; i++) {
      const pillar = makePillar(i);
      store.pillars.set(pillar.code, pillar);
    }
  });

  afterEach(() => {
    resetStore();
  });

  // -------------------------------------------------------------------------
  // 6a: Any out-of-range code returns an error (not a pillar)
  // -------------------------------------------------------------------------
  it('any out-of-range code returns an error response, not a pillar', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const result = service.getByCodeOrError(code);
        return 'error' in result;
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 6b: The error code is PILLAR_CODE_OUT_OF_RANGE for any out-of-range code
  // -------------------------------------------------------------------------
  it('the error code is PILLAR_CODE_OUT_OF_RANGE for any out-of-range code', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const result = service.getByCodeOrError(code);
        return 'error' in result && result.error.code === 'PILLAR_CODE_OUT_OF_RANGE';
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 6c: The error response identifies the submitted code
  // -------------------------------------------------------------------------
  it('the error response identifies the submitted code in its details', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const result = service.getByCodeOrError(code);
        if (!('error' in result)) return false;
        const { error } = result;
        // The submitted code must appear in either the message or the details
        const inMessage = error.message.includes(code);
        const inDetails =
          error.details !== undefined &&
          typeof error.details === 'object' &&
          error.details !== null &&
          'submittedCode' in error.details &&
          (error.details as Record<string, unknown>).submittedCode === code;
        return inMessage || inDetails;
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 6d: The error message states the code is outside the valid range
  // -------------------------------------------------------------------------
  it('the error message states the code is outside the valid range', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const result = service.getByCodeOrError(code);
        if (!('error' in result)) return false;
        const { message } = result.error;
        // The message must reference the valid range boundaries
        return (
          message.toLowerCase().includes('range') ||
          message.includes(padCode(PILLAR_CODE_MIN)) ||
          message.includes(padCode(PILLAR_CODE_MAX))
        );
      }),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 6e: Valid in-range codes do NOT return PILLAR_CODE_OUT_OF_RANGE
  // -------------------------------------------------------------------------
  it('valid in-range codes never return PILLAR_CODE_OUT_OF_RANGE', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }).map(padCode),
        (code) => {
          const result = service.getByCodeOrError(code);
          if (!('error' in result)) return true; // pillar found — no error at all
          return result.error.code !== 'PILLAR_CODE_OUT_OF_RANGE';
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 6f: Boundary values — "000" and "208" both return PILLAR_CODE_OUT_OF_RANGE
  // -------------------------------------------------------------------------
  it('boundary value "000" returns PILLAR_CODE_OUT_OF_RANGE', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    const result = service.getByCodeOrError('000');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.code).toBe('PILLAR_CODE_OUT_OF_RANGE');
    }
  });

  it('boundary value "208" returns PILLAR_CODE_OUT_OF_RANGE', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    const result = service.getByCodeOrError('208');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.code).toBe('PILLAR_CODE_OUT_OF_RANGE');
    }
  });

  // -------------------------------------------------------------------------
  // 6g: The structured error includes validMin and validMax in details
  // -------------------------------------------------------------------------
  it('the structured error details include validMin and validMax', () => {
    // Feature: imperial-codex-v16, Property 6: Out-of-Range Pillar Code Returns Structured Error
    fc.assert(
      fc.property(outOfRangeCodeArb, (code) => {
        const result = service.getByCodeOrError(code);
        if (!('error' in result)) return false;
        const details = result.error.details as Record<string, unknown> | undefined;
        if (!details) return false;
        return (
          details.validMin === padCode(PILLAR_CODE_MIN) &&
          details.validMax === padCode(PILLAR_CODE_MAX)
        );
      }),
      { numRuns: 100 }
    );
  });
});
