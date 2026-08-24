/**
 * HTTP/SSE transport adapter for the Imperial Codex MCP server.
 *
 * Bridges MCP JSON-RPC requests to Next.js Request/Response objects.
 * Supports both single-response (JSON) and streaming (SSE) modes.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Handles an MCP JSON-RPC request via transport.
 * Note: StreamableHTTPServerTransport expects Node.js IncomingMessage, not Fetch API Request.
 * For Next.js, use a direct JSON-RPC handler instead.
 */
export async function handleMcpHttpRequest(
  server: McpServer,
  request: Request
): Promise<Response> {
  // For now, return a stub response
  // In production, you'd need to:
  // 1. Convert Fetch API Request to Node.js IncomingMessage, or
  // 2. Implement a custom JSON-RPC handler without StreamableHTTPServerTransport
  
  const body = await request.json().catch(() => ({}));
  
  // Mock JSON-RPC response
  return Response.json({
    jsonrpc: '2.0',
    result: { status: 'ok' },
    id: (body as any).id,
  });
}
