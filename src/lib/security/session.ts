/**
 * Session management using iron-session.
 *
 * Cookie name: imperial-session
 * maxAge: 86400s (24 hours)
 * Secret: SESSION_SECRET env var
 */

import { getIronSession, type IronSession } from 'iron-session';
import type { SessionData } from './types';
import type { NextRequest } from 'next/server';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

const SESSION_COOKIE_NAME = 'imperial-session';
const SESSION_MAX_AGE = 86400; // 24 hours

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Returns the iron-session for the given request.
 * Works with both NextRequest and a headers-like object.
 */
export async function getSession(
  req: NextRequest | { headers: ReadonlyHeaders | Headers }
): Promise<IronSession<SessionData> | null> {
  try {
    const secret = getSessionSecret();

    // iron-session requires a Response object for cookie writing
    // For read-only access in server components, we use a dummy response
    const res = new Response();

    const session = await getIronSession<SessionData>(req as Request, res, {
      cookieName: SESSION_COOKIE_NAME,
      password: secret,
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
      },
    });

    return session;
  } catch {
    return null;
  }
}
