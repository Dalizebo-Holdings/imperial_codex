/**
 * MCP Read Tools — Pillars, OS Modules, Library, and Integrations
 *
 * Registers 7 read-only MCP tools against the provided McpServer instance.
 * All tools read from the in-memory store (getStore()) — no Supabase calls.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '@/lib/store/InMemoryStore';

const CLUSTER_ORDER = [
  'Architecture of Power',
  'Economic Fortress',
  'Machinery of War',
  'Influence and Domain',
] as const;

/**
 * Registers all 7 read tools on the given MCP server instance.
 */
export function registerReadTools(server: McpServer): void {
  // ─── get_pillar ────────────────────────────────────────────────────────────
  server.tool(
    'get_pillar',
    'Returns the full Pillar record for a given three-digit code (001–207). ' +
      'Includes the pillar code, cluster, title, and body text.',
    { code: z.string().describe('Three-digit Pillar code, e.g. "042" or "001"') },
    async ({ code }) => {
      const store = getStore();
      const pillar = store.pillars.get(code);

      if (!pillar) {
        return {
          content: [{ type: 'text' as const, text: `Error: PILLAR_NOT_FOUND — code "${code}" not in registry` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(pillar, null, 2) }],
      };
    }
  );

  // ─── search_pillars ────────────────────────────────────────────────────────
  server.tool(
    'search_pillars',
    'Searches the 207 Strategic Pillars by keyword and returns results ranked by relevance. ' +
      'Searches across title, body, and cluster fields.',
    {
      query: z.string().describe('Search query string'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum results to return (default 10)'),
    },
    async ({ query, limit = 10 }) => {
      const store = getStore();

      if (!store.pillarSearchIndex) {
        return {
          content: [{ type: 'text' as const, text: 'Error: PILLAR_SEARCH_UNAVAILABLE — search index not initialised' }],
          isError: true,
        };
      }

      const results = store.pillarSearchIndex
        .search(query)
        .slice(0, limit)
        .map((r) => r.item);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // ─── get_os_module ─────────────────────────────────────────────────────────
  server.tool(
    'get_os_module',
    'Returns the full OS Module record for a given slug (e.g., "TAX-OS", "KIRO-OS"). ' +
      'Includes slug, cluster, description, linked Pillar codes, and linked Integration IDs.',
    { slug: z.string().describe('OS Module slug, e.g. "TAX-OS" or "KIRO-OS"') },
    async ({ slug }) => {
      const store = getStore();
      const module = store.osModules.get(slug);

      if (!module) {
        return {
          content: [{ type: 'text' as const, text: `Error: OS_MODULE_NOT_FOUND — slug "${slug}" not in registry` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(module, null, 2) }],
      };
    }
  );

  // ─── list_os_modules ───────────────────────────────────────────────────────
  server.tool(
    'list_os_modules',
    'Returns all 36 Integrated Operating System modules grouped by the four canonical clusters: ' +
      'Architecture of Power, Economic Fortress, Machinery of War, and Influence and Domain. ' +
      'Modules within each cluster are ordered alphabetically by slug.',
    {},
    async () => {
      const store = getStore();
      const grouped: Record<string, unknown[]> = {};

      for (const cluster of CLUSTER_ORDER) {
        grouped[cluster] = [];
      }

      for (const [, module] of store.osModules) {
        const cluster = (module as { cluster?: string }).cluster ?? 'Unknown';
        if (!grouped[cluster]) grouped[cluster] = [];
        grouped[cluster].push(module);
      }

      // Sort each cluster alphabetically by slug
      for (const cluster of Object.keys(grouped)) {
        grouped[cluster].sort((a, b) => {
          const slugA = (a as { slug: string }).slug ?? '';
          const slugB = (b as { slug: string }).slug ?? '';
          return slugA.localeCompare(slugB);
        });
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(grouped, null, 2) }],
      };
    }
  );

  // ─── search_library ────────────────────────────────────────────────────────
  server.tool(
    'search_library',
    'Searches the 345-entry Imperial Library by keyword and returns results ranked by relevance. ' +
      'Searches across title, body, and OS Module slug tags.',
    {
      query: z.string().describe('Search query string'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum results to return (default 10)'),
    },
    async ({ query, limit = 10 }) => {
      const store = getStore();

      if (!store.librarySearchIndex) {
        return {
          content: [{ type: 'text' as const, text: 'Error: LIBRARY_SEARCH_UNAVAILABLE — search index not initialised' }],
          isError: true,
        };
      }

      const results = store.librarySearchIndex
        .search(query)
        .slice(0, limit)
        .map((r) => r.item);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // ─── get_library_entry ─────────────────────────────────────────────────────
  server.tool(
    'get_library_entry',
    'Returns the full Library entry record for a given entry ID. ' +
      'Includes ID, title, body text, and all OS Module slug tags.',
    { id: z.string().describe('Library entry ID') },
    async ({ id }) => {
      const store = getStore();
      const entry = store.library.get(id);

      if (!entry) {
        return {
          content: [{ type: 'text' as const, text: `Error: LIBRARY_NOT_FOUND — entry ID "${id}" not in registry` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }],
      };
    }
  );

  // ─── get_integration_map ───────────────────────────────────────────────────
  server.tool(
    'get_integration_map',
    'Returns all inbound and outbound Integration records for a given OS Module slug. ' +
      'Inbound: integrations where this slug is a target. Outbound: integrations where this slug is the source.',
    { slug: z.string().describe('OS Module slug to get integrations for') },
    async ({ slug }) => {
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

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ slug, inbound, outbound }, null, 2),
        }],
      };
    }
  );
}
