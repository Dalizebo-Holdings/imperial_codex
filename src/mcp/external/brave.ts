/**
 * Brave Search MCP Client Wrapper
 *
 * Lazy-initialised MCP client for Brave Search web search.
 * Only initialises when BRAVE_API_KEY is present in the environment.
 * Returns null if the env var is absent — no error thrown.
 *
 * Exposes the `brave_web_search` tool to the chat agent.
 */

import { tool } from 'ai';
import { z } from 'zod';

let _initialised = false;
let _available = false;

/**
 * Checks if Brave Search is available (BRAVE_API_KEY is set).
 */
export function isBraveSearchAvailable(): boolean {
  return Boolean(process.env.BRAVE_API_KEY);
}

/**
 * Returns the Brave Search tool definition for use with the Vercel AI SDK.
 * Returns null if BRAVE_API_KEY is not set.
 */
export function getBraveSearchTool() {
  if (!isBraveSearchAvailable()) return null;

  return tool({
    description:
      'Searches the web using Brave Search and returns current, real-time results. ' +
      'Use this when you need information beyond the Imperial Codex data — ' +
      'current events, recent news, external research, or verification of facts.',
    parameters: z.object({
      query: z.string().describe('The search query'),
      count: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe('Number of results to return (default 5)'),
    }),
    execute: async ({ query, count = 5 }) => {
      const apiKey = process.env.BRAVE_API_KEY;
      if (!apiKey) return { error: 'BRAVE_API_KEY not configured' };

      try {
        const url = new URL('https://api.search.brave.com/res/v1/web/search');
        url.searchParams.set('q', query);
        url.searchParams.set('count', String(count));

        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': apiKey,
          },
        });

        if (!response.ok) {
          return { error: `Brave Search API error: HTTP ${response.status}` };
        }

        const data = await response.json();
        const results = (data.web?.results ?? []).map((r: {
          title: string;
          url: string;
          description: string;
        }) => ({
          title: r.title,
          url: r.url,
          description: r.description,
        }));

        return { query, results };
      } catch (err) {
        return {
          error: `Brave Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
      }
    },
  });
}
