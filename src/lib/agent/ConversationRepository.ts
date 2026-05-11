/**
 * ConversationRepository — Supabase-backed chat conversation persistence.
 *
 * Manages agent_conversations and agent_messages tables.
 * Implements 404/403 disambiguation for cross-user access attempts.
 */

import { getSupabaseClient } from '@/lib/db/supabase';
import { withRetry } from '@/lib/db/retry';
import type { AgentConversation, AgentMessage } from '@/lib/db/types';

export class ConversationNotFoundError extends Error {
  readonly code = 'CONVERSATION_NOT_FOUND';
  readonly status = 404;
  constructor(id: string) {
    super(`Conversation not found: ${id}`);
    this.name = 'ConversationNotFoundError';
  }
}

export class ConversationAccessDeniedError extends Error {
  readonly code = 'CONVERSATION_ACCESS_DENIED';
  readonly status = 403;
  constructor(id: string) {
    super(`Access denied to conversation: ${id}`);
    this.name = 'ConversationAccessDeniedError';
  }
}

/**
 * Creates a new chat session for the given user.
 */
export async function createSession(userId: string): Promise<AgentConversation> {
  const client = getSupabaseClient();

  return withRetry(async () => {
    const { data, error } = await client
      .from('agent_conversations')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
    return data as AgentConversation;
  });
}

/**
 * Returns the most recent chat session for the given user, or null if none exists.
 */
export async function getLatestSession(userId: string): Promise<AgentConversation | null> {
  const client = getSupabaseClient();

  return withRetry(async () => {
    const { data, error } = await client
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error?.code === 'PGRST116') return null; // no sessions yet
    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return data as AgentConversation;
  });
}

/**
 * Returns a specific chat session by ID, verifying ownership.
 * Throws ConversationNotFoundError (404) if the session doesn't exist.
 * Throws ConversationAccessDeniedError (403) if it belongs to a different user.
 */
export async function getSession(id: string, userId: string): Promise<AgentConversation> {
  const client = getSupabaseClient();

  // Query with both id and user_id filter
  const { data, error } = await client
    .from('agent_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!error) return data as AgentConversation;

  if (error.code === 'PGRST116') {
    // Row not found with this user_id — check if it exists at all
    const { data: exists } = await client
      .from('agent_conversations')
      .select('id')
      .eq('id', id)
      .single();

    if (exists) throw new ConversationAccessDeniedError(id);
    throw new ConversationNotFoundError(id);
  }

  throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
}

/**
 * Returns all chat sessions for the given user, ordered by updated_at descending.
 * Returns at most 50 sessions.
 */
export async function listSessions(userId: string): Promise<AgentConversation[]> {
  const client = getSupabaseClient();

  return withRetry(async () => {
    const { data, error } = await client
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return (data ?? []) as AgentConversation[];
  });
}

/**
 * Deletes a chat session and all its messages (via cascade).
 * Verifies ownership before deleting.
 */
export async function deleteSession(id: string, userId: string): Promise<void> {
  // Verify ownership first (throws 403/404 if not owned)
  await getSession(id, userId);

  const client = getSupabaseClient();

  await withRetry(async () => {
    const { error } = await client
      .from('agent_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });
  });
}

/**
 * Appends a message to a conversation.
 */
export async function appendMessage(
  message: Omit<AgentMessage, 'id' | 'created_at'>
): Promise<AgentMessage> {
  const client = getSupabaseClient();

  return withRetry(async () => {
    const { data, error } = await client
      .from('agent_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_INSERT_FAILED' });

    // Update conversation updated_at
    await client
      .from('agent_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return data as AgentMessage;
  });
}

/**
 * Returns all messages for a conversation, ordered by created_at ascending.
 */
export async function getMessages(conversationId: string): Promise<AgentMessage[]> {
  const client = getSupabaseClient();

  return withRetry(async () => {
    const { data, error } = await client
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw Object.assign(new Error(error.message), { code: 'DB_QUERY_FAILED' });
    return (data ?? []) as AgentMessage[];
  });
}
