/**
 * Unit tests for ConversationRepository.
 */

jest.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/db/retry', () => ({
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

import { getSupabaseClient } from '@/lib/db/supabase';
import {
  createSession,
  getLatestSession,
  getSession,
  deleteSession,
  appendMessage,
  ConversationNotFoundError,
  ConversationAccessDeniedError,
} from '../ConversationRepository';

const mockConversation = {
  id: 'conv-001',
  user_id: 'user-001',
  title: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockMessage = {
  id: 'msg-001',
  conversation_id: 'conv-001',
  role: 'user' as const,
  content: 'Hello',
  tool_calls: null,
  created_at: '2026-01-01T00:00:00Z',
};

function buildMockClient(overrides: Record<string, unknown> = {}) {
  const single = jest.fn();
  const limit = jest.fn(() => ({ single }));
  const order = jest.fn(() => ({ limit, single }));
  const eq = jest.fn(() => ({ eq, order, single, select: jest.fn(() => ({ single })) }));
  const select = jest.fn(() => ({ eq, order, single }));
  const insert = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  const del = jest.fn(() => ({ eq }));

  return {
    from: jest.fn(() => ({
      insert,
      select,
      update,
      delete: del,
      eq,
      order,
      ...overrides,
    })),
    _mocks: { single, limit, order, eq, select, insert, update, del },
  };
}

describe('ConversationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('inserts a new conversation and returns it', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockConversation, error: null }),
            })),
          })),
        })),
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      const result = await createSession('user-001');
      expect(result).toEqual(mockConversation);
    });
  });

  describe('getLatestSession', () => {
    it('returns null when no sessions exist', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                })),
              })),
            })),
          })),
        })),
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      const result = await getLatestSession('user-001');
      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('throws ConversationAccessDeniedError when session belongs to different user', async () => {
      const mockClient = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                })),
              })),
            })),
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'conv-001' }, // exists but belongs to different user
                  error: null,
                }),
              })),
            })),
          }),
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      await expect(getSession('conv-001', 'wrong-user')).rejects.toThrow(
        ConversationAccessDeniedError
      );
    });

    it('throws ConversationNotFoundError when session does not exist', async () => {
      const mockClient = {
        from: jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                })),
              })),
            })),
          })
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null, // does not exist at all
                  error: { code: 'PGRST116' },
                }),
              })),
            })),
          }),
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      await expect(getSession('nonexistent', 'user-001')).rejects.toThrow(
        ConversationNotFoundError
      );
    });
  });

  describe('appendMessage', () => {
    it('inserts a message and updates conversation updated_at', async () => {
      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const mockClient = {
        from: jest.fn()
          .mockReturnValueOnce({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: mockMessage, error: null }),
              })),
            })),
          })
          .mockReturnValueOnce({
            update: jest.fn(() => ({ eq: updateEq })),
          }),
      };
      (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);

      const result = await appendMessage({
        conversation_id: 'conv-001',
        role: 'user',
        content: 'Hello',
        tool_calls: null,
      });

      expect(result).toEqual(mockMessage);
      expect(updateEq).toHaveBeenCalled();
    });
  });
});
