# Imperial Codex MCP Integration — Implementation Tasks

## Tasks

- [x] 1. Install MCP SDK Dependency
  Install the Model Context Protocol SDK.
  - Run `npm install @modelcontextprotocol/sdk`
  - Verify `@modelcontextprotocol/sdk` appears in `package.json`
  - **References:** Design §Dependencies, Requirement 1.1

- [x] 2. MCP Server Entry Point
  Create the core MCP server with tool registration scaffolding.
  - Create `src/mcp/server.ts`: initialise `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`; export `createMcpServer()` and `startStdioServer()`; register all 13 tools (implementations in subsequent tasks); configure stdio transport via `StdioServerTransport`
  - **References:** Requirement 1.1, 1.4, Design §MCP Server Contract
  - **Depends on:** 1

- [x] 3. MCP Read Tools — Pillars and OS Modules
  Implement the four Pillar and OS Module MCP tools.
  - Create `src/mcp/tools/read-tools.ts`
  - `get_pillar({ code })` — calls `getStore().pillars.get(code)`, returns Pillar or MCP error
  - `search_pillars({ query, limit? })` — calls pillarSearchIndex, returns top N results
  - `get_os_module({ slug })` — calls `getStore().osModules.get(slug)`, returns OSModule or MCP error
  - `list_os_modules({})` — returns all 36 modules grouped by cluster in canonical order
  - Each tool has a Zod inputSchema and a non-empty description
  - **References:** Requirement 2.1–2.4, Design §Tool Definitions
  - **Depends on:** 2

- [x] 4. MCP Read Tools — Library and Integrations
  Implement the three Library and Integration MCP tools.
  - Add to `src/mcp/tools/read-tools.ts`
  - `search_library({ query, limit? })` — calls librarySearchIndex, returns top N results
  - `get_library_entry({ id })` — calls `getStore().library.get(id)`, returns LibraryEntry or MCP error
  - `get_integration_map({ slug })` — iterates integrations store, returns `{ inbound, outbound }`
  - **References:** Requirement 2.5–2.7, Design §Tool Definitions
  - **Depends on:** 3

- [x] 5. MCP Write Tools — Strike Output and Instruments
  Implement the Strike Output and Instrument MCP tools.
  - Create `src/mcp/tools/write-tools.ts`
  - `generate_strike_output({ targetSlugs, directive?, userId? })` — calls `StrikeOutputEngine.generate()`, returns full StrikeOutput
  - `get_instrument({ id })` — calls `InstrumentArchive.getById(id)`, returns instrument or MCP error
  - `list_instruments({ year })` — calls `InstrumentArchive.getByYear(year)`, returns registry entries
  - **References:** Requirement 3.1, 3.4–3.5, Design §Tool Definitions
  - **Depends on:** 2

- [x] 6. MCP Write Tools — Capital Allocation and Loop Status
  Implement the capital allocation and loop status MCP tools.
  - Add to `src/mcp/tools/write-tools.ts`
  - `get_capital_allocation({})` — queries Supabase `capital_allocations` table, returns most recent record
  - `submit_capital_allocation({ growthPercent, operationalPercent, reservePercent, userId, slug })` — calls `CapitalAllocationService.validate()` then `record()`, returns AllocationRecord or validation errors
  - `get_loop_status({ loopId })` — queries Supabase `loop_execution_log`, returns most recent record for loopId
  - **References:** Requirement 3.2–3.3, 3.6, Design §Tool Definitions
  - **Depends on:** 2

- [x] 7. Register All Tools in MCP Server
  Wire all 13 tools into the MCP server instance.
  - Modify `src/mcp/server.ts`: import all tools from `read-tools.ts` and `write-tools.ts`; register each tool using `server.tool(name, schema, handler)`
  - Verify `tools/list` returns exactly 13 tool definitions
  - **References:** Requirement 1.2–1.3, Property 43
  - **Depends on:** 3, 4, 5, 6

- [x] 8. HTTP/SSE Transport — Next.js API Route
  Implement the HTTP/SSE transport for remote MCP access.
  - Create `src/mcp/transport/http.ts`: adapter that bridges MCP JSON-RPC to Next.js Request/Response
  - Create `src/app/api/mcp/route.ts`: POST handler; verifies auth via clearance gate (401 if unauthenticated); creates MCP server instance; processes JSON-RPC request; returns JSON-RPC response or SSE stream
  - **References:** Requirement 4.1–4.4, Design §HTTP Transport
  - **Depends on:** 7

