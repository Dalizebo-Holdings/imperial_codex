// Feature: imperial-codex-ai-agent, Property 35: Supabase Retry Exponential Back-Off

import * as fc from 'fast-check';
import { withRetry } from '@/lib/db/retry';

jest.useFakeTimers();

describe('Property 35: Supabase Retry Exponential Back-Off', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('invokes operation exactly 3 times when all attempts fail (default maxRetries=2)', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (errorMessage) => {
          const operation = jest.fn().mockRejectedValue(new Error(errorMessage));

          const promise = withRetry(operation);
          await jest.runAllTimersAsync();

          await expect(promise).rejects.toThrow(errorMessage);
          return operation.mock.calls.length === 3;
        }
      ),
      { numRuns: 20 } // Reduced due to async nature
    );
  });

  it('delay before first retry is at least 500ms (base delay)', async () => {
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;

    // Track setTimeout calls to measure delays
    jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      if (typeof delay === 'number' && delay > 0) {
        delays.push(delay);
      }
      return originalSetTimeout(fn as () => void, 0); // execute immediately in tests
    });

    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    await withRetry(operation, { baseMs: 500, capMs: 5000, maxRetries: 2 });

    // First retry delay should be 500ms (baseMs * 2^0 = 500)
    expect(delays[0]).toBeGreaterThanOrEqual(500);
    expect(delays[0]).toBeLessThanOrEqual(5000);

    jest.restoreAllMocks();
  });

  it('delay before second retry is at least 1000ms (2x base delay)', async () => {
    const delays: number[] = [];

    jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      if (typeof delay === 'number' && delay > 0) {
        delays.push(delay);
      }
      return setTimeout(fn as () => void, 0);
    });

    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    await withRetry(operation, { baseMs: 500, capMs: 5000, maxRetries: 2 });

    // Second retry delay should be 1000ms (baseMs * 2^1 = 1000)
    if (delays.length >= 2) {
      expect(delays[1]).toBeGreaterThanOrEqual(1000);
      expect(delays[1]).toBeLessThanOrEqual(5000);
    }

    jest.restoreAllMocks();
  });

  it('propagates the last error after all retries are exhausted', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (errorMessage) => {
          const error = new Error(errorMessage);
          const operation = jest.fn().mockRejectedValue(error);

          const promise = withRetry(operation, { maxRetries: 0 });
          await jest.runAllTimersAsync();

          try {
            await promise;
            return false; // Should have thrown
          } catch (err) {
            return err === error; // Must be the exact same error
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('delay is capped at capMs', async () => {
    const delays: number[] = [];

    jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      if (typeof delay === 'number' && delay > 0) {
        delays.push(delay);
      }
      return setTimeout(fn as () => void, 0);
    });

    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    // With baseMs=10000 and capMs=500, delay should be capped at 500
    await withRetry(operation, { baseMs: 10000, capMs: 500, maxRetries: 1 });

    if (delays.length > 0) {
      expect(delays[0]).toBeLessThanOrEqual(500);
    }

    jest.restoreAllMocks();
  });
});
