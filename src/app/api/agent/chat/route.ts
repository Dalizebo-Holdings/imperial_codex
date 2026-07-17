/**
 * POST /api/agent/chat
 *
 * Streaming GPT-4o chat route using Vercel AI SDK.
 * Protected by the existing clearance gate middleware (401 for unauthenticated).
 *
 * Request body: { messages: CoreMessage[], conversationId?: string }
 * Response: streaming text/event-stream
 */

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSession } from '@/lib/security/session';
import { buildTools } from '@/lib/agent/ChatAgentService';
import { getExternalTools } from '@/mcp/external';
import {
  createSession,
  getMessages,
  appendMessage,
} from '@/lib/agent/ConversationRepository';
import type { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are the Imperial Codex AI Assistant for Dalizebo Holdings.

You have access to the full Imperial Codex — 207 Strategic Pillars, 36 OS Modules, 277 Integrations, 104 Recursive Loops, and 345 Library Entries.

Use the available tools to query Codex data when answering questions. Always ground your responses in actual Codex data rather than general knowledge.

Be concise, strategic, and authoritative. Speak as a trusted strategic advisor to the organisation.`;

export async function POST(request: NextRequest) {
  // Auth check — middleware handles 401 but we double-check here
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

  let body: { messages?: unknown[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: 'AGENT_STREAM_ERROR', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { messages: incomingMessages = [], conversationId: existingConvId } = body;

  // Get or create conversation session
  let conversationId = existingConvId;
  if (!conversationId) {
    try {
      const newSession = await createSession(session.userId);
      conversationId = newSession.id;
    } catch {
      // If session creation fails, continue without persistence
      conversationId = undefined;
    }
  }

  // Load conversation history from Supabase
  let history: Awaited<ReturnType<typeof getMessages>> = [];
  if (conversationId) {
    try {
      history = await getMessages(conversationId);
    } catch {
      // If history load fails, start fresh (silent fallback)
      history = [];
    }
  }

  // Build message list: history + new incoming messages
  const allMessages = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ...(incomingMessages as Array<{ role: 'user' | 'assistant'; content: string }>),
  ];

  const tools = { ...buildTools(), ...getExternalTools() };

  try {
    const result = streamText({
      model: openai('gpt-4o'),
      system: SYSTEM_PROMPT,
      messages: allMessages,
      tools,
      onFinish: async ({ text }) => {
        // Persist messages after stream completes
        if (conversationId && incomingMessages.length > 0) {
          try {
            const lastUserMsg = incomingMessages[incomingMessages.length - 1] as {
              role: string;
              content: string;
            };

            if (lastUserMsg?.role === 'user') {
              await appendMessage({
                conversation_id: conversationId,
                role: 'user',
                content: lastUserMsg.content,
                tool_calls: null,
              });
            }

            await appendMessage({
              conversation_id: conversationId,
              role: 'assistant',
              content: text,
              tool_calls: null,
            });
          } catch {
            // Persistence failure must not affect the response
          }
        }
      },
    });

    // Return the conversation ID in a header so the client can track it
    const response = result.toTextStreamResponse();
    if (conversationId) {
      const headers = new Headers(response.headers);
      headers.set('X-Conversation-Id', conversationId);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  } catch (err) {
    console.error('[ChatRoute] AGENT_STREAM_ERROR:', err);
    return Response.json(
      {
        error: {
          code: 'AGENT_STREAM_ERROR',
          message: err instanceof Error ? err.message : 'OpenAI streaming failed',
        },
      },
      { status: 500 }
    );
  }
}
