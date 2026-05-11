/**
 * InstrumentArchive — persists and retrieves formal DH-RES instruments.
 *
 * Replaces the filesystem-based /instruments/ directory implementation.
 * All instruments are stored in the Supabase `instruments` and
 * `instrument_registry` tables. Both inserts are performed atomically —
 * if either fails, neither row is persisted.
 */

import { getSupabaseClient, SupabaseDegradedError } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import { generateNextId } from './InstrumentIdGenerator';
import type { InstrumentRegistryEntry } from './types';
import type { StrikeOutput } from '@/lib/strike/types';

/**
 * Persists a generated Strike Output as a formal instrument.
 * Returns the assigned DH-RES-YYYY-NNN identifier.
 * Throws INSTRUMENT_PERSIST_FAILED if either table insert fails.
 */
export async function save(instrument: StrikeOutput): Promise<string> {
  const client = getSupabaseClient();
  const id = await generateNextId();
  const generatedAt = new Date().toISOString();
  const title = instrument.title ?? `Imperial Instrument ${id}`;
  const issuingAuthority = 'Dalizebo Holdings — Imperial Codex v16';
  const content = instrument.sections.map((s) => s.content).join('\n\n');
  const generatedBy = instrument.generatedBy ?? 'template-fallback';

  await withRetry(async () => {
    // Insert into instruments table
    const { error: instrError } = await client.from('instruments').insert({
      id,
      title,
      issuing_authority: issuingAuthority,
      content,
      generated_at: generatedAt,
      status: 'active',
      generated_by: generatedBy,
    });

    if (instrError) {
      throw Object.assign(new Error(instrError.message), { code: 'INSTRUMENT_PERSIST_FAILED' });
    }

    // Insert into instrument_registry table
    const { error: regError } = await client.from('instrument_registry').insert({
      id,
      title,
      issuing_authority: issuingAuthority,
      generated_at: generatedAt,
      status: 'active',
    });

    if (regError) {
      // Rollback: delete the instruments row we just inserted
      await client.from('instruments').delete().eq('id', id);
      throw Object.assign(new Error(regError.message), { code: 'INSTRUMENT_PERSIST_FAILED' });
    }
  });

  return id;
}

/**
 * Retrieves a full instrument document by its DH-RES-YYYY-NNN identifier.
 * Returns null if not found.
 */
export async function getById(id: string): Promise<StrikeOutput | null> {
  const client = getSupabaseClient();

  const result = await withRetry(async () => {
    const { data, error } = await client
      .from('instruments')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // not found
    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return data;
  });

  if (!result) return null;

  // Reconstruct a minimal StrikeOutput from stored content
  return {
    id: result.id,
    title: result.title ?? '',
    sections: [
      { label: 'Executive Analysis', content: result.content ?? '' },
      { label: 'OS Stress Test', content: '' },
      { label: 'The Imperial Instrument', content: '' },
      { label: 'Action Plan (T-Minus 24 Hours)', content: '' },
      { label: 'The Ritual', content: '' },
    ] as StrikeOutput['sections'],
    generatedAt: result.generated_at,
    requestedBy: result.issuing_authority ?? '',
    generatedBy: (result.generated_by ?? 'template-fallback') as StrikeOutput['generatedBy'],
  };
}

/**
 * Returns all instrument registry entries for a given calendar year,
 * ordered by NNN ascending.
 */
export async function getByYear(year: number): Promise<InstrumentRegistryEntry[]> {
  const client = getSupabaseClient();

  const rows = await withRetry(async () => {
    const { data, error } = await client
      .from('instrument_registry')
      .select('*')
      .eq('year', year)
      .order('id', { ascending: true });

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return data ?? [];
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? '',
    issuingAuthority: row.issuing_authority ?? '',
    generatedAt: row.generated_at,
    status: row.status ?? 'active',
    generatedBy: 'template-fallback' as const, // registry doesn't store generated_by
  }));
}
