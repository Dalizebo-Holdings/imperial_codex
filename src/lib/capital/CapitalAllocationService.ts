/**
 * CapitalAllocationService — validates and records capital allocation decisions.
 *
 * Mandate: 40% growth, 40% operational, 20% reserve.
 * Tolerance: ±0.005 percentage points per category.
 *
 * Approved allocations → Supabase `capital_allocations` table.
 * Failed allocations   → Supabase `capital_allocation_failures` table.
 */

import { getSupabaseClient, SupabaseDegradedError } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import type {
  CapitalAllocation,
  AllocationValidationError,
  AllocationRecord,
} from './types';

const MANDATE = {
  growth: 40,
  operational: 40,
  reserve: 20,
} as const;

const TOLERANCE = 0.005;

/**
 * Validates a capital allocation against the 40/40/20 mandate.
 * Returns an empty array if the allocation is valid.
 */
export function validate(allocation: CapitalAllocation): AllocationValidationError[] {
  const errors: AllocationValidationError[] = [];

  const checks: Array<{
    category: AllocationValidationError['category'];
    submitted: number;
    target: number;
  }> = [
    { category: 'growth', submitted: allocation.growthPercent, target: MANDATE.growth },
    { category: 'operational', submitted: allocation.operationalPercent, target: MANDATE.operational },
    { category: 'reserve', submitted: allocation.reservePercent, target: MANDATE.reserve },
  ];

  for (const { category, submitted, target } of checks) {
    const deviation = Math.abs(submitted - target);
    if (deviation > TOLERANCE) {
      errors.push({
        category,
        submittedValue: submitted,
        deviationPoints: deviation,
        targetValue: target,
      });
    }
  }

  return errors;
}

/**
 * Records an approved capital allocation to Supabase.
 * Throws if validation fails — call validate() first.
 */
export async function record(
  allocation: CapitalAllocation,
  userId: string,
  slug: string
): Promise<AllocationRecord> {
  const approvedAt = new Date().toISOString();

  let client;
  try {
    client = getSupabaseClient();
  } catch (err) {
    if (err instanceof SupabaseDegradedError) {
      throw Object.assign(new Error('Supabase unavailable'), { code: 'DB_INSERT_FAILED' });
    }
    throw err;
  }

  await withRetry(async () => {
    const { error } = await client.from('capital_allocations').insert({
      growth_pct: allocation.growthPercent,
      operational_pct: allocation.operationalPercent,
      reserve_pct: allocation.reservePercent,
      approved_by: userId,
      os_module_slug: slug,
      approved_at: approvedAt,
    });

    if (error) {
      throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    }
  });

  return {
    allocation,
    approvedAt,
    approvingUserId: userId,
    osModuleSlug: slug,
  };
}

/**
 * Records a failed capital allocation attempt to Supabase.
 */
export async function recordFailure(
  allocation: CapitalAllocation,
  userId: string,
  errors: AllocationValidationError[]
): Promise<void> {
  let client;
  try {
    client = getSupabaseClient();
  } catch (err) {
    if (err instanceof SupabaseDegradedError) {
      console.error('[CapitalAllocationService] Supabase unavailable — failure not recorded');
      return;
    }
    throw err;
  }

  await withRetry(async () => {
    const { error } = await client.from('capital_allocation_failures').insert({
      submitted_by: userId,
      submitted_at: new Date().toISOString(),
      payload: allocation as unknown as Record<string, unknown>,
      validation_errors: errors as unknown as Record<string, unknown>,
    });

    if (error) {
      throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    }
  });
}
