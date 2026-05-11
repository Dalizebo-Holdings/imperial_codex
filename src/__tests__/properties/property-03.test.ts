/**
 * Property 3: Pillar Cluster Membership
 *
 * For any Pillar record in the registry, the Pillar SHALL belong to exactly
 * one of the five canonical clusters: Fiscal Weaponization, Hegemony and
 * Capture, Infrastructure and Physical Dominance, Cognitive Dominance and
 * Succession, or Singularity Laws.
 *
 * Validates: Requirements 2.2
 *
 * // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
 */

import * as fc from 'fast-check';
import {
  validatePillar,
  CANONICAL_CLUSTERS,
  CLUSTER_RANGES,
  padCode,
  PILLAR_CODE_MIN,
  PILLAR_CODE_MAX,
} from '@/lib/pillars/PillarLoader';
import type { Pillar, PillarCluster } from '@/lib/pillars/types';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const CANONICAL_CLUSTER_ARRAY = [...CANONICAL_CLUSTERS] as PillarCluster[];

/** Generates a valid cluster name */
const validClusterArb = fc.constantFrom(...CANONICAL_CLUSTER_ARRAY);

/** Generates an invalid cluster name (not in the canonical set) */
const invalidClusterArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !CANONICAL_CLUSTERS.has(s as PillarCluster));

/** Generates a valid code for a given cluster */
function codeForCluster(cluster: PillarCluster): fc.Arbitrary<string> {
  const range = CLUSTER_RANGES.get(cluster)!;
  return fc.integer({ min: range.min, max: range.max }).map((n) => padCode(n));
}

// ---------------------------------------------------------------------------
// Property 3a: Valid cluster names pass cluster validation
// ---------------------------------------------------------------------------

describe('Property 3: Pillar Cluster Membership', () => {
  it('a Pillar with a valid canonical cluster passes cluster validation', () => {
    // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
    fc.assert(
      fc.property(
        validClusterArb.chain((cluster) =>
          codeForCluster(cluster).map((code) => ({ code, cluster }))
        ),
        ({ code, cluster }) => {
          const pillar: Partial<Pillar> = {
            code,
            cluster,
            title: 'Test Pillar',
            body: 'Test body text',
          };
          const errors = validatePillar(pillar, new Set());
          return !errors.some((e) => e.includes('invalid cluster'));
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 3b: Invalid cluster names fail validation
  // ---------------------------------------------------------------------------
  it('a Pillar with an invalid cluster fails validation', () => {
    // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
    fc.assert(
      fc.property(
        invalidClusterArb,
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }).map(padCode),
        (cluster, code) => {
          const pillar: Partial<Pillar> = {
            code,
            cluster: cluster as PillarCluster,
            title: 'Test Pillar',
            body: 'Test body text',
          };
          const errors = validatePillar(pillar, new Set());
          return errors.some((e) => e.includes('invalid cluster'));
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property 3c: Every Pillar belongs to exactly one canonical cluster
  //              (the canonical clusters are mutually exclusive)
  // ---------------------------------------------------------------------------
  it('each canonical cluster is distinct — no cluster name appears in two clusters', () => {
    // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
    // This is a structural property: the set of canonical clusters has no duplicates
    const clusterArray = [...CANONICAL_CLUSTERS];
    const clusterSet = new Set(clusterArray);
    expect(clusterArray.length).toBe(clusterSet.size);
    expect(clusterArray.length).toBe(5);
  });

  // ---------------------------------------------------------------------------
  // Property 3d: Cluster ranges are non-overlapping and cover 001–207
  // ---------------------------------------------------------------------------
  it('cluster ranges are non-overlapping and together cover 001–207', () => {
    // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
    const ranges = [...CLUSTER_RANGES.values()].sort((a, b) => a.min - b.min);

    // Check coverage starts at 1
    expect(ranges[0].min).toBe(1);
    // Check coverage ends at 207
    expect(ranges[ranges.length - 1].max).toBe(207);

    // Check no gaps or overlaps
    for (let i = 0; i < ranges.length - 1; i++) {
      expect(ranges[i].max + 1).toBe(ranges[i + 1].min);
    }
  });

  // ---------------------------------------------------------------------------
  // Property 3e: For any code in 001–207, exactly one cluster range contains it
  // ---------------------------------------------------------------------------
  it('for any code in 001–207, exactly one cluster range contains it', () => {
    // Feature: imperial-codex-v16, Property 3: Pillar Cluster Membership
    fc.assert(
      fc.property(
        fc.integer({ min: PILLAR_CODE_MIN, max: PILLAR_CODE_MAX }),
        (codeNum) => {
          const matchingClusters = [...CLUSTER_RANGES.entries()].filter(
            ([, range]) => codeNum >= range.min && codeNum <= range.max
          );
          return matchingClusters.length === 1;
        }
      ),
      { numRuns: 207 }
    );
  });
});
