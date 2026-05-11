/**
 * HTTP/SSE transport adapter for the Imperial Codex MCP server.
 *
 * Bridges MCP JSON-RPC requests to Next.js Request/Response objects.
 * Supports both single-response (JSON) and streaming (SSE) modes.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

/**
 * Handles an MCP JSON-RPC request via HTTP transport.
 * Returns a Response suitable for Next.js App Router.
 */
export async function handleMcpHttpRequest(
  server: McpServer,
  request: Request
): Promise<Response> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);
  return response;
}
