/**
 * Property 5: Pillar Search Result Ordering
 *
 * For any keyword query that returns one or more Pillar records, the results
 * SHALL be ordered such that the relevance score of each result is greater
 * than or equal to the relevance score of the next result (descending order).
 *
 * Validates: Requirements 2.4
 *
 * // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
 */

import * as fc from 'fast-check';
import { PillarService } from '@/lib/pillars/PillarService';
import { resetStore, getStore } from '@/lib/store/InMemoryStore';
import { padCode, PILLAR_CODE_MIN, PILLAR_CODE_MAX } from '@/lib/pillars/PillarLoader';
import type { Pillar, PillarCluster } from '@/lib/pillars/types';
import Fuse from 'fuse.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLUSTERS: PillarCluster[] = [
  'Fiscal Weaponization',
  'Hegemony & Capture',
  'Infrastructure & Physical Dominance',
  'Cognitive Dominance & Succession',
  'Singularity Laws',
];

function clusterForCode(codeNum: number): PillarCluster {
  if (codeNum <= 40) return 'Fiscal Weaponization';
  if (codeNum <= 105) return 'Hegemony & Capture';
  if (codeNum <= 150) return 'Infrastructure & Physical Dominance';
  if (codeNum <= 200) return 'Cognitive Dominance & Succession';
  return 'Singularity Laws';
}

/** Build a Pillar record for a given numeric code */
function makePillar(codeNum: number, title: string, body: string): Pillar {
  return {
    code: padCode(codeNum),
    cluster: clusterForCode(codeNum),
    title,
    body,
  };
}

/** Populate the store with a set of pillars and rebuild the Fuse index */
function populateStore(pillars: Pillar[]): void {
  resetStore();
  const store = getStore();
  for (const p of pillars) {
    store.pillars.set(p.code, p);
  }
  (store as { pillarSearchIndex: Fuse<Pillar> }).pillarSearchIndex = new Fuse(pillars, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'body', weight: 0.3 },
      { name: 'cluster', weight: 0.1 },
    ],
    includeScore: true,
    threshold: 0.4,
  });
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates a non-empty, non-whitespace search query */
const nonEmptyQueryArb = fc
  .string({ minLength: 2, maxLength: 20 })
  .filter((s) => s.trim().length > 0);

/** Generates a small collection of distinct Pillars with varied titles */
const pillarCollectionArb = fc
  .uniqueArray(
    fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
    { minLength: 3, maxLength: 15 }
  )
  .map((codes) =>
    codes.map((codeNum) =>
      makePillar(
        codeNum,
        `Strategic Pillar ${padCode(codeNum)} Title`,
        `Body text describing pillar ${padCode(codeNum)} in detail.`
      )
    )
  );

// ---------------------------------------------------------------------------
// Property 5: Search result ordering
// ---------------------------------------------------------------------------

describe('Property 5: Pillar Search Result Ordering', () => {
  let service: PillarService;

  beforeEach(() => {
    resetStore();
    service = new PillarService();
  });

  afterEach(() => {
    resetStore();
  });

  // -------------------------------------------------------------------------
  // 5a: Results are ordered by ascending score (most relevant first)
  //     for any query that returns multiple results
  // -------------------------------------------------------------------------
  it('search results are ordered by ascending score (most relevant first)', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    await fc.assert(
      fc.asyncProperty(
        pillarCollectionArb,
        nonEmptyQueryArb,
        async (pillars, query) => {
          populateStore(pillars);
          const results = await service.search(query);

          // If fewer than 2 results, ordering is trivially satisfied
          if (results.length < 2) return true;

          for (let i = 0; i < results.length - 1; i++) {
            if (results[i].score > results[i + 1].score) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 5b: The first result has the lowest (best) score when multiple results exist
  // -------------------------------------------------------------------------
  it('the first result has the minimum score among all results', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    await fc.assert(
      fc.asyncProperty(
        pillarCollectionArb,
        nonEmptyQueryArb,
        async (pillars, query) => {
          populateStore(pillars);
          const results = await service.search(query);

          if (results.length === 0) return true;

          const minScore = Math.min(...results.map((r) => r.score));
          return results[0].score === minScore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 5c: Each result contains a score that is a finite number in [0, 1]
  // -------------------------------------------------------------------------
  it('every search result has a score that is a finite number in [0, 1]', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    await fc.assert(
      fc.asyncProperty(
        pillarCollectionArb,
        nonEmptyQueryArb,
        async (pillars, query) => {
          populateStore(pillars);
          const results = await service.search(query);

          return results.every(
            (r) =>
              typeof r.score === 'number' &&
              isFinite(r.score) &&
              r.score >= 0 &&
              r.score <= 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // 5d: A query that exactly matches a title returns that pillar first
  //     (it should have the best relevance score)
  // -------------------------------------------------------------------------
  it('an exact title match appears first in results', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    const targetTitle = 'Capital Supremacy Doctrine';
    const pillars: Pillar[] = [
      makePillar(1, targetTitle, 'Capital is the primary weapon.'),
      makePillar(2, 'Revenue Extraction Mandate', 'Extract all revenue.'),
      makePillar(3, 'Compound Growth Imperative', 'Compound your returns.'),
      makePillar(4, 'Liquidity Fortress Protocol', 'Maintain liquidity.'),
      makePillar(5, 'Tax Optimisation Supremacy', 'Minimise tax burden.'),
    ];
    populateStore(pillars);

    const results = await service.search(targetTitle);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].pillar.title).toBe(targetTitle);
  });

  // -------------------------------------------------------------------------
  // 5e: Empty query always returns empty results (no ordering needed)
  // -------------------------------------------------------------------------
  it('empty query returns empty results regardless of store contents', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    await fc.assert(
      fc.asyncProperty(
        pillarCollectionArb,
        async (pillars) => {
          populateStore(pillars);
          const results = await service.search('');
          return results.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  // -------------------------------------------------------------------------
  // 5f: Results are stable — same query on same data returns same ordering
  // -------------------------------------------------------------------------
  it('search results are stable — same query returns same ordering', async () => {
    // Feature: imperial-codex-v16, Property 5: Pillar Search Result Ordering
    await fc.assert(
      fc.asyncProperty(
        pillarCollectionArb,
        nonEmptyQueryArb,
        async (pillars, query) => {
          populateStore(pillars);
          const results1 = await service.search(query);
          const results2 = await service.search(query);

          if (results1.length !== results2.length) return false;
          for (let i = 0; i < results1.length; i++) {
            if (results1[i].pillar.code !== results2[i].pillar.code) return false;
            if (results1[i].score !== results2[i].score) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
