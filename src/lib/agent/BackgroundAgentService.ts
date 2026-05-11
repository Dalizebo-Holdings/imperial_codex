/**
 * BackgroundAgentService — autonomous loop evaluation and daily summary generation.
 *
 * Invoked by Vercel Cron via /api/agent/cron:
 * - Every 15 minutes: evaluateLoops()
 * - Daily at 06:00 UTC: generateDailySummary()
 *
 * Deduplication: loops already triggered within the current 15-minute UTC window
 * are skipped (window = floor(minutes/15)*15).
 *
 * Critical loops (loop.critical === true) trigger webhook alerts.
 */

import { getStore } from '@/lib/store/InMemoryStore';
import { getSupabaseClient } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import { trigger as triggerLoop } from '@/lib/loops/LoopEngine';
import { generate as generateStrike } from '@/lib/strike/StrikeOutputEngine';
import type { LoopEvaluationSummary, WebhookAlertPayload } from './types';
import type { RecursiveLoop } from '@/lib/loops/types';
import type { StructuredContext } from '@/lib/strike/types';

/**
 * Returns the UTC floor of the given date to the nearest 15-minute boundary.
 * e.g., 14:23 UTC → 14:15 UTC
 */
function get15MinWindowStart(date: Date): Date {
  const ms = date.getTime();
  const windowMs = 15 * 60 * 1000;
  return new Date(Math.floor(ms / windowMs) * windowMs);
}

/**
 * Evaluates all 104 Recursive Loops against current system state.
 * Deduplicates within the current 15-minute UTC window.
 * Inserts a run-level summary row at the end of every execution.
 */
export async function evaluateLoops(runAt: Date): Promise<LoopEvaluationSummary> {
  const store = getStore();
  const client = getSupabaseClient();
  const windowStart = get15MinWindowStart(runAt);
  const windowStartIso = windowStart.toISOString();

  let triggered = 0;
  let skipped = 0;
  let errors = 0;
  const totalEvaluated = store.loops.size;

  for (const [, loop] of store.loops) {
    if (!loop.enabled) continue;

    try {
      // Check if this loop was already triggered in the current 15-min window
      const { data: existing } = await client
        .from('loop_execution_log')
        .select('id')
        .eq('loop_id', loop.id)
        .gte('triggered_at', windowStartIso)
        .neq('triggered_by', 'background-agent-skipped')
        .limit(1);

      if (existing && existing.length > 0) {
        // Already triggered — log as skipped
        await client.from('loop_execution_log').insert({
          loop_id: loop.id,
          triggered_at: runAt.toISOString(),
          condition_matched: loop.condition,
          target_slug: loop.referencedSlugs[0] ?? null,
          output_action: null,
          outcome: 'skipped-duplicate',
          triggered_by: 'background-agent-skipped',
        });
        skipped++;
        continue;
      }

      // Evaluate the loop condition (simplified: check if condition is non-empty)
      const conditionMet = evaluateCondition(loop, store);
      if (!conditionMet) continue;

      // Trigger the loop
      await triggerLoop(
        {
          condition: loop.condition,
          targetSlug: loop.referencedSlugs[0],
          timestamp: runAt.toISOString(),
        },
        { triggeredBy: 'background-agent' }
      );

      triggered++;

      // Dispatch webhook alert for critical loops
      const criticalLoop = loop as RecursiveLoop & { critical?: boolean };
      if (criticalLoop.critical === true) {
        // Try Slack first, fall back to webhook
        const { sendCriticalLoopAlert } = await import('@/mcp/external/slack');
        await sendCriticalLoopAlert({
          loopId: loop.id,
          loopTitle: loop.name,
          triggeredAt: runAt.toISOString(),
          targetSlug: loop.referencedSlugs[0] ?? '',
          outputAction: loop.actionLabel,
        }).catch(() => {});

        await dispatchWebhookAlert(loop, runAt).catch((err) => {
          console.error('[BackgroundAgent] WEBHOOK_DISPATCH_FAILED:', { loopId: loop.id, err });
        });
      }
    } catch (err) {
      errors++;
      console.error(`[BackgroundAgent] Error evaluating loop ${loop.id}:`, err);
    }
  }

  // Insert run-level summary row
  const summary: LoopEvaluationSummary = {
    runAt: runAt.toISOString(),
    totalEvaluated,
    triggered,
    skipped,
    errors,
  };

  try {
    await withRetry(async () => {
      const { error } = await client.from('loop_execution_log').insert({
        loop_id: '__RUN_SUMMARY__',
        triggered_at: runAt.toISOString(),
        condition_matched: null,
        target_slug: null,
        output_action: JSON.stringify(summary),
        outcome: 'run-summary',
        triggered_by: 'background-agent',
      });
      if (error) throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    });
  } catch (err) {
    console.error('[BackgroundAgent] Failed to insert run summary:', err);
  }

  return summary;
}

