/**
 * AI Tool definitions for the Imperial Codex Chat Agent.
 *
 * All 8 tools are defined using the Vercel AI SDK CoreTool format.
 * Tools reading from in-memory store: getPillar, searchPillars, getOSModule,
 *   searchLibrary, getIntegrationMap
 * Tools reading from Supabase: getLoopStatus, getInstrumentSummary,
 *   getCapitalAllocationSummary
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getStore } from '@/lib/store/InMemoryStore';
import { getSupabaseClient } from '@/lib/db/supabase';

/**
 * Returns all 8 AI tool definitions bound to the current in-memory store
 * and Supabase clients.
 */
export function buildTools() {
  return {
    getPillar: tool({
      description: 'Returns the full Pillar record for a given three-digit code (e.g., "042").',
      parameters: z.object({
        code: z.string().describe('Three-digit Pillar code, e.g. "042"'),
      }),
      execute: async ({ code }) => {
        const store = getStore();
        const pillar = store.pillars.get(code) ?? null;
        return pillar;
      },
    }),

    searchPillars: tool({
      description: 'Searches the Pillar registry by keyword and returns the top 10 results ranked by relevance.',
      parameters: z.object({
        query: z.string().describe('Search query string'),
      }),
      execute: async ({ query }) => {
        const store = getStore();
        if (!store.pillarSearchIndex) return [];
        return store.pillarSearchIndex.search(query).slice(0, 10).map((r) => r.item);
      },
    }),

    getOSModule: tool({
      description: 'Returns the full OS Module record for a given slug (e.g., "TAX-OS").',
      parameters: z.object({
        slug: z.string().describe('OS Module slug, e.g. "TAX-OS"'),
      }),
      execute: async ({ slug }) => {
        const store = getStore();
        return store.osModules.get(slug) ?? null;
      },
    }),

    searchLibrary: tool({
      description: 'Searches the Imperial Library by keyword and returns the top 10 results ranked by relevance.',
      parameters: z.object({
        query: z.string().describe('Search query string'),
      }),
      execute: async ({ query }) => {
        const store = getStore();
        if (!store.librarySearchIndex) return [];
        return store.librarySearchIndex.search(query).slice(0, 10).map((r) => r.item);
      },
    }),

    getIntegrationMap: tool({
      description: 'Returns all inbound and outbound Integration records for a given OS Module slug.',
      parameters: z.object({
        slug: z.string().describe('OS Module slug to get integrations for'),
      }),
      execute: async ({ slug }) => {
        const store = getStore();
        const inbound: unknown[] = [];
        const outbound: unknown[] = [];

        for (const [, integration] of store.integrations) {
          const intg = integration as { sourceSlug: string; targetSlugs: string[] };
          if (intg.sourceSlug === slug) {
            outbound.push(integration);
          } else if (intg.targetSlugs?.includes(slug)) {
            inbound.push(integration);
          }
        }

        return { inbound, outbound };
      },
    }),

    getLoopStatus: tool({
      description: 'Returns the most recent execution record for a given Recursive Loop ID.',
      parameters: z.object({
        loopId: z.string().describe('The Recursive Loop ID'),
      }),
      execute: async ({ loopId }) => {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('loop_execution_log')
          .select('*')
          .eq('loop_id', loopId)
          .order('triggered_at', { ascending: false })
          .limit(1)
          .single();

        if (error) return null;
        return data;
      },
    }),

    getInstrumentSummary: tool({
      description: 'Returns all Instrument registry entries for a given calendar year, ordered by NNN ascending.',
      parameters: z.object({
        year: z.number().int().min(2020).max(2100).describe('Calendar year, e.g. 2026'),
      }),
      execute: async ({ year }) => {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('instrument_registry')
          .select('*')
          .eq('year', year)
          .order('id', { ascending: true });

        if (error) return [];
        return data ?? [];
      },
    }),

    getCapitalAllocationSummary: tool({
      description: 'Returns the most recent approved capital allocation record.',
      parameters: z.object({}),
      execute: async () => {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('capital_allocations')
          .select('*')
          .order('approved_at', { ascending: false })
          .limit(1)
          .single();

        if (error) return null;
        return data;
      },
    }),
  };
}
