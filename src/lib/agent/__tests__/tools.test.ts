/**
 * Unit tests for AI tool definitions.
 */

jest.mock('@/lib/store/InMemoryStore');
jest.mock('@/lib/db/supabase');

import { buildTools } from '../tools';
import { getStore } from '@/lib/store/InMemoryStore';
import { getSupabaseClient } from '@/lib/db/supabase';

const mockPillar = { code: '001', cluster: 'Fiscal Weaponization', title: 'Test Pillar', body: 'Body text' };
const mockOSModule = { slug: 'TAX-OS', cluster: 'Economic Fortress', description: 'Tax OS', linkedPillarCodes: [], linkedIntegrationIds: [] };
const mockLibraryEntry = { id: 'lib-001', title: 'Test Entry', body: 'Library body', slugTags: ['TAX-OS'] };

const mockStore = {
  pillars: new Map([['001', mockPillar]]),
  osModules: new Map([['TAX-OS', mockOSModule]]),
  integrations: new Map([
    ['int-001', { sourceSlug: 'TAX-OS', targetSlugs: ['KIRO-OS'], relationshipType: 'feeds' }],
    ['int-002', { sourceSlug: 'KIRO-OS', targetSlugs: ['TAX-OS'], relationshipType: 'depends' }],
  ]),
  library: new Map([['lib-001', mockLibraryEntry]]),
  pillarSearchIndex: { search: jest.fn(() => [{ item: mockPillar, score: 0.9 }]) },
  librarySearchIndex: { search: jest.fn(() => [{ item: mockLibraryEntry, score: 0.8 }]) },
  osModuleSearchIndex: { search: jest.fn(() => [{ item: mockOSModule, score: 0.7 }]) },
};

const mockSupabaseQuery = jest.fn();
const mockClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
};

describe('AI Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStore as jest.Mock).mockReturnValue(mockStore);
    (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
  });

  describe('getPillar', () => {
    it('returns pillar for valid code', async () => {
      const tools = buildTools();
      const result = await tools.getPillar.execute({ code: '001' }, { messages: [], toolCallId: 'test' });
      expect(result).toEqual(mockPillar);
    });

    it('returns null for unknown code', async () => {
      const tools = buildTools();
      const result = await tools.getPillar.execute({ code: '999' }, { messages: [], toolCallId: 'test' });
      expect(result).toBeNull();
    });
  });

  describe('searchPillars', () => {
    it('returns search results from in-memory index', async () => {
      const tools = buildTools();
      const result = await tools.searchPillars.execute({ query: 'fiscal' }, { messages: [], toolCallId: 'test' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPillar);
    });

    it('returns empty array when search index is not available', async () => {
      (getStore as jest.Mock).mockReturnValue({ ...mockStore, pillarSearchIndex: null });
      const tools = buildTools();
      const result = await tools.searchPillars.execute({ query: 'test' }, { messages: [], toolCallId: 'test' });
      expect(result).toEqual([]);
    });
  });

  describe('getOSModule', () => {
    it('returns OS module for valid slug', async () => {
      const tools = buildTools();
      const result = await tools.getOSModule.execute({ slug: 'TAX-OS' }, { messages: [], toolCallId: 'test' });
      expect(result).toEqual(mockOSModule);
    });

    it('returns null for unknown slug', async () => {
      const tools = buildTools();
      const result = await tools.getOSModule.execute({ slug: 'UNKNOWN-OS' }, { messages: [], toolCallId: 'test' });
      expect(result).toBeNull();
    });
  });

  describe('searchLibrary', () => {
    it('returns library search results', async () => {
      const tools = buildTools();
      const result = await tools.searchLibrary.execute({ query: 'strategy' }, { messages: [], toolCallId: 'test' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockLibraryEntry);
    });
  });

  describe('getIntegrationMap', () => {
    it('returns inbound and outbound integrations for a slug', async () => {
      const tools = buildTools();
      const result = await tools.getIntegrationMap.execute({ slug: 'TAX-OS' }, { messages: [], toolCallId: 'test' }) as { inbound: unknown[]; outbound: unknown[] };
      expect(result.outbound).toHaveLength(1);
      expect(result.inbound).toHaveLength(1);
    });
  });
});
