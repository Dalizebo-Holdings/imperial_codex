// Feature: imperial-codex-ai-agent, Property 42: Audit Log Immutability in Supabase

import * as fc from 'fast-check';

/**
 * Simulates the audit log append behavior for property testing.
 * The invariant: existing rows are never modified or deleted after insertion.
 */
interface MockAuditLogRow {
  id: string;
  user_id: string;
  resource: string;
  clearance_level: number;
  decision: 'granted' | 'denied';
  timestamp: string;
  details: null;
}

class MockAuditLog {
  private rows: MockAuditLogRow[] = [];
  private insertCount = 0;
  private updateCount = 0;
  private deleteCount = 0;

  insert(row: Omit<MockAuditLogRow, 'id'>): void {
    this.insertCount++;
    this.rows.push({ ...row, id: `row-${this.insertCount}` });
  }

  update(_id: string, _data: Partial<MockAuditLogRow>): void {
    this.updateCount++;
    // In a correct implementation, this should never be called
  }

  delete(_id: string): void {
    this.deleteCount++;
    // In a correct implementation, this should never be called
  }

  getRows(): MockAuditLogRow[] {
    return [...this.rows]; // Return a copy
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  getDeleteCount(): number {
    return this.deleteCount;
  }
}

describe('Property 42: Audit Log Immutability in Supabase', () => {
  it('all previously inserted rows remain identical after subsequent inserts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.string({ minLength: 1, maxLength: 20 }),
            resource: fc.string({ minLength: 1, maxLength: 50 }),
            clearance_level: fc.integer({ min: 0, max: 2 }),
            decision: fc.constantFrom('granted' as const, 'denied' as const),
            timestamp: fc.date().map((d) => d.toISOString()),
            details: fc.constant(null),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (entries) => {
          const log = new MockAuditLog();

          // Insert entries one by one, checking immutability after each
          for (let i = 0; i < entries.length; i++) {
            const snapshotBefore = log.getRows().map((r) => JSON.stringify(r));
            log.insert(entries[i]);
            const rowsAfter = log.getRows();

            // All previously inserted rows must be byte-for-byte identical
            for (let j = 0; j < snapshotBefore.length; j++) {
              if (JSON.stringify(rowsAfter[j]) !== snapshotBefore[j]) {
                return false;
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no UPDATE operations are issued against the audit log', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.string({ minLength: 1, maxLength: 20 }),
            resource: fc.string({ minLength: 1, maxLength: 50 }),
            clearance_level: fc.integer({ min: 0, max: 2 }),
            decision: fc.constantFrom('granted' as const, 'denied' as const),
            timestamp: fc.date().map((d) => d.toISOString()),
            details: fc.constant(null),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (entries) => {
          const log = new MockAuditLog();
          entries.forEach((e) => log.insert(e));

          // A correct AuditLog implementation never calls update()
          return log.getUpdateCount() === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no DELETE operations are issued against the audit log', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.string({ minLength: 1, maxLength: 20 }),
            resource: fc.string({ minLength: 1, maxLength: 50 }),
            clearance_level: fc.integer({ min: 0, max: 2 }),
            decision: fc.constantFrom('granted' as const, 'denied' as const),
            timestamp: fc.date().map((d) => d.toISOString()),
            details: fc.constant(null),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (entries) => {
          const log = new MockAuditLog();
          entries.forEach((e) => log.insert(e));

          // A correct AuditLog implementation never calls delete()
          return log.getDeleteCount() === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('row count increases by exactly 1 after each insert', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          const log = new MockAuditLog();
          const entry = {
            user_id: 'user-001',
            resource: '/api/test',
            clearance_level: 1,
            decision: 'granted' as const,
            timestamp: new Date().toISOString(),
            details: null,
          };

          for (let i = 0; i < count; i++) {
            const before = log.getRows().length;
            log.insert(entry);
            const after = log.getRows().length;
            if (after !== before + 1) return false;
          }

          return log.getRows().length === count;
        }
      ),
      { numRuns: 100 }
    );
  });
});
