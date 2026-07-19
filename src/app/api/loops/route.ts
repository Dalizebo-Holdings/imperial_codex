import { getStore } from '@/lib/store/InMemoryStore';
import { trigger } from '@/lib/loops/LoopEngine';
import type { NextRequest } from 'next/server';

export async function GET() {
  const loops = [...getStore().loops.values()];
  return Response.json({ loops });
}

export async function POST(request: NextRequest) {
  let body: { condition?: string; targetSlug?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  if (!body.condition) {
    return Response.json({ error: { code: 'INVALID_REQUEST', message: 'condition is required' } }, { status: 400 });
  }

  try {
    const record = await trigger({
      condition: body.condition,
      targetSlug: body.targetSlug,
      timestamp: new Date().toISOString(),
    });
    return Response.json({ record });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    return Response.json({ error: e }, { status: 500 });
  }
}
