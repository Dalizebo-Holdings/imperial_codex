# Imperial Codex AI Agent — Implementation Tasks

## Tasks

- [x] 1. Install New Dependencies
  Install all new production packages required by the AI agent and Supabase integration.
  - Run `npm install @supabase/supabase-js ai @ai-sdk/openai @anthropic-ai/sdk`
  - Verify all four packages appear in `package.json` with pinned minor versions
  - Confirm `npm run build` still compiles without errors after install
  - **References:** Design §Dependencies, Requirement 2.10, Requirement 3.3, Requirement 6.2

- [x] 2. Supabase Migration File
  Create the versioned SQL migration file that defines all nine Supabase tables.
  - Create `/supabase/migrations/20260101000000_initial_schema.sql`
  - Define `audit_log` table (id UUID PK, user_id, resource, clearance_level, decision, timestamp, details jsonb)
  - Define `loop_execution_log` table (id UUID PK, loop_id, triggered_at, condition_matched, target_slug, output_action, outcome, triggered_by)
  - Define `instruments` table (id text PK format DH-RES-YYYY-NNN, title, issuing_authority, content, generated_at, status default 'active', generated_by)
  - Define `instrument_registry` table (id text PK, title, issuing_authority, generated_at, status, year generated always as EXTRACT(YEAR FROM generated_at) stored)
  - Define `capital_allocations` table (id UUID PK, growth_pct, operational_pct, reserve_pct, approved_by, os_module_slug, approved_at) with CHECK constraints ensuring each pct is 0–100 and sum equals 100
  - Define `capital_allocation_failures` table (id UUID PK, submitted_by, submitted_at, payload jsonb, validation_errors jsonb)
  - Define `vault` table (id integer PK default 1, encrypted_envelope text, updated_at) with CHECK (id = 1)
  - Define `agent_conversations` table (id UUID PK, user_id text not null, title, created_at, updated_at)
  - Define `agent_messages` table (id UUID PK, conversation_id UUID references agent_conversations ON DELETE CASCADE, role text CHECK IN ('user','assistant','tool'), content text, tool_calls jsonb, created_at)
  - Enable RLS on `vault` table; apply service-role-only policy
  - **References:** Requirement 1.1–1.11, Design §Supabase Migration SQL
  - **Depends on:** 1

- [x] 3. Supabase Repository and Retry Utility
  Implement the singleton Supabase clients and the generic exponential back-off retry utility.
  - Create `src/lib/db/types.ts` — TypeScript row interfaces for all 9 tables (`AuditLogRow`, `LoopExecutionLogRow`, `InstrumentRow`, `InstrumentRegistryRow`, `CapitalAllocationRow`, `CapitalAllocationFailureRow`, `VaultRow`, `AgentConversation`, `AgentMessage`)
  - Create `src/lib/db/retry.ts` — `withRetry<T>(operation, options?)` with defaults baseMs=500, capMs=5000, maxRetries=2; delay formula `min(baseMs * 2^attempt, capMs)`; propagates error after all retries exhausted
  - Create `src/lib/db/supabase.ts` — exports `supabaseClient` (anon key), `supabaseServiceClient` (service role key), and `init()` function; `init()` validates env vars at startup and enters degraded state (returns `DB_INSERT_FAILED` immediately) if any are missing
  - Write unit tests in `src/lib/db/__tests__/retry.test.ts`: success on first attempt, success on second attempt, success on third attempt, failure after all retries, delay timing with fake timers
  - **References:** Requirement 2.7–2.10, Design §SupabaseRepository, Design §Retry Utility, Property 35
  - **Depends on:** 1

