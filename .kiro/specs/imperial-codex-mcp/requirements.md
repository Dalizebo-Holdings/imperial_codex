# Requirements Document

## Imperial Codex MCP Integration

---

## Introduction

This document specifies the requirements for adding Model Context Protocol (MCP) support to the Imperial Codex. The integration has two parts:

1. **Imperial Codex MCP Server** — exposes all Codex capabilities as MCP tools so external AI agents (Claude Desktop, Cursor, other MCP clients) can query Pillars, OS Modules, Library entries, generate Strike Outputs, and more.
2. **External MCP Clients** — connects the Codex background agent and chat assistant to external MCP servers (Brave Search, Slack, GitHub, Supabase) to extend their capabilities.

---

## Glossary

- **MCP** — Model Context Protocol; an open standard for AI models to call external tools.
- **MCP_Server** — the Imperial Codex MCP server exposing 13 tools.
- **MCP_Tool** — a named, schema-described function callable by an MCP client.
- **MCP_Client** — an AI agent or application that connects to an MCP server to call its tools.
- **stdio_Transport** — MCP transport over standard input/output for local process use.
- **HTTP_Transport** — MCP transport over HTTP/SSE for remote use via Next.js API route.
- **External_MCP_Server** — a third-party MCP server (Brave Search, Slack, GitHub, Supabase).
- **BRAVE_API_KEY** — env var for Brave Search MCP server.
- **SLACK_BOT_TOKEN** — env var for Slack MCP server.
- **GITHUB_TOKEN** — env var for GitHub MCP server.
- **MCP_SERVER_URL** — env var for the Codex MCP server HTTP endpoint.

---

## Requirements

### Requirement 1: Imperial Codex MCP Server — Core

**User Story:** As an external AI agent operator, I want to connect to the Imperial Codex via MCP, so that any MCP-compatible client can query Codex data without custom integration code.

#### Acceptance Criteria

1. THE Codex SHALL provide an MCP server implemented using `@modelcontextprotocol/sdk` at `src/mcp/server.ts`.
2. THE MCP_Server SHALL expose exactly 13 MCP_Tools: `get_pillar`, `search_pillars`, `get_os_module`, `list_os_modules`, `search_library`, `get_library_entry`, `get_integration_map`, `get_loop_status`, `generate_strike_output`, `get_capital_allocation`, `submit_capital_allocation`, `get_instrument`, `list_instruments`.
3. WHEN an MCP_Client calls `tools/list`, THE MCP_Server SHALL return all 13 tool definitions, each with a non-empty `name`, `description`, and valid `inputSchema`.
4. THE MCP_Server SHALL support stdio transport for local use (e.g., Claude Desktop, Cursor).
5. THE MCP_Server SHALL support HTTP/SSE transport via a Next.js API route at `POST /api/mcp`.
6. WHEN an MCP_Client calls a tool with valid parameters, THE MCP_Server SHALL return the tool result within 5000ms.
7. IF an MCP_Client calls a tool with invalid parameters, THEN THE MCP_Server SHALL return a structured MCP error response identifying the invalid parameter.

---

### Requirement 2: MCP Tools — Read Operations

**User Story:** As an MCP client, I want to query Pillars, OS Modules, Library entries, and Integrations through MCP tools, so that I can ground AI responses in real Codex data.

#### Acceptance Criteria

1. WHEN `get_pillar` is called with a valid three-digit code, THE tool SHALL return the full Pillar record including code, cluster, title, and body.
2. WHEN `search_pillars` is called with a query string, THE tool SHALL return up to 10 Pillar records ranked by relevance.
3. WHEN `get_os_module` is called with a valid slug, THE tool SHALL return the full OS Module record including slug, cluster, description, linkedPillarCodes, and linkedIntegrationIds.
4. WHEN `list_os_modules` is called, THE tool SHALL return all 36 OS Modules grouped by the four canonical clusters in fixed order.
5. WHEN `search_library` is called with a query string, THE tool SHALL return up to 10 Library entries ranked by relevance.
6. WHEN `get_library_entry` is called with a valid entry ID, THE tool SHALL return the full Library entry including ID, title, body, and slug tags.
7. WHEN `get_integration_map` is called with a valid OS Module slug, THE tool SHALL return all inbound and outbound Integration records for that slug.
8. IF any read tool is called with an identifier that does not exist, THEN THE tool SHALL return a structured error identifying the missing resource.

---

### Requirement 3: MCP Tools — Write and Generation Operations

**User Story:** As an MCP client, I want to generate Strike Outputs, submit capital allocations, and query execution records through MCP tools, so that I can trigger Codex operations from any AI agent.

#### Acceptance Criteria

