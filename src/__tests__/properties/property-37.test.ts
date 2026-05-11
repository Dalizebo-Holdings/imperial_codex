// Feature: imperial-codex-ai-agent, Property 37: Background Agent Loop Deduplication

import * as fc from 'fast-check';

/**
 * Returns the UTC floor of a date to the nearest 15-minute boundary.
 * This is the same logic used in BackgroundAgentService.
 */
function get15MinWindowStart(date: Date): Date {
  const ms = date.getTime();
  const windowMs = 15 * 60 * 1000;
  return new Date(Math.floor(ms / windowMs) * windowMs);
}

/**
 * Determines if a trigger timestamp falls within the same 15-min window as runAt.
 */
function isInSameWindow(triggerTime: Date, runAt: Date): boolean {
  const triggerWindow = get15MinWindowStart(triggerTime);
  const runWindow = get15MinWindowStart(runAt);
  return triggerWindow.getTime() === runWindow.getTime();
}

describe('Property 37: Background Agent Loop Deduplication', () => {
  it('deduplication window is based on UTC floor to nearest 15 minutes', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }),
        (date) => {
          const windowStart = get15MinWindowStart(date);
          const minutes = windowStart.getUTCMinutes();
          // Window start minutes must be 0, 15, 30, or 45
          return [0, 15, 30, 45].includes(minutes);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('two timestamps in the same 15-min window produce the same window start', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }),
        (date) => {
          const windowStart = get15MinWindowStart(date);
          // Any time within the same window should map to the same start
          const offsetMs = Math.floor(Math.random() * 14 * 60 * 1000); // 0-14 min offset
          const sameWindowDate = new Date(windowStart.getTime() + offsetMs);
          return get15MinWindowStart(sameWindowDate).getTime() === windowStart.getTime();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('timestamps in different 15-min windows produce different window starts', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }),
        (date) => {
          const windowStart = get15MinWindowStart(date);
          // A timestamp 15+ minutes later must be in a different window
          const nextWindowDate = new Date(windowStart.getTime() + 15 * 60 * 1000);
          return get15MinWindowStart(nextWindowDate).getTime() !== windowStart.getTime();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('a loop triggered in the current window is detected as duplicate', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (runAt, loopId) => {
          const windowStart = get15MinWindowStart(runAt);
          // A trigger at the window start is in the same window
          const triggerInWindow = new Date(windowStart.getTime() + 5 * 60 * 1000); // 5 min into window
          return isInSameWindow(triggerInWindow, runAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a loop triggered before the current window is not detected as duplicate', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01T01:00:00Z'), max: new Date('2026-12-31') }),
        (runAt) => {
          const windowStart = get15MinWindowStart(runAt);
          // A trigger 15+ minutes before the window start is in a previous window
          const triggerBeforeWindow = new Date(windowStart.getTime() - 15 * 60 * 1000);
          return !isInSameWindow(triggerBeforeWindow, runAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
