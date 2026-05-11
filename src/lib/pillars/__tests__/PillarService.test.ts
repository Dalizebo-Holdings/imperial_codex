/**
 * Unit tests for PillarService
 *
 * Covers:
 *  - no-results search (empty query, no data)
 *  - data source unavailable (empty store)
 *  - getByCode returns null for unknown code
 *  - getByCodeOrError returns structured error for out-of-range code
 *  - getByCodeOrError returns structured error for in-range but missing code
 */

import { jest } from '@jest/globals';
import { PillarService } from '../PillarService';
import { resetStore, getStore, setStore } from '@/lib/store/InMemoryStore';
import type { Pillar } from '../types';
import Fuse from 'fuse.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePillar(code: string, title: string = `Pillar ${code}`): Pillar {
  return {
    code,
    cluster: 'Fiscal Weaponization',
    title,
    body: `Body text for pillar ${code}`,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PillarService', () => {
  let service: PillarService;

  beforeEach(() => {
    resetStore();
    service = new PillarService();
  });

  afterEach(() => {
    resetStore();
  });

  // -------------------------------------------------------------------------
  // getByCode
  // -------------------------------------------------------------------------
  describe('getByCode', () => {
    it('returns null when the store is empty (data source unavailable)', () => {
      const result = service.getByCode('001');
      expect(result).toBeNull();
    });

    it('returns null for an unknown code when pillars are loaded', () => {
      const store = getStore();
      store.pillars.set('001', makePillar('001'));

      const result = service.getByCode('999');
      expect(result).toBeNull();
    });

    it('returns the correct Pillar when the code exists', () => {
      const pillar = makePillar('042');
      const store = getStore();
      store.pillars.set('042', pillar);

      const result = service.getByCode('042');
      expect(result).toEqual(pillar);
    });
  });

  // -------------------------------------------------------------------------
  // getByCodeOrError
  // -------------------------------------------------------------------------
  describe('getByCodeOrError', () => {
    it('returns PILLAR_CODE_OUT_OF_RANGE for code "000"', () => {
      const result = service.getByCodeOrError('000');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('PILLAR_CODE_OUT_OF_RANGE');
        expect(result.error.details).toMatchObject({ submittedCode: '000' });
      }
    });

    it('returns PILLAR_CODE_OUT_OF_RANGE for code "208"', () => {
      const result = service.getByCodeOrError('208');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('PILLAR_CODE_OUT_OF_RANGE');
      }
    });

    it('returns PILLAR_CODE_OUT_OF_RANGE for code "999"', () => {
      const result = service.getByCodeOrError('999');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('PILLAR_CODE_OUT_OF_RANGE');
      }
    });

    it('returns PILLAR_NOT_FOUND for a valid in-range code not in the registry', () => {
      const result = service.getByCodeOrError('050');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('PILLAR_NOT_FOUND');
        expect(result.error.details).toMatchObject({ submittedCode: '050' });
      }
    });

    it('returns the pillar for a valid in-range code that exists', () => {
      const pillar = makePillar('050');
      const store = getStore();
      store.pillars.set('050', pillar);

      const result = service.getByCodeOrError('050');
      expect('pillar' in result).toBe(true);
      if ('pillar' in result) {
        expect(result.pillar).toEqual(pillar);
      }
    });

    it('error message identifies the submitted code', () => {
      const result = service.getByCodeOrError('208');
      if ('error' in result) {
        expect(result.error.message).toContain('208');
      }
    });
  });

  // -------------------------------------------------------------------------
  // search — no-results cases
  // -------------------------------------------------------------------------
  describe('search', () => {
    it('returns empty array for an empty query string', async () => {
      const results = await service.search('');
      expect(results).toEqual([]);
    });

    it('returns empty array for a whitespace-only query', async () => {
      const results = await service.search('   ');
      expect(results).toEqual([]);
    });

    it('returns empty array when the store has no pillars (data source unavailable)', async () => {
      // Store is empty after resetStore()
      const results = await service.search('capital');
      expect(results).toEqual([]);
    });

    it('returns empty array when no pillars match the query', async () => {
      const store = getStore();
      const pillars = [
        makePillar('001', 'Capital Supremacy'),
        makePillar('002', 'Revenue Extraction Mandate'),
      ];
      pillars.forEach((p) => store.pillars.set(p.code, p));
      // Rebuild the search index with these pillars
      (store as { pillarSearchIndex: Fuse<Pillar> }).pillarSearchIndex = new Fuse(pillars, {
        keys: [{ name: 'title', weight: 0.6 }, { name: 'body', weight: 0.3 }],
        includeScore: true,
        threshold: 0.4,
      });

      const results = await service.search('xyzzy_nonexistent_term_12345');
      expect(results).toEqual([]);
    });

    it('returns results ordered by ascending score (most relevant first)', async () => {
      const store = getStore();
      const pillars: Pillar[] = [
        { code: '001', cluster: 'Fiscal Weaponization', title: 'Capital Supremacy', body: 'Capital is a weapon.' },
        { code: '002', cluster: 'Fiscal Weaponization', title: 'Revenue Extraction', body: 'Extract revenue.' },
        { code: '003', cluster: 'Fiscal Weaponization', title: 'Compound Growth', body: 'Compound your capital.' },
      ];
      pillars.forEach((p) => store.pillars.set(p.code, p));
      (store as { pillarSearchIndex: Fuse<Pillar> }).pillarSearchIndex = new Fuse(pillars, {
        keys: [{ name: 'title', weight: 0.6 }, { name: 'body', weight: 0.3 }],
        includeScore: true,
        threshold: 0.4,
      });

      const results = await service.search('capital');
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeLessThanOrEqual(results[i + 1].score);
        }
      }
    });

    it('each result contains a pillar with all required fields', async () => {
      const store = getStore();
      const pillars: Pillar[] = [
        { code: '001', cluster: 'Fiscal Weaponization', title: 'Capital Supremacy', body: 'Capital is a weapon.' },
      ];
      pillars.forEach((p) => store.pillars.set(p.code, p));
      (store as { pillarSearchIndex: Fuse<Pillar> }).pillarSearchIndex = new Fuse(pillars, {
        keys: [{ name: 'title', weight: 0.6 }, { name: 'body', weight: 0.3 }],
        includeScore: true,
        threshold: 0.4,
      });

      const results = await service.search('capital');
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.pillar.code).toBeDefined();
        expect(r.pillar.cluster).toBeDefined();
        expect(r.pillar.title).toBeDefined();
        expect(r.pillar.body).toBeDefined();
        expect(typeof r.score).toBe('number');
      }
    });
  });

  // -------------------------------------------------------------------------
  // getAll
  // -------------------------------------------------------------------------
  describe('getAll', () => {
    it('returns empty array when store is empty', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns pillars sorted by code ascending', () => {
      const store = getStore();
      store.pillars.set('003', makePillar('003'));
      store.pillars.set('001', makePillar('001'));
      store.pillars.set('002', makePillar('002'));

      const all = service.getAll();
      expect(all.map((p) => p.code)).toEqual(['001', '002', '003']);
    });
  });
});
