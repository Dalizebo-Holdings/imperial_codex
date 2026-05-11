/**
 * Imperial Codex MCP Server
 *
 * Exposes 13 MCP tools over stdio (local) and HTTP/SSE (remote) transports.
 * External AI agents (Claude Desktop, Cursor, etc.) connect to this server
 * to query Codex data and trigger operations.
 *
 * Usage (stdio):
 *   node --loader ts-node/esm src/mcp/server.ts
 *
 * Usage (HTTP):
 *   POST /api/mcp  (Next.js App Router route)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerReadTools } from './tools/read-tools.js';
import { registerWriteTools } from './tools/write-tools.js';

export const MCP_SERVER_NAME = 'imperial-codex';
export const MCP_SERVER_VERSION = '1.0.0';

/**
 * Creates and returns a fully configured MCP server instance with all 13 tools registered.
 * Safe to call multiple times — each call returns a new independent server instance.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  // Register all 13 tools
  registerReadTools(server);   // 7 read tools: get_pillar, search_pillars, get_os_module,
                               //   list_os_modules, search_library, get_library_entry,
                               //   get_integration_map
  registerWriteTools(server);  // 6 write tools: generate_strike_output, get_instrument,
                               //   list_instruments, get_capital_allocation,
                               //   submit_capital_allocation, get_loop_status

  return server;
}

/**
 * Starts the MCP server with stdio transport for local use.
 * Called when this file is run directly (e.g., from Claude Desktop config).
 */
export async function startStdioServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Imperial Codex MCP server started (stdio) — 13 tools registered');
}

// Run as standalone process when executed directly
if (
  typeof process !== 'undefined' &&
  (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js'))
) {
  startStdioServer().catch((err) => {
    console.error('[MCP] Fatal error:', err);
    process.exit(1);
  });
}