- [x] 4. Migrate AuditLog to Supabase
  Update `AuditLog.ts` to write to the Supabase `audit_log` table instead of the filesystem.
  - Modify `src/lib/security/AuditLog.ts`: replace file append logic with `supabaseClient.from('audit_log').insert(...)` wrapped in `withRetry`
  - Remove all `fs` imports and JSONL file path references from `AuditLog.ts`
  - Ensure the `archive` method is removed or replaced with a no-op (archiving is now handled by Supabase retention policies)
  - Existing `AuditLogEntry` type in `src/lib/security/types.ts` maps to `AuditLogRow` — add mapping if field names differ
  - Update integration test in `src/lib/security/__tests__/AuditLog.supabase.test.ts`: insert row, verify existing rows unchanged after subsequent inserts (mock Supabase client)
  - **References:** Requirement 2.1, Design §Migrate AuditLog, Property 42
  - **Depends on:** 3

- [x] 5. Migrate LoopEngine to Supabase
  Update `LoopEngine.ts` to write execution records to the Supabase `loop_execution_log` table.
  - Modify `src/lib/loops/LoopEngine.ts`: replace JSONL append with `supabaseClient.from('loop_execution_log').insert(...)` wrapped in `withRetry`
  - Add `triggered_by` field to the execution record (default `'user'` for user-initiated triggers)
  - Remove all `fs` imports and JSONL file path references from `LoopEngine.ts`
  - Existing loop execution record type maps to `LoopExecutionLogRow` — update type references
  - **References:** Requirement 2.2, Design §Migrate LoopEngine
  - **Depends on:** 3

- [x] 6. Migrate InstrumentArchive to Supabase
  Update `InstrumentArchive.ts` and `InstrumentIdGenerator.ts` to use Supabase instead of the filesystem.
  - Modify `src/lib/instruments/InstrumentArchive.ts`: replace filesystem writes with inserts into `instruments` and `instrument_registry` tables via `withRetry`; add `generated_by` field to all inserts
  - Modify `src/lib/instruments/InstrumentIdGenerator.ts`: replace registry.json counter with a Supabase query (`SELECT MAX(id) FROM instrument_registry WHERE year = YYYY`) to determine the next NNN
  - Update `src/lib/instruments/types.ts`: add `generatedBy: StrikeGeneratedBy` to `InstrumentRegistryEntry`; remove `filePath` field
  - Write integration test in `src/lib/instruments/__tests__/InstrumentArchive.supabase.test.ts`: save instrument inserts to both tables, ID generation increments correctly, year boundary resets NNN (mock Supabase client)
  - **References:** Requirement 2.3, Design §Migrate InstrumentArchive, Property 41
  - **Depends on:** 3

- [x] 7. Migrate VaultRepository to Supabase
  Update `VaultRepository.ts` to read and write the `vault` Supabase table via the service client.
  - Modify `src/lib/security/VaultRepository.ts`: replace file read/write with `supabaseServiceClient.from('vault').select(...)` and `.upsert(...)` wrapped in `withRetry`
  - The vault table is a single-row table (id = 1); use `upsert` with `onConflict: 'id'` for writes
  - Remove all `fs` imports and `/vault/CLEARANCE_CODES.json` path references
  - Existing encrypt/decrypt logic (AES-256-GCM) remains unchanged — only the storage layer changes
  - **References:** Requirement 2.6, Design §Migrate VaultRepository
  - **Depends on:** 3

- [x] 8. Migrate CapitalAllocationService to Supabase
  Update `CapitalAllocationService.ts` to write allocation records to Supabase tables.
  - Modify `src/lib/capital/CapitalAllocationService.ts`: replace JSON file appends with inserts into `capital_allocations` (approved) and `capital_allocation_failures` (rejected) tables via `withRetry`
  - Remove all `fs` imports and JSON file path references from `CapitalAllocationService.ts`
  - Ensure `record()` method sets `approved_at` to current UTC timestamp and includes `approved_by` and `os_module_slug`
  - **References:** Requirement 2.4–2.5, Design §Migrate CapitalAllocationService
  - **Depends on:** 3

