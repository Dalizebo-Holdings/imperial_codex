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
const KERNEL_EXEMPT = ['/api/auth', '/api/status'];
const SENSITIVE_ROUTES = ['/api/capital', '/api/strike', '/vault'];

function isApiRoute(p: string) { return p.startsWith('/api/'); }
function isSensitive(p: string) { return SENSITIVE_ROUTES.some((r) => p.startsWith(r)); }
function isKernelExempt(p: string) { return KERNEL_EXEMPT.some((r) => p.startsWith(r)); }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  let session: SessionData | null = null;
  try {
    const secret = process.env.SESSION_SECRET;
    if (secret) {
      const s = await getIronSession<SessionData>(request, res, {
        cookieName: SESSION_COOKIE,
        password: secret,
      });
      if (s.isAuthenticated) session = s;
    }
  } catch { /* session stays null */ }

  if (!session) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Valid session required' } },
        { status: 401 }
      );
    }
    const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const url = new URL('/login', base);
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      url.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(url);
  }

  if (isSensitive(pathname) && session.clearanceLevel < 1) {
    return NextResponse.json(
      { error: { code: 'CLEARANCE_DENIED', message: 'Level 1 clearance required' } },
      { status: 403 }
    );
  }

  if (!isKernelExempt(pathname)) {
    try {
      const { getStore } = await import('@/lib/store/InMemoryStore');
      if (getStore().kernel.status === 'halted') {
        return NextResponse.json(
          { error: { code: 'KERNEL_HALTED', message: 'Kernel is halted' } },
          { status: 503 }
        );
      }
    } catch { /* allow through */ }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
