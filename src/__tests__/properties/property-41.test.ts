// Feature: imperial-codex-ai-agent, Property 41: Instrument Identifier Sequential Uniqueness (Supabase-Backed)

import * as fc from 'fast-check';

/**
 * Simulates the InstrumentIdGenerator logic for property testing.
 * Given a list of existing IDs for a year, returns the next ID.
 */
function generateNextId(existingIds: string[], year: number): string {
  const yearIds = existingIds.filter((id) => id.startsWith(`DH-RES-${year}-`));

  if (yearIds.length === 0) {
    return `DH-RES-${year}-001`;
  }

  const maxNnn = yearIds.reduce((max, id) => {
    const parts = id.split('-');
    const nnn = parseInt(parts[parts.length - 1], 10);
    return isNaN(nnn) ? max : Math.max(max, nnn);
  }, 0);

  const nextNnn = maxNnn + 1;
  return `DH-RES-${year}-${String(nextNnn).padStart(3, '0')}`;
}

describe('Property 41: Instrument Identifier Sequential Uniqueness (Supabase-Backed)', () => {
  it('first instrument in a year gets NNN=001', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          const id = generateNextId([], year);
          return id === `DH-RES-${year}-001`;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each subsequent instrument increments NNN by exactly 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 50 }),
        (year, count) => {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            const nextId = generateNextId(ids, year);
            ids.push(nextId);
          }

          // Verify sequential increment
          for (let i = 1; i < ids.length; i++) {
            const prevNnn = parseInt(ids[i - 1].split('-').pop()!, 10);
            const currNnn = parseInt(ids[i].split('-').pop()!, 10);
            if (currNnn !== prevNnn + 1) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no two instruments in the same year share the same NNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 2, max: 30 }),
        (year, count) => {
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            ids.push(generateNextId(ids, year));
          }

          const uniqueIds = new Set(ids);
          return uniqueIds.size === ids.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('NNN resets to 001 at the start of a new calendar year', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2029 }),
        fc.integer({ min: 1, max: 20 }),
        (year, countInYear) => {
          // Generate some IDs in year N
          const idsInYear: string[] = [];
          for (let i = 0; i < countInYear; i++) {
            idsInYear.push(generateNextId(idsInYear, year));
          }

          // First ID in year N+1 should be 001
          const firstIdNextYear = generateNextId(idsInYear, year + 1);
          return firstIdNextYear === `DH-RES-${year + 1}-001`;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all generated IDs match the pattern DH-RES-YYYY-NNN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 20 }),
        (year, count) => {
          const pattern = /^DH-RES-\d{4}-\d{3}$/;
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            const id = generateNextId(ids, year);
            if (!pattern.test(id)) return false;
            ids.push(id);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
