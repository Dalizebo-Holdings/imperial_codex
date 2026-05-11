/**
 * Unit tests for BackgroundAgentService.
 */

jest.mock('@/lib/store/InMemoryStore');
jest.mock('@/lib/db/supabase');
jest.mock('@/lib/db/retry', () => ({
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));
jest.mock('@/lib/loops/LoopEngine');
jest.mock('@/lib/strike/StrikeOutputEngine');

import { getStore } from '@/lib/store/InMemoryStore';
import { getSupabaseClient } from '@/lib/db/supabase';
import { trigger as triggerLoop } from '@/lib/loops/LoopEngine';
import { evaluateLoops, dispatchWebhookAlert } from '../BackgroundAgentService';
import type { RecursiveLoop } from '@/lib/loops/types';

const mockLoop: RecursiveLoop = {
  id: 'loop-001',
  name: 'Test Loop',
  condition: 'capital-threshold-exceeded',
  actionLabel: 'Activate Capital Protocol',
  referencedSlugs: ['TAX-OS'],
  enabled: true,
};

const mockStore = {
  loops: new Map([['loop-001', mockLoop]]),
  osModules: new Map(),
  pillars: new Map(),
  library: new Map(),
  pillarSearchIndex: null,
  librarySearchIndex: null,
  osModuleSearchIndex: null,
};

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockSelect = jest.fn();
const mockFrom = jest.fn();

describe('BackgroundAgentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStore as jest.Mock).mockReturnValue(mockStore);

    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });

    (getSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom });
    (triggerLoop as jest.Mock).mockResolvedValue(null);
  });

  describe('evaluateLoops', () => {
    it('returns a summary with correct counts when no loops trigger', async () => {
      // Make the loop condition fail by disabling it
      const disabledStore = {
        ...mockStore,
        loops: new Map([['loop-001', { ...mockLoop, enabled: false }]]),
      };
      (getStore as jest.Mock).mockReturnValue(disabledStore);

      const summary = await evaluateLoops(new Date());
      expect(summary.triggered).toBe(0);
      expect(summary.totalEvaluated).toBe(1);
    });

    it('triggers a loop and increments triggered count', async () => {
      const summary = await evaluateLoops(new Date());
      expect(triggerLoop).toHaveBeenCalledTimes(1);
      expect(summary.triggered).toBe(1);
    });

    it('skips a loop already triggered in the current 15-min window', async () => {
      // Mock existing trigger in window
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: 'existing-trigger' }],
                error: null,
              }),
            }),
          }),
        }),
      });

      const summary = await evaluateLoops(new Date());
      expect(triggerLoop).not.toHaveBeenCalled();
      expect(summary.skipped).toBe(1);
    });

    it('inserts a run-level summary row at the end of every execution', async () => {
      await evaluateLoops(new Date());
      // The last insert call should be the run summary
      const lastInsertCall = mockInsert.mock.calls[mockInsert.mock.calls.length - 1][0];
      expect(lastInsertCall.loop_id).toBe('__RUN_SUMMARY__');
      expect(lastInsertCall.outcome).toBe('run-summary');
    });
  });

  describe('dispatchWebhookAlert', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      delete process.env.WEBHOOK_ALERT_URL;
    });

    it('logs warning and returns when WEBHOOK_ALERT_URL is not set', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await dispatchWebhookAlert(mockLoop, new Date());
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WEBHOOK_ALERT_URL not set')
      );
      consoleSpy.mockRestore();
    });

    it('dispatches webhook with correct payload on success', async () => {
      process.env.WEBHOOK_ALERT_URL = 'https://hooks.example.com/alert';
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await dispatchWebhookAlert(mockLoop, new Date('2026-01-01T06:00:00Z'));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.example.com/alert',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.loopId).toBe('loop-001');
      expect(body.severity).toBe('critical');
    });

    it('logs failure when webhook returns non-2xx status', async () => {
      process.env.WEBHOOK_ALERT_URL = 'https://hooks.example.com/alert';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await dispatchWebhookAlert(mockLoop, new Date());
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WEBHOOK_DISPATCH_FAILED'),
        expect.objectContaining({ status: 500 })
      );
      consoleSpy.mockRestore();
    });
  });
});
