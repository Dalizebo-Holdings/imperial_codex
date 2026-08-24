import { getSession } from '@/lib/security/session';
import {
  isOpenHandsAvailable,
  runOpenHandsConversation,
  OpenHandsIntegrationError,
} from '@/lib/openhands/OpenHandsService';

interface OpenHandsRequestBody {
  message?: unknown;
  conversationId?: unknown;
}

export async function POST(request: Request) {
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

  if (!isOpenHandsAvailable()) {
    return Response.json(
      {
        error: {
          code: 'OPENHANDS_UNAVAILABLE',
          message:
            'OpenHands integration is not configured. Set OPENHANDS_SERVER_URL and OPENHANDS_API_KEY.',
        },
      },
      { status: 503 }
    );
  }

  let body: OpenHandsRequestBody;

  try {
    body = (await request.json()) as OpenHandsRequestBody;
  } catch {
    return Response.json(
      { error: { code: 'INVALID_REQUEST_BODY', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : undefined;

  if (!message) {
    return Response.json(
      { error: { code: 'INVALID_MESSAGE', message: 'Request body must include a non-empty message string.' } },
      { status: 400 }
    );
  }

  try {
    const result = await runOpenHandsConversation(message, conversationId);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Conversation-Id': result.conversationId,
      },
    });
  } catch (error: unknown) {
    if (error instanceof OpenHandsIntegrationError) {
      return Response.json(
        { error: { code: 'OPENHANDS_ERROR', message: error.message } },
        { status: 502 }
      );
    }
    const message = error instanceof Error ? error.message : 'OpenHands request failed';
    return Response.json(
      { error: { code: 'OPENHANDS_ERROR', message } },
      { status: 500 }
    );
  }
}
