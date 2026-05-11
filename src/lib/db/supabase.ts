/**
 * Supabase singleton clients for Imperial Codex.
 *
 * - supabaseClient: uses SUPABASE_ANON_KEY — standard operations
 * - supabaseServiceClient: uses SUPABASE_SERVICE_ROLE_KEY — bypasses RLS (vault, cron agent)
 *
 * Call init() once during application startup (instrumentation.ts).
 * If required env vars are missing, the repository enters a degraded state
 * where all write operations return DB_INSERT_FAILED immediately.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseClient: SupabaseClient | null = null;
let _supabaseServiceClient: SupabaseClient | null = null;
let _degraded = false;

/**
 * Validates environment variables and creates both Supabase client instances.
 * Must be called once during application startup before any DB operations.
 */
export function init(): void {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    const missing = [
      !url && 'SUPABASE_URL',
      !anonKey && 'SUPABASE_ANON_KEY',
      !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ]
      .filter(Boolean)
      .join(', ');

    console.warn(
      `[SupabaseRepository] SUPABASE_CONFIG_MISSING: Required env vars absent: ${missing}. ` +
        'All Supabase write operations will return DB_INSERT_FAILED. ' +
        'Read operations from the in-memory store are unaffected.'
    );
    _degraded = true;
    return;
  }

  _supabaseClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  _supabaseServiceClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  _degraded = false;
}

/**
 * Returns the anon-key Supabase client.
 * Throws if init() has not been called or env vars were missing.
 */
export function getSupabaseClient(): SupabaseClient {
  if (_degraded || !_supabaseClient) {
    throw new SupabaseDegradedError(
      'Supabase client unavailable — SUPABASE_CONFIG_MISSING at startup.'
    );
  }
  return _supabaseClient;
}

/**
 * Returns the service-role Supabase client (bypasses RLS).
 * Throws if init() has not been called or env vars were missing.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (_degraded || !_supabaseServiceClient) {
    throw new SupabaseDegradedError(
      'Supabase service client unavailable — SUPABASE_CONFIG_MISSING at startup.'
    );
  }
  return _supabaseServiceClient;
}

/**
 * Returns true if the repository is in degraded state (missing env vars).
 */
export function isDegraded(): boolean {
  return _degraded;
}

export class SupabaseDegradedError extends Error {
  readonly code = 'DB_INSERT_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDegradedError';
  }
}

// Named exports for convenience
export { _supabaseClient as supabaseClient, _supabaseServiceClient as supabaseServiceClient };
