import { getIronSession } from 'iron-session';
import type { NextRequest } from 'next/server';
import type { SessionData } from '@/lib/security/types';

export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return Response.json({ ok: true });
  }
  const res = new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const session = await getIronSession<SessionData>(request, res, {
    cookieName: 'imperial-session',
    password: secret,
  });
  session.destroy();
  return res;
}
