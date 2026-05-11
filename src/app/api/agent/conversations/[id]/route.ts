/**
 * GET  /api/agent/conversations/[id] — returns session + messages
 * DELETE /api/agent/conversations/[id] — deletes session and all messages
 */

import { getSession } from '@/lib/security/session';
import {
  getSession as getConversation,
  getMessages,
  deleteSession,
  ConversationNotFoundError,
  ConversationAccessDeniedError,
} from '@/lib/agent/ConversationRepository';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const conversation = await getConversation(params.id, session.userId);
    const messages = await getMessages(params.id);
    return Response.json({ conversation, messages });
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      return Response.json(
        { error: { code: 'CONVERSATION_NOT_FOUND', message: err.message } },
        { status: 404 }
      );
    }
    if (err instanceof ConversationAccessDeniedError) {
      return Response.json(
        { error: { code: 'CONVERSATION_ACCESS_DENIED', message: err.message } },
        { status: 403 }
      );
    }
    console.error('[ConversationsRoute] GET [id] failed:', err);
    return Response.json(
      { error: { code: 'DB_QUERY_FAILED', message: 'Failed to retrieve conversation' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    await deleteSession(params.id, session.userId);
    return Response.json({ deleted: true, id: params.id });
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      return Response.json(
        { error: { code: 'CONVERSATION_NOT_FOUND', message: err.message } },
        { status: 404 }
      );
    }
    if (err instanceof ConversationAccessDeniedError) {
      return Response.json(
        { error: { code: 'CONVERSATION_ACCESS_DENIED', message: err.message } },
        { status: 403 }
      );
    }
    console.error('[ConversationsRoute] DELETE failed:', err);
    return Response.json(
      { error: { code: 'DB_INSERT_FAILED', message: 'Failed to delete conversation' } },
      { status: 500 }
    );
  }
}
