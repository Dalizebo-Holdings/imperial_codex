/**
 * POST /api/mcp
 *
 * HTTP/SSE transport endpoint for the Imperial Codex MCP server.
 * Accepts MCP JSON-RPC requests and returns JSON-RPC responses or SSE streams.
 *
 * Protected by the existing clearance gate middleware (401 for unauthenticated).
 * Remote MCP clients must include a valid imperial-session cookie.
 */

import { createMcpServer } from '@/mcp/server';
import { handleMcpHttpRequest } from '@/mcp/transport/http';
import { getSession } from '@/lib/security/session';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Auth check — require valid session for remote MCP access
  let session;
  try {
    session = await getSession(request);
  } catch {
    session = null;
  }

  if (!session?.isAuthenticated) {
    return Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Valid session required for MCP access' } },
      { status: 401 }
    );
  }

  try {
    const server = createMcpServer();
    return await handleMcpHttpRequest(server, request);
  } catch (err) {
    console.error('[MCP HTTP] Request failed:', err);
    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : 'Internal MCP server error',
        },
        id: null,
      },
      { status: 500 }
    );
  }
}

// Also handle GET for SSE connection establishment
export async function GET(request: NextRequest) {
  return POST(request);
}
