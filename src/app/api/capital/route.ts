import { validate, record, recordFailure } from '@/lib/capital/CapitalAllocationService';
import { getSession } from '@/lib/security/session';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.isAuthenticated) {
    return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Valid session required' } }, { status: 401 });
  }

  let body: { growthPercent?: number; operationalPercent?: number; reservePercent?: number; osModuleSlug?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  const { growthPercent, operationalPercent, reservePercent, osModuleSlug } = body;
  if (growthPercent == null || operationalPercent == null || reservePercent == null || !osModuleSlug) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'growthPercent, operationalPercent, reservePercent, osModuleSlug required' } },
      { status: 400 }
    );
  }

  const allocation = { growthPercent, operationalPercent, reservePercent };
  const errors = validate(allocation);

  if (errors.length > 0) {
    await recordFailure(allocation, session.userId, errors).catch(() => {});
    return Response.json({ error: { code: 'CAPITAL_ALLOCATION_INVALID', message: 'Allocation violates 40/40/20 mandate', details: errors } }, { status: 400 });
  }

  const allocationRecord = await record(allocation, session.userId, osModuleSlug);
  return Response.json({ record: allocationRecord });
}