/**
 * Generates a daily Strike Output summary at 06:00 UTC.
 * Assembles context from all 36 OS Modules, latest capital allocation,
 * and loops triggered in the preceding 24 hours.
 */
export async function generateDailySummary(runAt: Date): Promise<void> {
  const store = getStore();
  const client = getSupabaseClient();

  // Get loops triggered in the preceding 24 hours
  const since = new Date(runAt.getTime() - 24 * 60 * 60 * 1000);
  const { data: recentTriggers } = await client
    .from('loop_execution_log')
    .select('*')
    .gte('triggered_at', since.toISOString())
    .neq('triggered_by', 'background-agent-skipped')
    .neq('loop_id', '__RUN_SUMMARY__')
    .order('triggered_at', { ascending: false })
    .limit(20);

  // Get latest capital allocation
  const { data: latestAllocation } = await client
    .from('capital_allocations')
    .select('*')
    .order('approved_at', { ascending: false })
    .limit(1)
    .single();

  // Assemble all OS Modules
  const osModules = Array.from(store.osModules.values()).slice(0, 36);

  const context: StructuredContext = {
    intent: `Daily Strategic Summary — ${runAt.toISOString().split('T')[0]}. ` +
      `Summarise the state of all 36 OS Modules, recent loop activity, and capital allocation status.`,
    pillars: Array.from(store.pillars.values()).slice(0, 5),
    osModules,
    libraryEntries: Array.from(store.library.values()).slice(0, 3),
    latestAllocation: latestAllocation
      ? {
          allocation: {
            growthPercent: latestAllocation.growth_pct,
            operationalPercent: latestAllocation.operational_pct,
            reservePercent: latestAllocation.reserve_pct,
            osModuleSlug: latestAllocation.os_module_slug,
          },
          approvedAt: latestAllocation.approved_at,
          approvingUserId: latestAllocation.approved_by,
          osModuleSlug: latestAllocation.os_module_slug,
        }
      : null,
    recentLoopTriggers: recentTriggers ?? [],
  };

  // Generate Strike Output with background-agent provenance
  const output = await generateStrike({
    targetSlugs: osModules.slice(0, 5).map((m) => m.slug),
    directive: context.intent,
    userId: 'background-agent',
  });

  console.log(`[BackgroundAgent] Daily summary generated: ${output.id ?? 'no-id'}`);
}

/**
 * Dispatches a webhook alert for a critical loop trigger.
 * Logs and returns (never throws) on failure.
 */
export async function dispatchWebhookAlert(
  loop: RecursiveLoop,
  triggeredAt: Date
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_ALERT_URL;

  if (!webhookUrl) {
    console.warn('[BackgroundAgent] WEBHOOK_ALERT_URL not set — skipping webhook dispatch');
    return;
  }

  const payload: WebhookAlertPayload = {
    loopId: loop.id,
    loopTitle: loop.name,
    triggeredAt: triggeredAt.toISOString(),
    targetSlug: loop.referencedSlugs[0] ?? '',
    outputAction: loop.actionLabel,
    severity: 'critical',
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[BackgroundAgent] WEBHOOK_DISPATCH_FAILED:', {
      status: response.status,
      body,
      loopId: loop.id,
    });
  }
}

/**
 * Evaluates whether a loop's condition is currently met.
 * Simplified implementation — in production this would evaluate
 * the condition expression against real system state.
 */
function evaluateCondition(
  loop: RecursiveLoop,
  _store: ReturnType<typeof getStore>
): boolean {
  // For now, evaluate based on whether the loop has valid references
  return loop.enabled && loop.referencedSlugs.length > 0;
}
