/**
 * Property 4: Pillar Lookup Correctness
 *
 * For any valid Pillar code in the range 001-207, querying the registry by
 * that code SHALL return the Pillar record whose code field matches the query,
 * including all required fields (code, cluster, title, body).
 *
 * Validates: Requirements 2.3
 *
 * // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
 */

import * as fc from 'fast-check';
import { PillarService } from '@/lib/pillars/PillarService';
import { resetStore, getStore } from '@/lib/store/InMemoryStore';
import { padCode, PILLAR_CODE_MIN, PILLAR_CODE_MAX, CANONICAL_CLUSTERS } from '@/lib/pillars/PillarLoader';
import type { Pillar, PillarCluster } from '@/lib/pillars/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CANONICAL_CLUSTER_ARRAY = [...CANONICAL_CLUSTERS] as PillarCluster[];

/** Build a Pillar record for a given numeric code */
function makePillar(codeNum: number): Pillar {
  const code = padCode(codeNum);
  // Assign a cluster based on the code range
  let cluster: PillarCluster = 'Fiscal Weaponization';
  if (codeNum >= 41 && codeNum <= 105) cluster = 'Hegemony & Capture';
  else if (codeNum >= 106 && codeNum <= 150) cluster = 'Infrastructure & Physical Dominance';
  else if (codeNum >= 151 && codeNum <= 200) cluster = 'Cognitive Dominance & Succession';
  else if (codeNum >= 201 && codeNum <= 207) cluster = 'Singularity Laws';

  return {
    code,
    cluster,
    title: `Pillar ${code} Title`,
    body: `Body text for pillar ${code}`,
  };
}

// ---------------------------------------------------------------------------
// Property 4: Lookup correctness
// ---------------------------------------------------------------------------

describe('Property 4: Pillar Lookup Correctness', () => {
  let service: PillarService;

  beforeEach(() => {
    resetStore();
    service = new PillarService();
  });

  afterEach(() => {
    resetStore();
  });

  // -------------------------------------------------------------------------
  // 4a: For any code stored in the registry, getByCode returns that exact record
  // -------------------------------------------------------------------------
  it('getByCode returns the exact Pillar record for any stored code', () => {
    // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          resetStore();
          const store = getStore();
          const pillar = makePillar(codeNum);
          store.pillars.set(pillar.code, pillar);

          const result = service.getByCode(pillar.code);
          return (
            result !== null &&
            result.code === pillar.code &&
            result.cluster === pillar.cluster &&
            result.title === pillar.title &&
            result.body === pillar.body
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 4b: The returned Pillar's code field matches the query code exactly
  // -------------------------------------------------------------------------
  it('the returned Pillar code field matches the queried code', () => {
    // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          resetStore();
          const store = getStore();
          const pillar = makePillar(codeNum);
          store.pillars.set(pillar.code, pillar);

          const result = service.getByCode(pillar.code);
          return result !== null && result.code === pillar.code;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 4c: The returned Pillar has all required fields (code, cluster, title, body)
  // -------------------------------------------------------------------------
  it('the returned Pillar has all required fields populated', () => {
    // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          resetStore();
          const store = getStore();
          const pillar = makePillar(codeNum);
          store.pillars.set(pillar.code, pillar);

          const result = service.getByCode(pillar.code);
          if (result === null) return false;

          return (
            typeof result.code === 'string' && result.code.length > 0 &&
            typeof result.cluster === 'string' && result.cluster.length > 0 &&
            typeof result.title === 'string' && result.title.length > 0 &&
            typeof result.body === 'string' && result.body.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 4d: getByCodeOrError returns the pillar (not an error) for any stored code
  // -------------------------------------------------------------------------
  it('getByCodeOrError returns the pillar for any stored valid code', () => {
    // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          resetStore();
          const store = getStore();
          const pillar = makePillar(codeNum);
          store.pillars.set(pillar.code, pillar);

          const result = service.getByCodeOrError(pillar.code);
          return 'pillar' in result && result.pillar.code === pillar.code;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 4e: Lookup is consistent — querying the same code twice returns the same result
  // -------------------------------------------------------------------------
  it('lookup is idempotent — querying the same code twice returns the same result', () => {
    // Feature: imperial-codex-v16, Property 4: Pillar Lookup Correctness
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          resetStore();
          const store = getStore();
          const pillar = makePillar(codeNum);
          store.pillars.set(pillar.code, pillar);

          const result1 = service.getByCode(pillar.code);
          const result2 = service.getByCode(pillar.code);

          if (result1 === null && result2 === null) return true;
          if (result1 === null || result2 === null) return false;

          return (
            result1.code === result2.code &&
            result1.cluster === result2.cluster &&
            result1.title === result2.title &&
            result1.body === result2.body
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