- [x] 9. Update instrumentation.ts for Supabase Init
  Add `SupabaseRepository.init()` to the startup sequence in `instrumentation.ts`.
  - Modify `src/instrumentation.ts`: call `SupabaseRepository.init()` after `SearchIndexBuilder` completes
  - If `init()` logs `SUPABASE_CONFIG_MISSING`, the startup sequence continues (degraded state, not halted)
  - **References:** Design §Startup Sequence, Requirement 2.7
  - **Depends on:** 3, 4, 5, 6, 7, 8

- [x] 10. Strike Output Type Updates
  Update Strike Output types to support `generated_by` provenance and `StructuredContext`.
  - Modify `src/lib/strike/types.ts`: add `StrikeGeneratedBy` union type (`'claude-engine' | 'template-fallback' | 'background-agent'`); add `generatedBy: StrikeGeneratedBy` field to `StrikeOutput`; add `StructuredContext` interface; add `ClaudeStrikeResult` interface; add `ValidationResult` interface
  - **References:** Design §Updated Strike Output Types, Requirement 6, Requirement 7
  - **Depends on:** 1

- [x] 11. StrikeValidator — Pure Validation Function
  Implement the pure structural validation function for AI-generated Strike Outputs.
  - Create `src/lib/strike/StrikeValidator.ts`: export `validate(output: string): ValidationResult`
  - Check 1: exactly five `##`-level headings present
  - Check 2: headings appear in exact order — `Executive Analysis`, `OS Stress Test`, `The Imperial Instrument`, `Action Plan (T-Minus 24 Hours)`, `The Ritual`
  - Check 3: each section body contains at least 50 non-whitespace characters
  - Return `{ valid: false, failures: [] }` immediately for null/empty input (guard clause)
  - `failures` array identifies each failing check by name
  - Write unit tests in `src/lib/strike/__tests__/StrikeValidator.test.ts`: all five sections correct → valid, wrong label → invalid with failure name, wrong order → invalid, missing section → invalid, body exactly 50 chars → valid, body 49 chars → invalid, null input → invalid
  - Write property test `Property 39` in `src/__tests__/properties/property-39.test.ts`
  - **References:** Requirement 7, Design §StrikeValidator, Property 39
  - **Depends on:** 10

- [x] 12. ClaudeStrikeEngine
  Implement the Anthropic Claude-powered Strike Output generator.
  - Create `src/lib/strike/ClaudeStrikeEngine.ts`: export `generate(context: StructuredContext): Promise<ClaudeStrikeResult>`
  - Use `@anthropic-ai/sdk` with model `claude-3-5-sonnet-20241022`
  - Assemble the system prompt instructing Claude to produce exactly the 5-Part Strike Hierarchy with correct `##` section labels
  - Assemble user message from `StructuredContext`: include intent, top-5 Pillars, top-3 OS Modules, top-3 Library entries (truncated to 500 chars each if total context would exceed 100k tokens), latest capital allocation
  - Throw `ClaudeApiError` on network error, timeout, or HTTP 5xx — caller handles fallback
  - Write unit tests in `src/lib/strike/__tests__/ClaudeStrikeEngine.test.ts`: successful generation, API timeout, network error, 5xx response
  - Write property test `Property 40` in `src/__tests__/properties/property-40.test.ts`
  - **References:** Requirement 6.1–6.2, Requirement 6.9–6.10, Design §ClaudeStrikeEngine, Property 40
  - **Depends on:** 10, 11

- [x] 13. Update StrikeOutputEngine to Use Claude with Fallback
  Wire `ClaudeStrikeEngine` and `StrikeValidator` into the existing `StrikeOutputEngine` orchestrator.
  - Modify `src/lib/strike/StrikeOutputEngine.ts`: before template generation, call `ClaudeStrikeEngine.generate(context)` wrapped in `Promise.race` with a 5-second timeout
  - If Claude succeeds, call `StrikeValidator.validate(output)`; if valid, set `generatedBy = 'claude-engine'` and proceed to persist
  - If validation fails, log failures, set `generatedBy = 'template-fallback'`, invoke existing template path
  - If Claude throws or times out, log error details, set `generatedBy = 'template-fallback'`, invoke existing template path
  - Pass `generatedBy` to `InstrumentArchive.save()` for Supabase persistence
  - **References:** Requirement 6.3–6.8, Design §Claude Fallback Strategy
  - **Depends on:** 6, 11, 12

