import { getIronSession } from 'iron-session';
import type { NextRequest } from 'next/server';
import type { SessionData } from '@/lib/security/types';

export async function POST(request: NextRequest) {
  let body: { clearanceCode?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  const { clearanceCode, userId } = body;
  if (!clearanceCode || !userId) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'clearanceCode and userId are required' } },
      { status: 400 }
    );
  }

  // Admin clearance code: highest authority (level 2), checked first so a vault
  // failure never blocks an admin from authenticating.
  let clearanceLevel = 0;
  if (process.env.ADMIN_CLEARANCE_CODE && clearanceCode === process.env.ADMIN_CLEARANCE_CODE) {
    clearanceLevel = 2;
  } else {
    try {
      const { read } = await import('@/lib/security/VaultRepository');
      const vault = await read();
      const codes = vault.clearanceCodes as Record<string, number> | undefined;
      if (codes && typeof codes[clearanceCode] === 'number') {
        clearanceLevel = codes[clearanceCode];
      }
      // else: level 0 — basic authenticated access for any other non-empty code
    } catch {
      clearanceLevel = 0;
    }
  }

  const res = new Response(JSON.stringify({ ok: true, clearanceLevel }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return Response.json({ error: { code: 'CONFIG_ERROR', message: 'SESSION_SECRET not set' } }, { status: 500 });
  }

  const session = await getIronSession<SessionData>(request, res, {
    cookieName: 'imperial-session',
    password: secret,
    cookieOptions: { secure: process.env.NODE_ENV === 'production', maxAge: 86400, httpOnly: true, sameSite: 'lax' },
  });

  session.userId = userId;
  session.clearanceLevel = clearanceLevel;
  session.issuedAt = new Date().toISOString();
  session.isAuthenticated = true;
  await session.save();

  return res;
}
