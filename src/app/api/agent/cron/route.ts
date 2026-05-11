/**
 * POST /api/agent/cron
 *
 * Vercel Cron-triggered background agent route.
 * Schedules:
 *   - Every 15 minutes: evaluateLoops()
 *   - Daily at 06:00 UTC: generateDailySummary()
 *
 * Authorization: Bearer {CRON_SECRET} header required.
 * Returns 401 CRON_UNAUTHORIZED if header is absent, malformed, or wrong token.
 */

import { evaluateLoops, generateDailySummary } from '@/lib/agent/BackgroundAgentService';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Step 1: Verify CRON_SECRET before any other logic
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('Authorization');
  const expected = cronSecret ? `Bearer ${cronSecret}` : null;

  if (!authHeader || !expected || authHeader !== expected) {
    return Response.json(
      {
        error: {
          code: 'CRON_UNAUTHORIZED',
          message: 'Invalid or missing Authorization header',
        },
      },
      { status: 401 }
    );
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  try {
    // Daily summary at 06:00 UTC
    if (utcHour === 6 && utcMinute < 15) {
      await generateDailySummary(now);
      return Response.json({
        type: 'daily-summary',
        runAt: now.toISOString(),
        status: 'completed',
      });
    }

    // Loop evaluation every 15 minutes
    const summary = await evaluateLoops(now);
    return Response.json({
      type: 'loop-evaluation',
      runAt: now.toISOString(),
      status: 'completed',
      summary,
    });
  } catch (err) {
    console.error('[CronRoute] Execution failed:', err);
    return Response.json(
      {
        error: {
          code: 'LOOP_FATAL_ERROR',
          message: err instanceof Error ? err.message : 'Cron execution failed',
        },
      },
      { status: 500 }
    );
  }
}
