/**
 * Next.js Middleware — runs on every request.
 *
 * 1. Reads imperial-session cookie via iron-session
 * 2. Unauthenticated → redirect to /login (pages) or 401 JSON (API)
 * 3. Sensitive route + clearance < 1 → 403 JSON
 * 4. Kernel halted + non-exempt route → 503 JSON
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/security/types';

const SESSION_COOKIE = 'imperial-session';

// Routes exempt from kernel-halted guard
const KERNEL_EXEMPT = ['/api/auth', '/api/status'];

// Routes requiring Level 1 clearance
const SENSITIVE_ROUTES = ['/api/capital', '/vault', '/api/strike'];

function isApiRoute(pathname: string) {
  return pathname.startsWith('/api/');
}

function isSensitiveRoute(pathname: string) {
  return SENSITIVE_ROUTES.some((r) => pathname.startsWith(r));
}

function isKernelExempt(pathname: string) {
  return KERNEL_EXEMPT.some((r) => pathname.startsWith(r));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session
  const res = NextResponse.next();
  let session: SessionData | null = null;
  try {
    const secret = process.env.SESSION_SECRET;
    if (secret) {
      const ironSession = await getIronSession<SessionData>(request, res, {
        cookieName: SESSION_COOKIE,
        password: secret,
      });
      if (ironSession.isAuthenticated) {
        session = ironSession;
      }
    }
  } catch {
    // session remains null
  }

  // Auth check
  if (!session) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Valid session required' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Clearance check for sensitive routes
  if (isSensitiveRoute(pathname) && session.clearanceLevel < 1) {
    return NextResponse.json(
      { error: { code: 'CLEARANCE_DENIED', message: 'Level 1 clearance required' } },
      { status: 403 }
    );
  }

  // Kernel-halted guard (dynamic import to avoid edge runtime issues)
  if (!isKernelExempt(pathname)) {
    try {
      const { getStore } = await import('@/lib/store/InMemoryStore');
      const store = getStore();
      if (store.kernel.status === 'halted') {
        return NextResponse.json(
          { error: { code: 'KERNEL_HALTED', message: 'Kernel is halted — system unavailable' } },
          { status: 503 }
        );
      }
    } catch {
      // If store not available, allow through
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};
