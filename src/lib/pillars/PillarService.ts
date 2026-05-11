/**
 * PillarService — thin read-only facade over the InMemoryStore's pillars field.
 *
 * Populated by PillarLoader during the startup sequence (instrumentation.ts).
 * All runtime code should access Pillar data through this service.
 */

import { getStore } from '@/lib/store/InMemoryStore';
import type { Pillar, PillarSearchResult } from './types';
import { PILLAR_CODE_MIN, PILLAR_CODE_MAX, padCode } from './PillarLoader';

// ---------------------------------------------------------------------------
// Timeout helper (mirrors the pattern used across all services)
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject({ code, message: `Operation timed out after ${ms}ms` }),
        ms
      )
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Structured error type
// ---------------------------------------------------------------------------

export interface PillarError {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// PillarService
// ---------------------------------------------------------------------------

export class PillarService {
  /**
   * Look up a Pillar by its zero-padded three-digit code.
   *
   * Returns the Pillar record, or null if not found.
   * Does NOT validate the range here — callers that need range validation
   * should use getByCodeOrError().
   */
  getByCode(code: string): Pillar | null {
    const store = getStore();
    return store.pillars.get(code) ?? null;
  }

  /**
   * Look up a Pillar by code with range validation.
   *
   * Returns:
   *  - `{ pillar }` on success
   *  - `{ error }` with PILLAR_CODE_OUT_OF_RANGE if code is outside 001–207
   *  - `{ error }` with PILLAR_NOT_FOUND if code is in range but not in registry
   */
  getByCodeOrError(code: string): { pillar: Pillar } | { error: PillarError } {
    // Validate format
    if (!/^\d{3}$/.test(code)) {
      const num = parseInt(code, 10);
      if (!isNaN(num) && (num < PILLAR_CODE_MIN || num > PILLAR_CODE_MAX)) {
        return {
          error: {
            code: 'PILLAR_CODE_OUT_OF_RANGE',
            message: `Pillar code "${code}" is outside the valid range ${padCode(PILLAR_CODE_MIN)}–${padCode(PILLAR_CODE_MAX)}`,
            details: { submittedCode: code, validMin: padCode(PILLAR_CODE_MIN), validMax: padCode(PILLAR_CODE_MAX) },
          },
        };
      }
      return {
        error: {
          code: 'PILLAR_NOT_FOUND',
          message: `Pillar code "${code}" is not a valid three-digit code`,
          details: { submittedCode: code },
        },
      };
    }

    const num = parseInt(code, 10);

    // Range check
    if (num < PILLAR_CODE_MIN || num > PILLAR_CODE_MAX) {
      return {
        error: {
          code: 'PILLAR_CODE_OUT_OF_RANGE',
          message: `Pillar code "${code}" is outside the valid range ${padCode(PILLAR_CODE_MIN)}–${padCode(PILLAR_CODE_MAX)}`,
          details: { submittedCode: code, validMin: padCode(PILLAR_CODE_MIN), validMax: padCode(PILLAR_CODE_MAX) },
        },
      };
    }

    const pillar = this.getByCode(code);
    if (!pillar) {
      return {
        error: {
          code: 'PILLAR_NOT_FOUND',
          message: `Pillar with code "${code}" was not found in the registry`,
          details: { submittedCode: code },
        },
      };
    }

    return { pillar };
  }

  /**
   * Full-text search across Pillars using the Fuse.js index.
   * Results are ordered by descending relevance (lower Fuse score = more relevant).
   * Enforces a 1000ms timeout.
   *
   * Returns an empty array if the store is not populated or the query is empty.
   */
  async search(query: string): Promise<PillarSearchResult[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    const searchPromise = new Promise<PillarSearchResult[]>((resolve) => {
      const store = getStore();

      if (store.pillars.size === 0) {
        resolve([]);
        return;
      }

      const fuseResults = store.pillarSearchIndex.search(query);

      // Map Fuse results to PillarSearchResult, normalising the score.
      // Fuse returns score 0 = perfect match, 1 = no match.
      // We expose the score as-is (lower = more relevant) per the type definition.
      const results: PillarSearchResult[] = fuseResults.map((r) => ({
        pillar: r.item,
        score: r.score ?? 1,
      }));

      // Results from Fuse are already ordered by ascending score (most relevant first).
      resolve(results);
    });

    return withTimeout(searchPromise, 1000, 'PILLAR_SEARCH_TIMEOUT');
  }

  /**
   * Returns all Pillars as an array, ordered by code ascending.
   */
  getAll(): Pillar[] {
    const store = getStore();
    return [...store.pillars.values()].sort((a, b) => a.code.localeCompare(b.code));
  }
}

// Singleton instance — import this rather than constructing a new one.
export const pillarService = new PillarService();