- [x] 14. Agent Types and Tools
  Implement the shared agent types and all 8 AI tool definitions.
  - Create `src/lib/agent/types.ts`: `LoopEvaluationSummary`, `WebhookAlertPayload` interfaces
  - Create `src/lib/agent/tools.ts`: define all 8 Vercel AI SDK `CoreTool` definitions — `getPillar`, `searchPillars`, `getOSModule`, `searchLibrary`, `getIntegrationMap` (read from in-memory store); `getLoopStatus`, `getInstrumentSummary`, `getCapitalAllocationSummary` (read from Supabase via `supabaseClient`)
  - Each tool has a Zod schema for its parameters and an `execute` function
  - Write unit tests in `src/lib/agent/__tests__/tools.test.ts`: each tool with valid input, each tool with invalid input, tools returning null for missing data
  - Write property test `Property 36` in `src/__tests__/properties/property-36.test.ts`
  - **References:** Requirement 3.4–3.5, Requirement 9.4, Design §AI Tool Definitions, Property 36
  - **Depends on:** 3, 10

- [x] 15. ConversationRepository
  Implement the Supabase-backed conversation and message persistence layer.
  - Create `src/lib/agent/ConversationRepository.ts`: implement all 7 methods — `createSession`, `getLatestSession`, `getSession` (with 404/403 disambiguation), `listSessions`, `deleteSession`, `appendMessage`, `getMessages`
  - `getSession(id, userId)` queries with both `id` and `user_id` filters; if row not found, checks if id exists without user_id filter to distinguish `CONVERSATION_NOT_FOUND` (404) from `CONVERSATION_ACCESS_DENIED` (403)
  - All write operations wrapped in `withRetry`
  - Write unit tests in `src/lib/agent/__tests__/ConversationRepository.test.ts`: create session, get latest (none exists), get session wrong user → 403, delete session cascade, append message
  - **References:** Requirement 5, Design §ConversationRepository, Error codes CONVERSATION_NOT_FOUND / CONVERSATION_ACCESS_DENIED
  - **Depends on:** 3

- [x] 16. ChatAgentService
  Implement the service that builds the tool set for the chat route.
  - Create `src/lib/agent/ChatAgentService.ts`: export `buildTools()` returning the 8 tool definitions from `tools.ts` bound to the current in-memory store and Supabase clients
  - **References:** Design §ChatAgentService
  - **Depends on:** 14, 15

- [x] 17. Chat API Route
  Implement the streaming GPT-4o chat API route.
  - Create `src/app/api/agent/chat/route.ts`: POST handler using Vercel AI SDK `streamText` with `@ai-sdk/openai` GPT-4o model
  - Read `conversationId` from request body; if absent, create a new session via `ConversationRepository.createSession`
  - Load conversation history from `ConversationRepository.getMessages(conversationId)` and pass as `messages` to `streamText`
  - Pass tools from `ChatAgentService.buildTools()` to `streamText`
  - On stream completion, persist user message and assistant response (with tool call payloads) via `ConversationRepository.appendMessage`
  - On OpenAI error, return `{ error: { code: 'AGENT_STREAM_ERROR', message: ... } }` with status 500
  - Route is protected by existing clearance gate middleware (401 for unauthenticated)
  - Write integration tests in `src/app/api/agent/chat/__tests__/route.test.ts`: authenticated request streams response, unauthenticated returns 401, tool invocation executes service call, OpenAI error returns AGENT_STREAM_ERROR
  - **References:** Requirement 3.1–3.11, Design §Chat API Route, Error code AGENT_STREAM_ERROR
  - **Depends on:** 15, 16

