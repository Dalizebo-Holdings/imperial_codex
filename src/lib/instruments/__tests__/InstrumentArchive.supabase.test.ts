/**
 * Integration tests for InstrumentArchive Supabase persistence.
 */

jest.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: jest.fn(),
  SupabaseDegradedError: class extends Error {
    code = 'DB_INSERT_FAILED';
  },
}));

jest.mock('@/lib/db/retry', () => ({
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

import { getSupabaseClient } from '@/lib/db/supabase';
import { save, getByYear } from '../InstrumentArchive';
import type { StrikeOutput } from '@/lib/strike/types';

const mockInstrumentsInsert = jest.fn();
const mockRegistryInsert = jest.fn();
const mockRegistrySelect = jest.fn();
const mockInstrumentsDelete = jest.fn();

const mockFrom = jest.fn((table: string) => {
  if (table === 'instruments') {
    return {
      insert: mockInstrumentsInsert,
      delete: jest.fn(() => ({ eq: mockInstrumentsDelete })),
    };
  }
  if (table === 'instrument_registry') {
    return {
      insert: mockRegistryInsert,
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    };
  }
  return {};
});

const mockClient = { from: mockFrom };

const mockInstrument: StrikeOutput = {
  title: 'Test Instrument',
  sections: [
    { label: 'Executive Analysis', content: 'Analysis content here with enough text.' },
    { label: 'OS Stress Test', content: 'Stress test content.' },
    { label: 'The Imperial Instrument', content: 'Instrument content.' },
    { label: 'Action Plan (T-Minus 24 Hours)', content: 'Action plan content.' },
    { label: 'The Ritual', content: 'Ritual content.' },
  ] as StrikeOutput['sections'],
  generatedAt: '2026-01-01T06:00:00.000Z',
  requestedBy: 'user-001',
  generatedBy: 'claude-engine',
};

describe('InstrumentArchive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
    mockInstrumentsInsert.mockResolvedValue({ error: null });
    mockRegistryInsert.mockResolvedValue({ error: null });
  });

  describe('save', () => {
    it('inserts into both instruments and instrument_registry tables', async () => {
      const id = await save(mockInstrument);

      expect(id).toMatch(/^DH-RES-\d{4}-\d{3}$/);
      expect(mockInstrumentsInsert).toHaveBeenCalledTimes(1);
      expect(mockRegistryInsert).toHaveBeenCalledTimes(1);

      const instrCall = mockInstrumentsInsert.mock.calls[0][0];
      expect(instrCall.id).toBe(id);
      expect(instrCall.generated_by).toBe('claude-engine');
      expect(instrCall.status).toBe('active');
    });

    it('rolls back instruments insert if registry insert fails', async () => {
      mockRegistryInsert.mockResolvedValue({ error: { message: 'registry insert failed' } });

      await expect(save(mockInstrument)).rejects.toMatchObject({
        code: 'INSTRUMENT_PERSIST_FAILED',
      });
    });

    it('throws INSTRUMENT_PERSIST_FAILED if instruments insert fails', async () => {
      mockInstrumentsInsert.mockResolvedValue({ error: { message: 'instruments insert failed' } });

      await expect(save(mockInstrument)).rejects.toMatchObject({
        code: 'INSTRUMENT_PERSIST_FAILED',
      });
    });
  });

  describe('getByYear', () => {
    it('returns instruments ordered by id ascending', async () => {
      const mockRows = [
        { id: 'DH-RES-2026-001', title: 'First', issuing_authority: 'DH', generated_at: '2026-01-01T00:00:00Z', status: 'active', year: 2026 },
        { id: 'DH-RES-2026-002', title: 'Second', issuing_authority: 'DH', generated_at: '2026-01-02T00:00:00Z', status: 'active', year: 2026 },
      ];

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockRows, error: null })),
          })),
        })),
      }));

      const results = await getByYear(2026);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('DH-RES-2026-001');
      expect(results[1].id).toBe('DH-RES-2026-002');
    });
  });
});
