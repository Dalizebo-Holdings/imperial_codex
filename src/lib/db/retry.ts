/**
 * Generic exponential back-off retry utility for Supabase operations.
 *
 * Defaults: baseMs=500, capMs=5000, maxRetries=2 (3 total attempts)
 * Delay formula: min(baseMs * 2^attempt, capMs)
 *   Attempt 0 (first retry):  min(500 * 1, 5000) = 500ms
 *   Attempt 1 (second retry): min(500 * 2, 5000) = 1000ms
 */

export interface RetryOptions {
  /** Base delay in milliseconds. Default: 500 */
  baseMs?: number;
  /** Maximum delay cap in milliseconds. Default: 5000 */
  capMs?: number;
  /** Maximum number of retries after the initial attempt. Default: 2 */
  maxRetries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes `operation` and retries up to `maxRetries` times on failure,
 * using exponential back-off with a cap.
 *
 * Propagates the last error if all attempts fail.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const baseMs = options?.baseMs ?? 500;
  const capMs = options?.capMs ?? 5000;
  const maxRetries = options?.maxRetries ?? 2;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        // Delay before next retry: min(baseMs * 2^attempt, capMs)
        const delayMs = Math.min(baseMs * Math.pow(2, attempt), capMs);
        await sleep(delayMs);
      }
    }
  }

  // All attempts exhausted — propagate the last error
  throw lastError;
}
