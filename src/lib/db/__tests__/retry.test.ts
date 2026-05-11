/**
 * Unit tests for withRetry exponential back-off utility.
 */

import { withRetry } from '../retry';

// Use fake timers to control setTimeout delays
jest.useFakeTimers();

describe('withRetry', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('returns result immediately on first attempt success', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await withRetry(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds on second attempt', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(operation);
    // Advance past first retry delay (500ms)
    await jest.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('retries and succeeds on third attempt', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const promise = withRetry(operation);
    await jest.advanceTimersByTimeAsync(500); // first retry delay
    await jest.advanceTimersByTimeAsync(1000); // second retry delay
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('propagates error after all retries exhausted', async () => {
    const error = new Error('persistent failure');
    const operation = jest.fn().mockRejectedValue(error);

    const promise = withRetry(operation);
    await jest.advanceTimersByTimeAsync(500);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(promise).rejects.toThrow('persistent failure');
    expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not silently discard error — throws after max retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('db error'));

    const promise = withRetry(operation);
    await jest.advanceTimersByTimeAsync(6000); // advance past all delays

    await expect(promise).rejects.toThrow('db error');
  });

  it('respects custom maxRetries option', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(operation, { maxRetries: 0 });
    // No retries — should reject immediately
    await expect(promise).rejects.toThrow('fail');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('respects custom baseMs and capMs options', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const promise = withRetry(operation, { baseMs: 100, capMs: 200, maxRetries: 1 });
    await jest.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('caps delay at capMs', async () => {
    // With baseMs=1000, capMs=500: delay should be capped at 500ms
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const promise = withRetry(operation, { baseMs: 1000, capMs: 500, maxRetries: 1 });
    await jest.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result).toBe('ok');
  });
});
