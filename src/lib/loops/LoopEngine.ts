/**
 * LoopEngine — evaluates Recursive Loop trigger conditions and records executions.
 *
 * Execution records are persisted to the Supabase `loop_execution_log` table.
 * Each loop is evaluated in an isolated try/catch — errors in one loop do not
 * halt processing of subsequent loops.
 *
 * Timeout: 2000ms per loop evaluation.
 */

import { getStore } from '@/lib/store/InMemoryStore';
import { getSupabaseClient, SupabaseDegradedError } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import type { LoopTriggerEvent, LoopExecutionRecord, RecursiveLoop } from './types';

const LOOP_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error(`Operation timed out after ${ms}ms`), { code })),
        ms
      )
    ),
  ]);
}

/**
 * Evaluates all loops matching the trigger event condition and records executions.
 * Returns the first matching LoopExecutionRecord, or null if no loops matched.
 */
export async function trigger(
  event: LoopTriggerEvent,
  options?: { triggeredBy?: string }
): Promise<LoopExecutionRecord | null> {
  const store = getStore();
  const triggeredBy = options?.triggeredBy ?? 'user';

  let firstRecord: LoopExecutionRecord | null = null;

  for (const [, loop] of store.loops) {
    if (!loop.enabled) continue;

    // Check if this loop's condition matches the event
    if (!loop.condition.toLowerCase().includes(event.condition.toLowerCase())) {
      continue;
    }

    // Check for broken references
    const hasValidSlug = loop.referencedSlugs.some((slug) => store.osModules.has(slug));
    if (!hasValidSlug) {
      console.error(
        `[LoopEngine] LOOP_BROKEN_REFERENCE: Loop ${loop.id} references no registered slugs. Skipping.`
      );
      await persistExecutionRecord({
        loop,
        event,
        outcome: 'LOOP_BROKEN_REFERENCE',
        triggeredBy,
      });
      continue;
    }

    try {
      const record = await withTimeout(
        evaluateLoop(loop, event),
        LOOP_TIMEOUT_MS,
        'LOOP_TIMEOUT'
      );

      await persistExecutionRecord({ loop, event, outcome: 'success', triggeredBy, record });

      if (!firstRecord) firstRecord = record;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string }).code
          : 'LOOP_FATAL_ERROR';

      console.error(`[LoopEngine] ${code}: Loop ${loop.id} failed:`, err);
      await persistExecutionRecord({ loop, event, outcome: code, triggeredBy });
    }
  }

  return firstRecord;
}

async function evaluateLoop(
  loop: RecursiveLoop,
  event: LoopTriggerEvent
): Promise<LoopExecutionRecord> {
  // Determine target slug — prefer event.targetSlug, fall back to first referenced slug
  const targetSlug = event.targetSlug ?? loop.referencedSlugs[0] ?? '';

  return {
    loopId: loop.id,
    triggerTimestamp: event.timestamp,
    matchedCondition: event.condition,
    targetSlug,
    outputActionLabel: loop.actionLabel,
  };
}

async function persistExecutionRecord(params: {
  loop: RecursiveLoop;
  event: LoopTriggerEvent;
  outcome: string;
  triggeredBy: string;
  record?: LoopExecutionRecord;
}): Promise<void> {
  const { loop, event, outcome, triggeredBy, record } = params;

  let client;
  try {
    client = getSupabaseClient();
  } catch (err) {
    if (err instanceof SupabaseDegradedError) {
      console.error('[LoopEngine] Supabase unavailable — execution record not persisted');
      return;
    }
    throw err;
  }

  try {
    await withRetry(async () => {
      const { error } = await client.from('loop_execution_log').insert({
        loop_id: loop.id,
        triggered_at: event.timestamp,
        condition_matched: record?.matchedCondition ?? event.condition,
        target_slug: record?.targetSlug ?? event.targetSlug ?? null,
        output_action: record?.outputActionLabel ?? null,
        outcome,
        triggered_by: triggeredBy,
      });

      if (error) {
        throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
      }
    });
  } catch (err) {
    // Log but do not propagate — execution log failure must not halt loop processing
    console.error('[LoopEngine] Failed to persist execution record:', err);
  }
}