- [x] 18. Conversation History API Routes
  Implement the GET and DELETE conversation management routes.
  - Create `src/app/api/agent/conversations/route.ts`: GET handler returns all sessions for authenticated user ordered by `updated_at` descending (max 50 results)
  - Create `src/app/api/agent/conversations/[id]/route.ts`: GET handler returns session + messages ordered by `created_at` ascending; DELETE handler removes session (cascade deletes messages)
  - All routes return errors in `{ error: { code, message } }` envelope
  - 403 for cross-user access, 404 for missing session, 401 for unauthenticated
  - Write integration tests in `src/app/api/agent/conversations/__tests__/route.test.ts`: GET returns sessions ordered by updated_at, DELETE removes session and messages, GET [id] returns messages in order, GET [id] wrong user returns 403
  - **References:** Requirement 5.1–5.6, Design §Conversation History Routes
  - **Depends on:** 15

- [x] 19. ChatWidget Component
  Implement the streaming AI chat widget client component.
  - Create `src/components/ui/ChatWidget.tsx` with `'use client'` directive
  - Accept `initialConversationId?: string` prop
  - Use Vercel AI SDK `useChat` hook with `api: '/api/agent/chat'` and `body: { conversationId }`
  - Render message list (user messages right-aligned, assistant messages left-aligned) with streaming token display
  - Show loading indicator while `isLoading` is true
  - On error, display error message and clear loading state (never leave UI in loading state)
  - Include a text input and submit button; support Enter key to submit
  - Responsive layout (375px–2560px)
  - **References:** Requirement 3.1–3.9, Design §ChatWidget Component Contract
  - **Depends on:** 17

- [x] 20. Dashboard Integration
  Mount the ChatWidget in the protected dashboard page.
  - Modify `src/app/(protected)/dashboard/page.tsx`: fetch the latest conversation ID for the current user (server-side via `ConversationRepository.getLatestSession`) and pass as `initialConversationId` prop to `<ChatWidget>`
  - Position ChatWidget as a collapsible panel or sidebar within the dashboard layout
  - **References:** Requirement 3.1, Design §Dashboard Integration
  - **Depends on:** 15, 19

- [x] 21. BackgroundAgentService
  Implement the autonomous loop evaluation and daily summary service.
  - Create `src/lib/agent/BackgroundAgentService.ts`: implement `evaluateLoops(runAt: Date)`, `generateDailySummary(runAt: Date)`, `dispatchWebhookAlert(loop, triggeredAt)`
  - `evaluateLoops`: iterate all loops from in-memory store; for each loop whose condition is satisfied, query `loop_execution_log` to check for existing trigger within current 15-min UTC window (floor to `floor(minutes/15)*15`); if already triggered, insert skipped record; if not, call `LoopEngine.trigger()` and insert record with `triggered_by: 'background-agent'`; insert run-level summary row at end of every execution
  - `generateDailySummary`: assemble `StructuredContext` with all 36 OS Modules, latest capital allocation, loops triggered in preceding 24 hours (06:00 UTC previous day to 05:59:59 UTC current day); call `StrikeOutputEngine.generate()` with `generatedBy: 'background-agent'`
  - `dispatchWebhookAlert`: POST `WebhookAlertPayload` to `WEBHOOK_ALERT_URL`; if env var not set, log warning and return; if non-2xx response, log failure and return (never throw)
  - Critical loops identified by `loop.critical === true`
  - Write unit tests in `src/lib/agent/__tests__/BackgroundAgentService.test.ts`: no triggers, with triggers, deduplication skip, webhook dispatch success, webhook non-2xx, missing WEBHOOK_ALERT_URL
  - Write property tests `Property 37` and `Property 38` in `src/__tests__/properties/property-37.test.ts` and `property-38.test.ts`
  - **References:** Requirement 4.1–4.13, Design §BackgroundAgentService, Properties 37–38
  - **Depends on:** 5, 13, 14