1. WHEN `generate_strike_output` is called with target slugs and an optional directive, THE tool SHALL invoke the StrikeOutputEngine and return the full 5-section Strike Output.
2. WHEN `get_capital_allocation` is called, THE tool SHALL return the most recent approved capital allocation record from Supabase.
3. WHEN `submit_capital_allocation` is called with growth, operational, and reserve percentages plus a user ID and OS Module slug, THE tool SHALL validate the allocation against the 40/40/20 mandate and return either the approved record or a structured validation error.
4. WHEN `get_instrument` is called with a valid DH-RES-YYYY-NNN identifier, THE tool SHALL return the complete instrument document.
5. WHEN `list_instruments` is called with a year, THE tool SHALL return all instrument registry entries for that year ordered by NNN ascending.
6. WHEN `get_loop_status` is called with a loop ID, THE tool SHALL return the most recent execution record for that loop from the Supabase `loop_execution_log` table.

---

### Requirement 4: HTTP/SSE Transport

**User Story:** As a remote MCP client, I want to connect to the Imperial Codex MCP server over HTTP, so that I can use it from any network-accessible environment without running a local process.

#### Acceptance Criteria

1. THE Codex SHALL expose an MCP HTTP endpoint at `POST /api/mcp` using Next.js App Router.
2. THE `/api/mcp` route SHALL accept MCP JSON-RPC requests and return MCP JSON-RPC responses.
3. THE `/api/mcp` route SHALL support Server-Sent Events (SSE) for streaming tool results.
4. THE `/api/mcp` route SHALL be protected by the existing clearance gate middleware and return 401 for unauthenticated requests.
5. THE `MCP_SERVER_URL` environment variable SHALL document the full URL of the HTTP endpoint (e.g., `https://your-deployment.vercel.app/api/mcp`).

---

### Requirement 5: External MCP Clients — Brave Search

**User Story:** As an AI agent operator, I want the chat assistant to search the web using Brave Search via MCP, so that agents can ground responses in current information beyond the Codex data.

#### Acceptance Criteria

1. THE chat agent SHALL initialise a Brave Search MCP client when `BRAVE_API_KEY` is present in the environment.
2. WHEN the chat agent's GPT-4o model invokes the `brave_web_search` tool, THE agent SHALL execute the search via the Brave Search MCP server and return results.
3. IF `BRAVE_API_KEY` is not set, THEN the Brave Search tool SHALL not be exposed to the model and no error SHALL be thrown.

---

### Requirement 6: External MCP Clients — Slack

**User Story:** As an Admin, I want the background agent to send rich Slack messages for critical loop alerts via MCP, so that alerts are formatted and actionable rather than raw webhook payloads.

#### Acceptance Criteria

1. THE background agent SHALL initialise a Slack MCP client when `SLACK_BOT_TOKEN` is present.
2. WHEN a Critical_Loop is triggered, THE background agent SHALL send a formatted Slack message via the Slack MCP server instead of (or in addition to) the raw webhook.
3. THE Slack message SHALL include the loop ID, loop title, triggered timestamp, target slug, output action, and a severity indicator.
4. IF `SLACK_BOT_TOKEN` is not set, THEN the Slack MCP client SHALL not be initialised and the existing webhook fallback SHALL remain active.

---

### Requirement 7: External MCP Clients — GitHub

**User Story:** As an AI agent operator, I want the chat assistant to read and write repository files via GitHub MCP, so that agents can update OS Module definitions and Pillar records directly.

#### Acceptance Criteria

1. THE chat agent SHALL initialise a GitHub MCP client when `GITHUB_TOKEN` is present.
2. WHEN the model invokes `github_get_file_contents`, THE agent SHALL retrieve the file from the configured repository.
3. WHEN the model invokes `github_create_or_update_file`, THE agent SHALL commit the change to the repository.
4. IF `GITHUB_TOKEN` is not set, THEN GitHub tools SHALL not be exposed to the model.

---

### Requirement 8: MCP Configuration Files

**User Story:** As a developer, I want ready-to-use MCP configuration files for Claude Desktop, Cursor, and Kiro, so that I can connect to the Imperial Codex MCP server without manual configuration.

#### Acceptance Criteria

1. THE Codex SHALL provide a `mcp-config.json` at the repository root documenting the stdio and HTTP connection configurations for Claude Desktop and Cursor.
2. THE Codex SHALL provide a `.kiro/settings/mcp.json` file configuring Kiro to use the Imperial Codex MCP server.
3. THE `.env.example` SHALL be updated to document `BRAVE_API_KEY`, `SLACK_BOT_TOKEN`, `GITHUB_TOKEN`, and `MCP_SERVER_URL`.
4. THE `mcp-config.json` SHALL include both a `stdio` configuration (using `node src/mcp/server.ts`) and an `http` configuration (using `MCP_SERVER_URL`).
