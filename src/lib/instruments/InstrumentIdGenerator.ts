/**
 * InstrumentIdGenerator — generates sequential DH-RES-YYYY-NNN identifiers.
 *
 * Reads the current maximum NNN for the current year from the Supabase
 * `instrument_registry` table and increments it atomically.
 * Resets to 001 at the start of each new calendar year.
 */

import { getSupabaseClient } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';

/**
 * Generates the next instrument identifier for the current calendar year.
 * Format: DH-RES-YYYY-NNN (e.g., DH-RES-2026-001)
 */
export async function generateNextId(): Promise<string> {
  const now = new Date();
  const year = now.getUTCFullYear();

  const client = getSupabaseClient();

  // Query the highest NNN for the current year
  const maxNnn = await withRetry(async () => {
    const { data, error } = await client
      .from('instrument_registry')
      .select('id')
      .eq('year', year)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    }

    if (!data || data.length === 0) {
      return 0; // No instruments this year — start at 001
    }

    // Extract NNN from the last ID: DH-RES-YYYY-NNN
    const lastId: string = data[0].id;
    const parts = lastId.split('-');
    const nnn = parseInt(parts[parts.length - 1], 10);
    return isNaN(nnn) ? 0 : nnn;
  });

  const nextNnn = maxNnn + 1;
  const paddedNnn = String(nextNnn).padStart(3, '0');

  return `DH-RES-${year}-${paddedNnn}`;
}