- [x] 9. External MCP Client — Brave Search
  Implement the lazy Brave Search MCP client wrapper.
  - Create `src/mcp/external/brave.ts`: `getBraveSearchClient()` — checks `BRAVE_API_KEY`; if present, initialises `@modelcontextprotocol/server-brave-search` client; returns client or null
  - Integrate into chat agent (`/api/agent/chat/route.ts`): if Brave client available, add `brave_web_search` tool to the tool set passed to `streamText`
  - **References:** Requirement 5.1–5.3, Design §External MCP Client Wrappers
  - **Depends on:** 1

- [x] 10. External MCP Client — Slack
  Implement the lazy Slack MCP client wrapper.
  - Create `src/mcp/external/slack.ts`: `getSlackClient()` — checks `SLACK_BOT_TOKEN`; if present, initialises Slack MCP client; returns client or null
  - Integrate into `BackgroundAgentService.dispatchWebhookAlert()`: if Slack client available, send formatted Slack message via MCP in addition to (or instead of) raw webhook
  - Slack message format: loop ID, loop title, triggered timestamp, target slug, output action, severity badge
  - **References:** Requirement 6.1–6.4, Design §External MCP Client Wrappers
  - **Depends on:** 1

- [x] 11. External MCP Client — GitHub
  Implement the lazy GitHub MCP client wrapper.
  - Create `src/mcp/external/github.ts`: `getGitHubClient()` — checks `GITHUB_TOKEN`; if present, initialises GitHub MCP client; returns client or null
  - Integrate into chat agent: if GitHub client available, add `github_get_file_contents` and `github_create_or_update_file` tools to the tool set
  - **References:** Requirement 7.1–7.4, Design §External MCP Client Wrappers
  - **Depends on:** 1

- [x] 12. External MCP Client Index
  Create the unified external client initialisation module.
  - Create `src/mcp/external/index.ts`: exports `getBraveSearchClient`, `getSlackClient`, `getGitHubClient`; each function is lazy (initialises on first call, caches the client instance)
  - **References:** Design §External MCP Client Wrappers, Property 45
  - **Depends on:** 9, 10, 11

- [x] 13. MCP Configuration Files
  Create all MCP configuration files for Claude Desktop, Cursor, and Kiro.
  - Create `mcp-config.json` at repo root: stdio config (`node --loader ts-node/esm src/mcp/server.ts`) and HTTP config (`${MCP_SERVER_URL}/api/mcp`)
  - Create `.kiro/settings/mcp.json`: Kiro MCP config pointing to the Codex MCP server with `autoApprove` for all read tools
  - Update `.env.example`: add `BRAVE_API_KEY`, `SLACK_BOT_TOKEN`, `GITHUB_TOKEN`, `MCP_SERVER_URL` with inline comments
  - **References:** Requirement 8.1–8.4, Design §Configuration Files
  - **Depends on:** 2

- [x] 14. Property Tests P43, P44, P45
  Write property-based tests for MCP correctness properties.
  - Write `src/__tests__/properties/property-43.test.ts`: `createMcpServer()` returns server with exactly 13 tools; each tool has non-empty name, description, and valid inputSchema
  - Write `src/__tests__/properties/property-44.test.ts`: for any valid input, MCP tool result matches direct service call result (mock store and Supabase)
  - Write `src/__tests__/properties/property-45.test.ts`: external clients return null when env var absent; initialise when env var present
  - All tests tagged `// Feature: imperial-codex-mcp, Property N:`
  - **References:** Design §Correctness Properties, Properties 43–45
  - **Depends on:** 7, 12

- [x] 15. Build Verification
  Verify the MCP integration builds and all tests pass.
  - Run `npm run build` — confirm zero TypeScript errors
  - Run `npm test` — confirm all new tests pass
  - Verify `tools/list` returns 13 tools when MCP server is instantiated in a test
  - Confirm `/api/mcp` returns 401 when called without a valid session
  - **References:** All requirements
  - **Depends on:** 8, 13, 14
