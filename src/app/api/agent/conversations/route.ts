/**
 * GET /api/agent/conversations
 *
 * Returns all chat sessions for the authenticated user,
 * ordered by updated_at descending (max 50).
 */

import { getSession } from '@/lib/security/session';
import { listSessions } from '@/lib/agent/ConversationRepository';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await getSession(request);
  } catch {
    session = null;
  }
  if (!session?.isAuthenticated) {
    return Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Valid session required' } },
      { status: 401 }
    );
  }

  try {
    const conversations = await listSessions(session.userId);
    return Response.json({ conversations });
  } catch (err) {
    console.error('[ConversationsRoute] GET failed:', err);
    return Response.json(
      { error: { code: 'DB_QUERY_FAILED', message: 'Failed to retrieve conversations' } },
      { status: 500 }
    );
  }
}
