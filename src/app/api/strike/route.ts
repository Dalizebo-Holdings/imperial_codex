import { generate } from '@/lib/strike/StrikeOutputEngine';
import { getSession } from '@/lib/security/session';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.isAuthenticated || session.clearanceLevel < 1) {
    return Response.json(
      { error: { code: 'CLEARANCE_DENIED', message: 'Level 1 clearance required' } },
      { status: 403 }
    );
  }

  let body: { targetSlugs?: string[]; directive?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  if (!body.targetSlugs?.length) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'targetSlugs is required' } },
      { status: 400 }
    );
  }

  const output = await generate({
    targetSlugs: body.targetSlugs,
    directive: body.directive,
    userId: session.userId,
  });

  return Response.json({ output });
}
