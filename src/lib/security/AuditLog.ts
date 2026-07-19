/**
 * AuditLog — append-only audit log backed by Supabase.
 *
 * Replaces the filesystem-based /vault/AUDIT_LOG.jsonl implementation.
 * All entries are inserted into the `audit_log` Supabase table via withRetry.
 * No UPDATE or DELETE operations are ever issued against this table.
 */

import { getSupabaseClient, SupabaseDegradedError } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import type { AuditLogEntry } from './types';

const sanitize = (s: unknown) => String(s).replace(/[\r\n]/g, '');

/**
 * Appends an audit log entry to the Supabase `audit_log` table.
 * Retries up to 2 times with exponential back-off on failure.
 * Throws with code DB_INSERT_FAILED if all retries are exhausted.
 */
export async function append(entry: AuditLogEntry): Promise<void> {
  let client;
  try {
    client = getSupabaseClient();
  } catch (err) {
    if (err instanceof SupabaseDegradedError) {
      // Log locally but do not throw — audit log failure must not block the gate
      console.error(`[AuditLog] Supabase unavailable — entry not persisted: userId=${sanitize(entry.userId)} resource=${sanitize(entry.resource)}`);
      return;
    }
    throw err;
  }

  await withRetry(async () => {
    const { error } = await client.from('audit_log').insert({
      user_id: entry.userId,
      resource: entry.resource,
      clearance_level: entry.clearanceLevel,
      decision: entry.decision,
      timestamp: entry.timestamp,
      details: null,
    });

    if (error) {
      throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    }
  });
}