- [x] 22. Cron API Route
  Implement the Vercel Cron-triggered background agent route.
  - Create `src/app/api/agent/cron/route.ts`: POST handler
  - First action: verify `Authorization: Bearer {CRON_SECRET}` header; return 401 `CRON_UNAUTHORIZED` immediately if absent, malformed, or wrong token
  - Determine run type: if current UTC hour is 6 and minute is 0, call `BackgroundAgentService.generateDailySummary(now)`; otherwise call `BackgroundAgentService.evaluateLoops(now)`
  - Return 200 with `LoopEvaluationSummary` JSON on success
  - Write integration tests in `src/app/api/agent/cron/__tests__/route.test.ts`: valid CRON_SECRET executes evaluation, missing header returns 401, invalid header returns 401, loop trigger inserts to Supabase
  - **References:** Requirement 4.1, 4.5, 4.12–4.13, Design §Cron Authorization, Error code CRON_UNAUTHORIZED
  - **Depends on:** 21

- [x] 23. Vercel Configuration and Deployment Files
  Create `vercel.json`, update `.env.example`, remove `netlify.toml`, and write deployment docs.
  - Create `vercel.json` at repository root with `crons` array: `{ path: '/api/agent/cron', schedule: '*/15 * * * *' }` and `{ path: '/api/agent/cron', schedule: '0 6 * * *' }`; set `regions: ['iad1']`
  - Update `.env.example`: add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `WEBHOOK_ALERT_URL` (optional); each variable has an inline comment with purpose, expected format, and where to obtain it
  - Delete `netlify.toml` from repository root
  - Create `/docs/deployment.md` with step-by-step guide: create Supabase project, run migration SQL, copy env vars, import to Vercel, set env vars, deploy, verify cron jobs in Vercel dashboard
  - **References:** Requirement 8.1–8.8, Design §Deployment Guide Reference
  - **Depends on:** 2

- [x] 24. Property Tests P35, P41, P42
  Write the remaining property-based tests for Supabase retry, instrument ID uniqueness, and audit log immutability.
  - Write property test `Property 35` in `src/__tests__/properties/property-35.test.ts`: `withRetry` invokes operation exactly 3 times on total failure; delay before first retry ≥ 500ms; delay before second retry ≥ 1000ms; error propagated after all retries
  - Write property test `Property 41` in `src/__tests__/properties/property-41.test.ts`: sequential instrument IDs within a year increment NNN by 1; year boundary resets NNN to 001; no two instruments in same year share NNN (mock Supabase client)
  - Write property test `Property 42` in `src/__tests__/properties/property-42.test.ts`: all previously inserted audit log rows remain byte-for-byte identical after subsequent inserts; no UPDATE or DELETE issued against audit_log (mock Supabase client)
  - All tests tagged `// Feature: imperial-codex-ai-agent, Property N:`
  - **References:** Design §Correctness Properties, Properties 35, 41, 42
  - **Depends on:** 3, 4, 6

- [x] 25. Build Verification and Final Checks
  Verify the complete application builds and all tests pass after the AI agent additions.
  - Run `npm run build` — confirm zero TypeScript errors and zero build warnings
  - Run `npm test` — confirm all unit, property-based, and integration tests pass (including all v16 tests P1–P34 and new tests P35–P42)
  - Verify all 8 new property tests (P35–P42) are present and tagged with `// Feature: imperial-codex-ai-agent, Property N:`
  - Confirm existing API routes (`/api/pillars`, `/api/os-modules`, `/api/library`, `/api/integrations`, `/api/loops`) return correct responses with mocked Supabase
  - Confirm `/api/agent/cron` returns 401 when called without `CRON_SECRET`
  - Confirm `/api/agent/chat` returns 401 when called without a valid session
  - **References:** All requirements, Design §Testing Strategy, Requirement 9
  - **Depends on:** 9, 13, 17, 18, 19, 20, 22, 23, 24
