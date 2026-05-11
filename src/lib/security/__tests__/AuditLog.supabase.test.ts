/**
 * Integration tests for AuditLog Supabase persistence.
 * Uses a mocked Supabase client.
 */

import { append } from '../AuditLog';
import type { AuditLogEntry } from '../types';

// Mock the Supabase module
jest.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: jest.fn(),
  SupabaseDegradedError: class SupabaseDegradedError extends Error {
    code = 'DB_INSERT_FAILED';
    constructor(msg: string) {
      super(msg);
      this.name = 'SupabaseDegradedError';
    }
  },
}));

// Mock withRetry to execute immediately (no delays in tests)
jest.mock('@/lib/db/retry', () => ({
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

import { getSupabaseClient } from '@/lib/db/supabase';

const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

const mockClient = { from: mockFrom };

describe('AuditLog.append', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
    mockInsert.mockResolvedValue({ error: null });
  });

  const entry: AuditLogEntry = {
    userId: 'user-001',
    resource: '/api/strike',
    clearanceLevel: 1,
    decision: 'granted',
    timestamp: '2026-01-01T06:00:00.000Z',
  };

  it('inserts a row into audit_log table', async () => {
    await append(entry);

    expect(mockFrom).toHaveBeenCalledWith('audit_log');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-001',
      resource: '/api/strike',
      clearance_level: 1,
      decision: 'granted',
      timestamp: '2026-01-01T06:00:00.000Z',
      details: null,
    });
  });

  it('does not modify previously inserted rows after subsequent inserts', async () => {
    const insertedRows: unknown[] = [];
    mockInsert.mockImplementation((row: unknown) => {
      insertedRows.push(JSON.parse(JSON.stringify(row))); // deep copy
      return Promise.resolve({ error: null });
    });

    const entry2: AuditLogEntry = {
      userId: 'user-002',
      resource: '/api/capital',
      clearanceLevel: 0,
      decision: 'denied',
      timestamp: '2026-01-01T07:00:00.000Z',
    };

    await append(entry);
    const snapshotAfterFirst = JSON.parse(JSON.stringify(insertedRows));

    await append(entry2);

    // First row must be byte-for-byte identical after second insert
    expect(insertedRows[0]).toEqual(snapshotAfterFirst[0]);
  });

  it('does not throw when Supabase is in degraded state', async () => {
    const { SupabaseDegradedError } = jest.requireMock('@/lib/db/supabase');
    (getSupabaseClient as jest.Mock).mockImplementation(() => {
      throw new SupabaseDegradedError('unavailable');
    });

    // Should not throw — audit log failure must not block the gate
    await expect(append(entry)).resolves.toBeUndefined();
  });

  it('throws DB_INSERT_FAILED when Supabase insert returns an error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'connection refused' } });

    await expect(append(entry)).rejects.toMatchObject({ code: 'DB_INSERT_FAILED' });
  });
});
