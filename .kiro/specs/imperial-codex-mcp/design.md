# Design Document

## Imperial Codex MCP Integration

---

## Overview

This document describes the technical design for adding Model Context Protocol (MCP) support to the Imperial Codex. The design covers two interconnected capabilities:

1. **Imperial Codex MCP Server** — a standalone MCP server exposing 13 tools over stdio and HTTP/SSE transports.
2. **External MCP Clients** — lazy-initialised MCP clients for Brave Search, Slack, and GitHub integrated into the chat agent and background agent.

The MCP server reads from the same in-memory store (`getStore()`) and Supabase clients used by the existing AI agent layer. No new data sources are introduced.

---

## Architecture

```
+------------------------------------------------------------------+
|                    External MCP Clients                          |
|  Claude Desktop  Cursor  Any MCP-compatible agent                |
+--------+---------+-------+--------------------------------------+
         |         |       |
         | stdio   | HTTP  | SSE
         |         |       |
+--------v---------v-------v--------------------------------------+
|              Imperial Codex MCP Server                           |
|  src/mcp/server.ts  (McpServer, 13 tools)                        |
|  /api/mcp           (HTTP/SSE transport — Next.js route)         |
+----------------------------+-------------------------------------+
                             |
+----------------------------v-------------------------------------+
|              Existing Service Layer (unchanged)                  |
|  getStore()  PillarService  OSModuleService  LibraryService      |
|  StrikeOutputEngine  CapitalAllocationService  InstrumentArchive |
|  LoopEngine  supabaseClient                                      |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|              External MCP Clients (in agents)                    |
|  BraveSearchMcpClient  (chat agent — web search)                 |
|  SlackMcpClient        (background agent — rich alerts)          |
|  GitHubMcpClient       (chat agent — repo read/write)            |
+------------------------------------------------------------------+
```

---

## Components and Interfaces

### New Files

```
src/
  mcp/
    server.ts          ← MCP server entry point (stdio + HTTP)
    tools/
      read-tools.ts    ← get_pillar, search_pillars, get_os_module, list_os_modules,
                          search_library, get_library_entry, get_integration_map
      write-tools.ts   ← generate_strike_output, submit_capital_allocation,
                          get_capital_allocation, get_instrument, list_instruments,
                          get_loop_status
    transport/
      http.ts          ← HTTP/SSE transport adapter for Next.js
    external/
      brave.ts         ← Brave Search MCP client wrapper
      slack.ts         ← Slack MCP client wrapper
      github.ts        ← GitHub MCP client wrapper
      index.ts         ← lazy initialisation of all external clients
  app/
    api/
      mcp/
        route.ts       ← POST /api/mcp (HTTP/SSE transport)
mcp-config.json        ← Claude Desktop / Cursor connection config
.kiro/
  settings/
    mcp.json           ← Kiro MCP config
```

### MCP Server Contract

```typescript
// src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export function createMcpServer(): McpServer;
export async function startStdioServer(): Promise<void>;
```

### Tool Definitions

All 13 tools use Zod schemas for parameter validation (consistent with the existing AI tools in `tools.ts`).

```typescript
// Read tools
get_pillar:           { code: string }                    → Pillar | McpError
search_pillars:       { query: string, limit?: number }   → Pillar[]
get_os_module:        { slug: string }                    → OSModule | McpError
list_os_modules:      {}                                  → Record<cluster, OSModule[]>
search_library:       { query: string, limit?: number }   → LibraryEntry[]
get_library_entry:    { id: string }                      → LibraryEntry | McpError
get_integration_map:  { slug: string }                    → IntegrationMap

// Write/generation tools
generate_strike_output: { targetSlugs: string[], directive?: string, userId?: string }
                                                          → StrikeOutput
get_capital_allocation: {}                                → AllocationRecord | null
submit_capital_allocation: { growthPercent: number, operationalPercent: number,
                             reservePercent: number, userId: string, slug: string }
                                                          → AllocationRecord | ValidationErrors
get_instrument:       { id: string }                      → StrikeOutput | McpError
list_instruments:     { year: number }                    → InstrumentRegistryEntry[]
get_loop_status:      { loopId: string }                  → LoopExecutionLogRow | null
```

### HTTP Transport

The `/api/mcp` route adapts the MCP server to Next.js App Router:

```typescript
// src/app/api/mcp/route.ts
export async function POST(request: NextRequest): Promise<Response>
// Accepts MCP JSON-RPC, returns JSON-RPC response or SSE stream
```

### External MCP Client Wrappers

Each external client is a thin wrapper that:
1. Checks for the required env var
2. Initialises the MCP client lazily on first use
3. Returns `null` if the env var is absent (no error thrown)

```typescript
// src/mcp/external/index.ts
export async function getBraveSearchClient(): Promise<McpClient | null>
export async function getSlackClient(): Promise<McpClient | null>
export async function getGitHubClient(): Promise<McpClient | null>
```

---

## Correctness Properties

### Property 43: MCP Tool Schema Completeness

For any MCP server instance created by `createMcpServer()`, calling `tools/list` SHALL return exactly 13 tool definitions, and each definition SHALL contain a non-empty `name` string, a non-empty `description` string, and a valid JSON Schema object in `inputSchema`. No tool definition may be missing any of these three fields.

**Validates: Requirement 1.2, 1.3**

### Property 44: MCP Tool Result Consistency

For any valid input to any of the 13 MCP tools, the tool result returned via the MCP server SHALL be semantically identical to the result returned by calling the corresponding service function directly with the same input. The MCP transport layer must not alter, filter, or transform the underlying service response.

**Validates: Requirement 2, 3**

### Property 45: External MCP Client Conditional Initialisation

For any external MCP client (Brave Search, Slack, GitHub), the client SHALL be initialised if and only if its required environment variable is present and non-empty. If the environment variable is absent or empty, the client SHALL return null without throwing an error, and the corresponding tools SHALL not be exposed to the model.

**Validates: Requirements 5.3, 6.4, 7.4**

---

## Error Handling

All MCP tool errors follow the MCP error response format:

```json
{
  "content": [{ "type": "text", "text": "Error: PILLAR_NOT_FOUND — code 999 not in registry" }],
  "isError": true
}
```

HTTP transport errors use standard HTTP status codes in addition to MCP error responses.

---

## Configuration Files

### mcp-config.json (repo root)

```json
{
  "mcpServers": {
    "imperial-codex-stdio": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "src/mcp/server.ts"],
      "description": "Imperial Codex MCP server (local stdio)"
    },
    "imperial-codex-http": {
      "url": "${MCP_SERVER_URL}/api/mcp",
      "description": "Imperial Codex MCP server (remote HTTP)"
    }
  }
}
```

### .kiro/settings/mcp.json

```json
{
  "mcpServers": {
    "imperial-codex": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "src/mcp/server.ts"],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "get_pillar", "search_pillars", "get_os_module", "list_os_modules",
        "search_library", "get_library_entry", "get_integration_map",
        "get_loop_status", "get_capital_allocation", "get_instrument", "list_instruments"
      ]
    }
  }
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server and client SDK |
| `zod` | Parameter schema validation (already used by `ai` package) |
