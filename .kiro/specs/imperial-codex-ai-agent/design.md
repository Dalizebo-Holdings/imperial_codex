# Design Document

## Imperial Codex AI Agent — Supabase Migration, AI Chat Assistant, Autonomous Background Agent, AI-Powered Strike Output Engine, and Vercel Deployment

---

## Overview

This document describes the technical design for extending Imperial Codex v16 with five interconnected capabilities: a Supabase PostgreSQL persistence layer replacing all filesystem stores, a streaming GPT-4o AI Chat Assistant embedded in the dashboard, an autonomous GPT-4o Background Agent driven by Vercel Cron, an Anthropic Claude-powered Strike Output Engine with structural validation, and a complete Vercel deployment configuration.

The existing in-memory store (Pillars, OS Modules, Library — loaded from Markdown at startup) is preserved unchanged. All new persistence operations target Supabase exclusively. The design extends the v16 architecture without breaking any existing API routes, middleware, or service contracts.

### Design Goals

- **Durable persistence**: Replace append-only JSONL/JSON filesystem stores with Supabase PostgreSQL tables, enabling cross-instance consistency on Vercel's serverless runtime.
- **Conversational intelligence**: Embed a streaming GPT-4o chat widget that can query all Codex data through typed AI tools, with full conversation history persisted to Supabase.
- **Autonomous operation**: A Vercel Cron-driven background agent evaluates all 104 Recursive Loops every 15 minutes, deduplicates within the current UTC window, and generates a daily Strike Output summary at 06:00 UTC.
- **AI-quality Strike Outputs**: Replace template-based generation with Claude-3.5-Sonnet reasoning, validated against the 5-Part Strike Hierarchy structure, with template fallback on API failure.
- **Zero breaking changes**: All existing routes, middleware, session management, and in-memory store behaviour remain identical after the migration.

### Key Technology Decisions

- **`@supabase/supabase-js`**: Official Supabase client. Singleton pattern with two instances — anon key for standard operations, service role key for vault and cron agent writes that bypass RLS.
- **`ai` (Vercel AI SDK)**: Provides `streamText` for the chat route and `generateText` for the background agent. Tool-use orchestration is handled natively by the SDK, eliminating manual function-call parsing.
- **`@anthropic-ai/sdk`**: Direct Anthropic SDK for Claude calls in the Strike Output Engine. Not routed through the Vercel AI SDK to preserve the 5-second fallback timeout contract.
- **`openai` (via Vercel AI SDK provider)**: GPT-4o accessed through `@ai-sdk/openai` provider, keeping model selection declarative.
- **Exponential back-off**: Base 500 ms, multiplier 2×, cap 5 000 ms, max 2 retries (3 total attempts). Implemented as a generic `withRetry` utility in `src/lib/db/retry.ts`.

---

## Architecture

### Updated High-Level Architecture

```
+------------------------------------------------------------------+
|                        Browser (Client)                          |
|  React 19 Client Components                                      |
|  ChatWidget.tsx (useChat hook, streaming tokens)                 |
|  KaTeX CSS, Fuse.js (search), polling (60s)                      |
+----------------------------+-------------------------------------+
                             | HTTPS
+----------------------------v-------------------------------------+
|                  Next.js 16.2 App Router                         |
|  middleware.ts  (auth gate, clearance check, kernel-halted guard)|
|  /app           (Server Components, layouts)                     |
|  /app/api       (Route Handlers — JSON API + streaming)          |
|    /api/agent/chat/route.ts     (POST — streamText, GPT-4o)      |
|    /api/agent/cron/route.ts     (POST — Vercel Cron, GPT-4o)     |
|    /api/agent/conversations/    (GET, DELETE — history)          |
+----------------------------+-------------------------------------+
                             |
+----------------------------v-------------------------------------+
|                      Service Layer                               |
|  KernelService  PillarService  OSModuleService                   |
|  IntegrationService  LoopEngine  LibraryService                  |
|  StrikeOutputEngine  ClaudeStrikeEngine  StrikeValidator         |
|  InstrumentArchive  ClearanceGate  AuditLog                      |
|  CapitalAllocationService  BackgroundAgentService                |
+----------------------------+-------------------------------------+
                             |
+----------------------------v-------------------------------------+
|                   Repository / Data Layer                        |
|  SupabaseRepository (src/lib/db/supabase.ts)                     |
|    supabaseClient  (anon key — standard ops)                     |
|    supabaseServiceClient  (service role — vault, cron)           |
|  withRetry (src/lib/db/retry.ts — exponential back-off)          |
|  In-memory stores (Pillars, OS Modules, Library — read-only)     |
+----------------------------+-------------------------------------+
                             |
          +------------------+------------------+
          |                                     |
+---------v-----------+             +-----------v-----------+
|  Supabase PostgreSQL|             |  External AI APIs     |
|  audit_log          |             |  OpenAI GPT-4o        |
|  loop_execution_log |             |    (chat + cron)      |
|  instruments        |             |  Anthropic Claude     |
|  instrument_registry|             |    3.5-Sonnet         |
|  capital_allocations|             |    (strike engine)    |
|  capital_alloc_fail |             +-----------+-----------+
|  vault              |                         |
|  agent_conversations|             +-----------v-----------+
|  agent_messages     |             |  Webhook Endpoint     |
+---------------------+             |  (WEBHOOK_ALERT_URL)  |
                                    +-----------------------+
```

### Request Lifecycle — Chat Turn

1. User types a message in `ChatWidget.tsx`. The `useChat` hook POSTs to `/api/agent/chat`.
2. `middleware.ts` verifies the `imperial-session` cookie. Returns 401 if absent/expired.
3. The chat route handler calls `streamText` with the GPT-4o model, the conversation history, and the 8 AI tool definitions.
4. When the model invokes a tool, the Vercel AI SDK executes the corresponding server-side function (reading from the in-memory store or Supabase).
5. The tool result is returned to the model, which continues generation.
6. Tokens stream back to the client via the Response stream. `useChat` renders them as they arrive.
7. On stream completion, the route handler persists the user message and assistant response (including tool call payloads) to `agent_messages` via `SupabaseRepository`.

### Request Lifecycle — Cron Execution

1. Vercel Cron POSTs to `/api/agent/cron` with `Authorization: Bearer {CRON_SECRET}`.
2. The route handler verifies the header. Returns 401 (`CRON_UNAUTHORIZED`) if invalid.
3. `BackgroundAgentService.evaluateLoops()` iterates all 104 loop definitions from the in-memory store.
4. For each loop whose condition is satisfied, the service queries `loop_execution_log` to check for a trigger within the current 15-minute UTC window.
5. Untriggered loops are dispatched to `LoopEngine.trigger()`. Critical loops additionally dispatch a webhook alert.
6. A run-level summary row is inserted into `loop_execution_log`.
7. For the 06:00 UTC daily cron, `BackgroundAgentService.generateDailySummary()` assembles a `StructuredContext` and calls `ClaudeStrikeEngine.generate()`, then persists the result.

### Startup Sequence (unchanged + Supabase init)

```
Next.js cold start
  └─ instrumentation.ts (register() hook)
       ├─ StructuralIntegrityCheck
       ├─ KernelLoader
       ├─ DataLoader (parallel — Pillars, OS Modules, Integrations, Loops, Library)
       ├─ SearchIndexBuilder
       └─ SupabaseRepository.init()   ← NEW: validates env vars, creates clients
```

`SupabaseRepository.init()` validates that `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present. If any are missing, it logs a `SUPABASE_CONFIG_MISSING` warning and the repository enters a degraded state where all write operations return `DB_INSERT_FAILED` immediately (no retries). Read operations from the in-memory store are unaffected.

---

## Components and Interfaces

### Updated Source Directory Layout

New files and directories are marked with `← NEW`. Modified files are marked with `← MOD`.

```
src/
  app/
    (auth)/login/page.tsx
    (protected)/
      layout.tsx
      dashboard/page.tsx                        ← MOD (mounts ChatWidget)
      pillars/page.tsx
      pillars/[code]/page.tsx
      os-modules/page.tsx
      os-modules/[slug]/page.tsx
      library/page.tsx
      library/[id]/page.tsx
      instruments/page.tsx
      instruments/[id]/page.tsx
      capital/page.tsx
      strike/page.tsx
    api/
      auth/login/route.ts
      auth/logout/route.ts
      status/route.ts
      pillars/route.ts
      pillars/[code]/route.ts
      os-modules/route.ts
      os-modules/[slug]/route.ts
      library/route.ts
      library/[id]/route.ts
      integrations/[slug]/route.ts
      loops/route.ts
      strike/route.ts
      instruments/route.ts
      instruments/[id]/route.ts
      capital/route.ts
      agent/
        chat/route.ts                           ← NEW
        cron/route.ts                           ← NEW
        conversations/route.ts                  ← NEW
        conversations/[id]/route.ts             ← NEW
    layout.tsx
    page.tsx
  lib/
    db/                                         ← NEW directory
      supabase.ts                               ← NEW (SupabaseRepository singleton)
      retry.ts                                  ← NEW (withRetry utility)
      types.ts                                  ← NEW (DB row types)
    kernel/KernelLoader.ts, KernelService.ts, types.ts
    pillars/PillarLoader.ts, PillarService.ts, types.ts
    os-modules/OSModuleLoader.ts, OSModuleService.ts, types.ts
    integrations/IntegrationLoader.ts, IntegrationService.ts, types.ts
    loops/LoopLoader.ts, LoopEngine.ts, types.ts
    library/LibraryLoader.ts, LibraryService.ts, types.ts
    strike/
      StrikeOutputEngine.ts                     ← MOD (calls ClaudeStrikeEngine first)
      ClaudeStrikeEngine.ts                     ← NEW
      StrikeValidator.ts                        ← NEW
      types.ts                                  ← MOD (adds generated_by, StructuredContext)
    instruments/
      InstrumentArchive.ts                      ← MOD (writes to Supabase)
      InstrumentIdGenerator.ts                  ← MOD (reads counter from Supabase)
      types.ts                                  ← MOD (adds generated_by)
    security/
      ClearanceGate.ts                          ← MOD (audit log → Supabase)
      VaultRepository.ts                        ← MOD (vault → Supabase)
      AuditLog.ts                               ← MOD (writes to Supabase)
      session.ts, types.ts
    capital/
      CapitalAllocationService.ts               ← MOD (writes to Supabase)
      types.ts
    agent/                                      ← NEW directory
      BackgroundAgentService.ts                 ← NEW
      ChatAgentService.ts                       ← NEW
      ConversationRepository.ts                 ← NEW
      tools.ts                                  ← NEW (8 AI tool definitions)
      types.ts                                  ← NEW
    search/SearchIndex.ts, GlobalSearch.ts
    store/InMemoryStore.ts
    latex/LatexRenderer.ts
  components/ui/
    StatusBadge.tsx, PillarCard.tsx, OSModuleCard.tsx
    LibraryEntryCard.tsx, InstrumentViewer.tsx
    StrikeOutputViewer.tsx, GlobalSearchBar.tsx
    CapitalAllocationForm.tsx, SystemStatusBar.tsx, Navigation.tsx
    ChatWidget.tsx                              ← NEW
  middleware.ts
  instrumentation.ts                            ← MOD (adds SupabaseRepository.init())
supabase/
  migrations/
    20260101000000_initial_schema.sql           ← NEW
docs/
  deployment.md                                 ← NEW
vercel.json                                     ← NEW
.env.example                                    ← MOD (9 variables)
```

### New Service Contracts

```typescript
// SupabaseRepository (src/lib/db/supabase.ts)
export const supabaseClient: SupabaseClient;        // anon key
export const supabaseServiceClient: SupabaseClient; // service role key
export function init(): void;                       // validates env vars at startup

// withRetry (src/lib/db/retry.ts)
async function withRetry<T>(
  operation: () => Promise<T>,
  options?: { baseMs?: number; capMs?: number; maxRetries?: number }
): Promise<T>;
// Defaults: baseMs=500, capMs=5000, maxRetries=2 (3 total attempts)
// Delay formula: min(baseMs * 2^attempt, capMs)

// ClaudeStrikeEngine (src/lib/strike/ClaudeStrikeEngine.ts)
async function generate(context: StructuredContext): Promise<ClaudeStrikeResult>;
// Returns { output: string, generatedBy: 'claude-engine' } on success
// Throws ClaudeApiError on network/timeout/5xx — caller invokes Template_Fallback

// StrikeValidator (src/lib/strike/StrikeValidator.ts)
function validate(output: string): ValidationResult;
// Pure function — no side effects
// interface ValidationResult { valid: boolean; failures: string[] }

// BackgroundAgentService (src/lib/agent/BackgroundAgentService.ts)
async function evaluateLoops(runAt: Date): Promise<LoopEvaluationSummary>;
async function generateDailySummary(runAt: Date): Promise<void>;
async function dispatchWebhookAlert(loop: RecursiveLoop, triggeredAt: Date): Promise<void>;

// ConversationRepository (src/lib/agent/ConversationRepository.ts)
async function createSession(userId: string): Promise<AgentConversation>;
async function getLatestSession(userId: string): Promise<AgentConversation | null>;
async function getSession(id: string, userId: string): Promise<AgentConversation | null>;
async function listSessions(userId: string): Promise<AgentConversation[]>;
async function deleteSession(id: string, userId: string): Promise<void>;
async function appendMessage(message: Omit<AgentMessage, 'id' | 'created_at'>): Promise<AgentMessage>;
async function getMessages(conversationId: string): Promise<AgentMessage[]>;

// ChatAgentService (src/lib/agent/ChatAgentService.ts)
function buildTools(): Record<string, CoreTool>;
// Returns the 8 AI tool definitions bound to in-memory store and Supabase
```

### AI Tool Definitions

All 8 tools are defined in `src/lib/agent/tools.ts` and passed to `streamText` / `generateText` via the `tools` parameter.

```typescript
// Tool signatures (Vercel AI SDK CoreTool format)
getPillar:                  { code: string }           → Pillar | null
searchPillars:              { query: string }           → PillarSearchResult[]
getOSModule:                { slug: string }            → OSModule | null
searchLibrary:              { query: string }           → LibrarySearchResult[]
getIntegrationMap:          { slug: string }            → IntegrationMap
getLoopStatus:              { loopId: string }          → LoopExecutionRecord | null
getInstrumentSummary:       { year: number }            → InstrumentRegistryEntry[]
getCapitalAllocationSummary: {}                         → AllocationRecord | null
```

`getPillar`, `searchPillars`, `getOSModule`, `searchLibrary`, and `getIntegrationMap` read exclusively from the in-memory store. `getLoopStatus` queries `loop_execution_log` via `supabaseClient`. `getInstrumentSummary` queries `instrument_registry` via `supabaseClient`. `getCapitalAllocationSummary` queries `capital_allocations` via `supabaseClient`.

### ChatWidget Component Contract

```typescript
// src/components/ui/ChatWidget.tsx
// Client component — 'use client' directive required

interface ChatWidgetProps {
  initialConversationId?: string; // loaded from server on dashboard render
}

// Uses Vercel AI SDK useChat hook:
const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  api: '/api/agent/chat',
  body: { conversationId },
  onError: (err) => setErrorMessage(err.message),
});
```

---

## Data Models

### Supabase Schema — New TypeScript Row Types

These types mirror the PostgreSQL column definitions exactly and live in `src/lib/db/types.ts`.

```typescript
// audit_log
export interface AuditLogRow {
  id: string;                  // UUID, gen_random_uuid()
  user_id: string;
  resource: string;
  clearance_level: number;
  decision: string;            // 'granted' | 'denied'
  timestamp: string;           // timestamptz → ISO 8601
  details: Record<string, unknown> | null; // jsonb
}

// loop_execution_log
export interface LoopExecutionLogRow {
  id: string;                  // UUID
  loop_id: string;
  triggered_at: string;        // timestamptz → ISO 8601
  condition_matched: string | null;
  target_slug: string | null;
  output_action: string | null;
  outcome: string | null;
  triggered_by: string | null; // 'user' | 'background-agent' | 'background-agent-skipped'
}

// instruments
export interface InstrumentRow {
  id: string;                  // DH-RES-YYYY-NNN
  title: string;
  issuing_authority: string;
  content: string;
  generated_at: string;        // timestamptz → ISO 8601
  status: string;              // 'active' | 'archived'
  generated_by: string;        // 'claude-engine' | 'template-fallback' | 'background-agent'
}

// instrument_registry
export interface InstrumentRegistryRow {
  id: string;                  // DH-RES-YYYY-NNN
  title: string;
  issuing_authority: string;
  generated_at: string;        // timestamptz → ISO 8601
  status: string;
  year: number;                // generated always as EXTRACT(YEAR FROM generated_at) stored
}

// capital_allocations
export interface CapitalAllocationRow {
  id: string;                  // UUID
  growth_pct: number;
  operational_pct: number;
  reserve_pct: number;
  approved_by: string;
  os_module_slug: string;
  approved_at: string;         // timestamptz → ISO 8601
}

// capital_allocation_failures
export interface CapitalAllocationFailureRow {
  id: string;                  // UUID
  submitted_by: string | null;
  submitted_at: string;        // timestamptz → ISO 8601
  payload: Record<string, unknown>;    // jsonb
  validation_errors: Record<string, unknown>; // jsonb
}

// vault (single-row table, id always = 1)
export interface VaultRow {
  id: 1;
  encrypted_envelope: string;  // base64 AES-256-GCM envelope
  updated_at: string;          // timestamptz → ISO 8601
}

// agent_conversations
export interface AgentConversation {
  id: string;                  // UUID
  user_id: string;
  title: string | null;
  created_at: string;          // timestamptz → ISO 8601
  updated_at: string;          // timestamptz → ISO 8601
}

// agent_messages
export interface AgentMessage {
  id: string;                  // UUID
  conversation_id: string;     // UUID → agent_conversations.id
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls: Record<string, unknown> | null; // jsonb
  created_at: string;          // timestamptz → ISO 8601
}
```

### Updated Strike Output Types

```typescript
// src/lib/strike/types.ts additions

export type StrikeGeneratedBy =
  | 'claude-engine'
  | 'template-fallback'
  | 'background-agent';

// Extended StrikeOutput (adds generated_by)
export interface StrikeOutput {
  id?: string;
  title: string;
  sections: [StrikeSection, StrikeSection, StrikeSection, StrikeSection, StrikeSection];
  generatedAt: string;
  requestedBy: string;
  generatedBy: StrikeGeneratedBy;  // ← NEW
}

// Structured context passed to Claude
export interface StructuredContext {
  intent: string;              // user query or background agent directive
  pillars: Pillar[];           // top-5 by search relevance
  osModules: OSModule[];       // top-3 by search relevance
  libraryEntries: LibraryEntry[]; // top-3 by search relevance (bodies truncated to 500 chars if needed)
  latestAllocation: AllocationRecord | null;
  recentLoopTriggers?: LoopExecutionLogRow[]; // for daily summary only
}

// Claude engine result
export interface ClaudeStrikeResult {
  output: string;
  generatedBy: 'claude-engine';
}

// Validation result (pure function output)
export interface ValidationResult {
  valid: boolean;
  failures: string[];
}
```

### Updated Instrument Registry Entry

```typescript
// src/lib/instruments/types.ts — extended
export interface InstrumentRegistryEntry {
  id: string;                  // DH-RES-YYYY-NNN
  title: string;
  issuingAuthority: string;
  generatedAt: string;         // ISO 8601 UTC
  status: string;
  generatedBy: StrikeGeneratedBy; // ← NEW (replaces filePath for Supabase-backed entries)
}
```

### Agent Types

```typescript
// src/lib/agent/types.ts

export interface LoopEvaluationSummary {
  runAt: string;               // ISO 8601 UTC
  totalEvaluated: number;
  triggered: number;
  skipped: number;
  errors: number;
}

export interface WebhookAlertPayload {
  loopId: string;
  loopTitle: string;
  triggeredAt: string;         // ISO 8601 UTC
  targetSlug: string;
  outputAction: string;
  severity: 'critical';
}
```

### Retry Utility

```typescript
// src/lib/db/retry.ts

interface RetryOptions {
  baseMs?: number;    // default: 500
  capMs?: number;     // default: 5000
  maxRetries?: number; // default: 2 (3 total attempts)
}

// Delay for attempt n (0-indexed): min(baseMs * 2^n, capMs)
// Attempt 0 (first retry): min(500 * 1, 5000) = 500ms
// Attempt 1 (second retry): min(500 * 2, 5000) = 1000ms
async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T>;
```

### Supabase Migration SQL

The migration file at `/supabase/migrations/20260101000000_initial_schema.sql` creates all tables in dependency order (no foreign key cycles), enables RLS on `vault`, and applies the service-role-only policy.

Key structural decisions:
- `instrument_registry.year` is a generated column (`EXTRACT(YEAR FROM generated_at) stored`) — no application-level year calculation needed.
- `vault` has a `CHECK (id = 1)` constraint enforcing the single-row invariant at the database level.
- `agent_messages.conversation_id` has `ON DELETE CASCADE` so deleting a conversation atomically removes all its messages.
- `agent_messages.role` has a `CHECK (role IN ('user', 'assistant', 'tool'))` constraint.
- RLS on `vault` is enabled before the policy is applied (Requirement 1.11).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

*Properties P1–P34 are defined in the Imperial Codex v16 design document. The following properties continue that numbering.*

### Property 35: Supabase Retry Exponential Back-Off

For any Supabase write operation that fails on every attempt, the `withRetry` utility SHALL invoke the operation exactly 3 times total (1 initial attempt + 2 retries), and the delay before the first retry SHALL be at least 500 ms and at most 5 000 ms, and the delay before the second retry SHALL be at least 1 000 ms and at most 5 000 ms. After all retries are exhausted, the utility SHALL propagate the error rather than silently discarding it.

**Validates: Requirements 2.8**

### Property 36: AI Tool Invocation Correctness

For any valid input to any of the 8 AI tools (`getPillar`, `searchPillars`, `getOSModule`, `searchLibrary`, `getIntegrationMap`, `getLoopStatus`, `getInstrumentSummary`, `getCapitalAllocationSummary`), the tool's return value SHALL be identical to the value returned by the corresponding service method called directly with the same input. No tool may return data that differs from what the underlying service would return for the same query.

**Validates: Requirements 3.4, 3.5, 9.4**

### Property 37: Background Agent Loop Deduplication

For any Recursive Loop and any 15-minute UTC window, if a `loop_execution_log` row exists for that loop with a `triggered_at` timestamp falling within the same 15-minute window, the Background Agent SHALL NOT invoke `LoopEngine.trigger()` for that loop again within the same window. The deduplication check SHALL be based on the UTC floor of the current time to the nearest 15-minute boundary (i.e., `floor(minutes / 15) * 15`), not on a rolling 15-minute interval.

**Validates: Requirements 4.3**

### Property 38: Webhook Alert Payload Structural Completeness

For any Critical Loop triggered by the Background Agent, the assembled `WebhookAlertPayload` object SHALL contain all six required fields — `loopId` (non-empty string), `loopTitle` (non-empty string), `triggeredAt` (valid ISO 8601 UTC string), `targetSlug` (non-empty string), `outputAction` (non-empty string), and `severity` (exactly the string `'critical'`) — and SHALL contain no additional fields beyond these six.

**Validates: Requirements 4.9**

### Property 39: Strike Output Structural Validation Correctness

For any string passed to `StrikeValidator.validate()`, the function SHALL return `{ valid: true, failures: [] }` if and only if the string contains exactly five `##`-level headings in the exact order `Executive Analysis`, `OS Stress Test`, `The Imperial Instrument`, `Action Plan (T-Minus 24 Hours)`, `The Ritual`, AND each section body contains at least 50 characters of non-whitespace content. For any string that violates any of these three conditions (wrong section count, wrong labels or order, insufficient body length), the function SHALL return `{ valid: false, failures: [...] }` where `failures` identifies every failing check by name. The function SHALL be pure — identical inputs always produce identical outputs with no side effects.

**Validates: Requirements 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 40: Claude Context Token Cap Enforcement

For any `StructuredContext` assembly where the combined token estimate of all Library entry bodies would cause the total context to exceed 100 000 tokens, every Library entry body in the assembled context SHALL be truncated to at most 500 characters. For any `StructuredContext` assembly where the total token estimate is at or below 100 000 tokens without truncation, Library entry bodies SHALL be included at their full length. The truncation decision SHALL be made per-assembly and SHALL be deterministic given the same input entries.

**Validates: Requirements 6.10**

### Property 41: Instrument Identifier Sequential Uniqueness (Supabase-Backed)

For any sequence of Instrument generations persisted to the Supabase `instruments` table within a single calendar year, each assigned identifier SHALL match the pattern `DH-RES-YYYY-NNN` where `YYYY` is the four-digit calendar year of `generated_at`, `NNN` increments by exactly 1 from the previous instrument in that year (starting at `001`), and no two rows in the `instruments` table for the same year share the same `NNN` value. At the start of a new calendar year, `NNN` SHALL reset to `001`. This property extends Property 23 to the Supabase persistence layer.

**Validates: Requirements 2.3, 6.7 (instrument persistence)**

### Property 42: Audit Log Immutability in Supabase

For any sequence of audit log INSERT operations into the Supabase `audit_log` table, all previously inserted rows SHALL remain byte-for-byte identical (same `id`, `user_id`, `resource`, `clearance_level`, `decision`, `timestamp`, `details`) after each subsequent INSERT. No UPDATE or DELETE operation SHALL be issued against the `audit_log` table by any application code path. This property extends Property 28 to the Supabase persistence layer.

**Validates: Requirements 2.1, 7.6 (audit log immutability)**

---

## Error Handling

### New Error Codes

The following codes extend the v16 Error Code Registry. All new routes return errors in the existing `{ error: { code, message, details? } }` envelope.

| Code | HTTP | Trigger |
|------|------|---------|
| `DB_QUERY_FAILED` | 500 | Supabase SELECT operation failed after all retries |
| `DB_INSERT_FAILED` | 500 | Supabase INSERT operation failed after all retries |
| `AGENT_STREAM_ERROR` | 500 | OpenAI streaming API returned an error during chat turn |
| `CLAUDE_API_UNAVAILABLE` | 503 | Anthropic API unreachable or returned 5xx; Template_Fallback was invoked |
| `CLAUDE_VALIDATION_FAILED` | 422 | Claude response failed Strike_Validation; Template_Fallback was invoked |
| `CONVERSATION_NOT_FOUND` | 404 | Requested `agent_conversations` row does not exist |
| `CONVERSATION_ACCESS_DENIED` | 403 | Requested conversation belongs to a different `user_id` |
| `CRON_UNAUTHORIZED` | 401 | `/api/agent/cron` called without valid `CRON_SECRET` |
| `WEBHOOK_DISPATCH_FAILED` | n/a (log only) | Webhook endpoint returned non-2xx; cron execution continues |
| `SUPABASE_CONFIG_MISSING` | n/a (startup log) | Required Supabase env vars absent at startup |

### Retry Strategy

All Supabase write operations are wrapped in `withRetry`. The retry logic is:

```
Attempt 1 (immediate)
  → on failure: wait min(500ms × 2^0, 5000ms) = 500ms
Attempt 2 (first retry)
  → on failure: wait min(500ms × 2^1, 5000ms) = 1000ms
Attempt 3 (second retry)
  → on failure: throw error → caller returns DB_INSERT_FAILED or DB_QUERY_FAILED
```

Read operations (`SELECT`) are also retried using the same utility. The `withRetry` function is generic and accepts any `() => Promise<T>` operation.

### Claude Fallback Strategy

The `StrikeOutputEngine` orchestrator wraps the Claude call in a `Promise.race` with a 5-second timeout:

```typescript
const claudeResult = await Promise.race([
  claudeStrikeEngine.generate(context),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('CLAUDE_TIMEOUT')), 5000)
  ),
]);
```

If the race rejects (timeout, network error, or 5xx), the engine immediately invokes the template-based fallback and sets `generatedBy = 'template-fallback'`. The error is logged with full details but does not propagate to the caller — the caller always receives a valid `StrikeOutput`.

If Claude returns a response but `StrikeValidator.validate()` returns `{ valid: false }`, the engine discards the Claude output, logs the validation failures, sets `generatedBy = 'template-fallback'`, and invokes the template path.

### Cron Authorization

The `/api/agent/cron` route handler performs authorization before any other logic:

```typescript
const authHeader = request.headers.get('Authorization');
const expected = `Bearer ${process.env.CRON_SECRET}`;
if (!authHeader || authHeader !== expected) {
  return Response.json(
    { error: { code: 'CRON_UNAUTHORIZED', message: 'Invalid or missing CRON_SECRET' } },
    { status: 401 }
  );
}
```

This check runs before the clearance gate middleware to avoid session cookie overhead on cron requests.

### Webhook Dispatch Error Isolation

Webhook dispatch failures are fully isolated from the cron execution loop:

```typescript
try {
  await dispatchWebhookAlert(loop, triggeredAt);
} catch (err) {
  console.error('[BackgroundAgent] WEBHOOK_DISPATCH_FAILED', { loopId: loop.id, err });
  // execution continues — no re-throw
}
```

If `WEBHOOK_ALERT_URL` is not set, the dispatch function returns immediately without making any HTTP request and logs a single warning at startup.

### Conversation Access Control

`ConversationRepository.getSession(id, userId)` always includes the `user_id` filter in the Supabase query:

```typescript
const { data, error } = await supabaseClient
  .from('agent_conversations')
  .select('*')
  .eq('id', id)
  .eq('user_id', userId)
  .single();

if (error?.code === 'PGRST116') {
  // Row not found — could be wrong ID or wrong user
  // Check if the row exists at all to distinguish 404 from 403
  const { data: exists } = await supabaseClient
    .from('agent_conversations')
    .select('id')
    .eq('id', id)
    .single();
  if (exists) throw new ConversationAccessDeniedError();
  throw new ConversationNotFoundError();
}
```

---

## Testing Strategy

### Overview

The testing strategy extends the v16 dual approach (property-based + unit/integration) with new property tests for Properties 35–42 and new integration tests for all Supabase-backed operations and AI routes.

### Property-Based Testing

**Library**: `fast-check` (already installed as a dev dependency).

**Configuration**: Minimum 100 iterations per property test. Tests tagged with the feature and property number.

**Tag format**: `// Feature: imperial-codex-ai-agent, Property N: <property title>`

**New property test files** (under `src/__tests__/properties/`):

| File | Property | Key Generators |
|------|----------|----------------|
| `property-35.test.ts` | Retry back-off | `fc.integer({ min: 1, max: 3 })` for failure counts; mock timers for delay measurement |
| `property-36.test.ts` | AI tool correctness | `fc.constantFrom(...CANONICAL_SLUGS)` for slugs; `fc.integer({ min: 1, max: 207 })` for Pillar codes; `fc.string()` for queries |
| `property-37.test.ts` | Loop deduplication | `fc.string()` for loop IDs; `fc.date()` for trigger timestamps; mock Supabase client |
| `property-38.test.ts` | Webhook payload structure | `fc.record({ id: fc.string(), name: fc.string(), ... })` for loop definitions |
| `property-39.test.ts` | Strike validation correctness | `fc.string()` for arbitrary outputs; `fc.array(fc.string())` for section bodies |
| `property-40.test.ts` | Token cap enforcement | `fc.array(fc.record({ body: fc.string() }))` for Library entries with varying body lengths |
| `property-41.test.ts` | Instrument ID sequential uniqueness (Supabase) | `fc.integer({ min: 1, max: 50 })` for generation counts; mock Supabase client |
| `property-42.test.ts` | Audit log immutability (Supabase) | `fc.array(fc.record({ ... }))` for audit log entry sequences; mock Supabase client |

**Key implementation notes for property tests**:

- **Property 35**: Use `jest.useFakeTimers()` to control time. Mock the Supabase operation to always reject. Assert `mockFn.mock.calls.length === 3` and verify the delay arguments passed to `setTimeout`.
- **Property 36**: Bind tools to a test in-memory store populated with known data. For each tool, generate valid inputs and assert the tool result deep-equals the direct service call result.
- **Property 37**: Mock `supabaseClient.from('loop_execution_log').select()` to return a configurable set of existing records. Assert that `LoopEngine.trigger` is called 0 times for loops already in the window and 1 time for loops not in the window.
- **Property 39**: The `StrikeValidator` is a pure function — no mocking needed. Generate strings with varying section counts, labels, and body lengths. Assert the `valid` field and `failures` array match expectations.
- **Property 40**: Mock the token counting function. Generate Library entry arrays where some bodies exceed 500 chars. Assert all bodies in the assembled context are ≤ 500 chars when the total would exceed 100k tokens.

### Unit Tests

**New unit test files**:

| File | Coverage |
|------|----------|
| `src/lib/db/__tests__/retry.test.ts` | `withRetry`: success on first attempt, success on second attempt, success on third attempt, failure after all retries, delay timing |
| `src/lib/strike/__tests__/StrikeValidator.test.ts` | All five section labels present and correct, wrong label, wrong order, missing section, body too short, body exactly 50 chars (boundary), body 49 chars (boundary) |
| `src/lib/strike/__tests__/ClaudeStrikeEngine.test.ts` | Successful generation, API timeout (5s), network error, 5xx response, validation pass, validation fail → fallback |
| `src/lib/agent/__tests__/BackgroundAgentService.test.ts` | Loop evaluation with no triggers, loop evaluation with triggers, deduplication skip, webhook dispatch success, webhook dispatch failure (non-2xx), missing WEBHOOK_ALERT_URL |
| `src/lib/agent/__tests__/ConversationRepository.test.ts` | Create session, get latest session (none exists), get session (wrong user → 403), delete session (cascade), append message |
| `src/lib/agent/__tests__/tools.test.ts` | Each of the 8 tools with valid input, each tool with invalid input (null/undefined), tool returning null for missing data |

### Integration Tests

**Framework**: Jest with mocked Supabase client (`jest.mock('@supabase/supabase-js')`). Real in-memory store populated from test fixtures.

**New integration test files**:

| File | Coverage |
|------|----------|
| `src/app/api/agent/chat/__tests__/route.test.ts` | Authenticated request streams response, unauthenticated returns 401, tool invocation executes service call, OpenAI error returns `AGENT_STREAM_ERROR` |
| `src/app/api/agent/cron/__tests__/route.test.ts` | Valid CRON_SECRET executes evaluation, missing header returns 401, invalid header returns 401, loop trigger inserts to Supabase |
| `src/app/api/agent/conversations/__tests__/route.test.ts` | GET returns sessions ordered by updated_at, DELETE removes session and messages, GET [id] returns messages in order, GET [id] wrong user returns 403 |
| `src/lib/security/__tests__/AuditLog.supabase.test.ts` | Insert audit log row, verify existing rows unchanged after subsequent inserts |
| `src/lib/instruments/__tests__/InstrumentArchive.supabase.test.ts` | Save instrument inserts to both tables, ID generation increments correctly, year boundary resets NNN |

### Backward Compatibility Tests

The existing test suite (`src/__tests__/properties/property-01.test.ts` through `property-06.test.ts` and all unit tests) MUST continue to pass without modification after the Supabase migration. No existing test file may be altered as part of this feature implementation.

### Test Coverage Targets

| Area | Target |
|------|--------|
| `src/lib/db/retry.ts` | 100% branch coverage |
| `src/lib/strike/StrikeValidator.ts` | 100% branch coverage (pure function) |
| `src/lib/strike/ClaudeStrikeEngine.ts` | 90% line coverage |
| `src/lib/agent/BackgroundAgentService.ts` | 85% line coverage |
| `src/lib/agent/ConversationRepository.ts` | 90% line coverage |
| New API routes | 80% line coverage |

---

## Deployment Guide Reference

Full step-by-step instructions are in `/docs/deployment.md`. The summary below covers the critical path.

### Environment Variables

The `.env.example` file documents all 9 required variables:

| Variable | Purpose | Format |
|----------|---------|--------|
| `OPENAI_API_KEY` | GPT-4o for chat and background agent | `sk-...` |
| `ANTHROPIC_API_KEY` | Claude 3.5 Sonnet for Strike Output Engine | `sk-ant-...` |
| `SUPABASE_URL` | Supabase project URL | `https://<project>.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous (public) key | JWT string |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | JWT string |
| `VAULT_ENCRYPTION_KEY` | AES-256-GCM vault key (carried over from v16) | 64-char hex |
| `SESSION_SECRET` | iron-session cookie encryption secret | 32+ char string |
| `CRON_SECRET` | Vercel Cron authorization token | Any secure random string |
| `WEBHOOK_ALERT_URL` | Webhook endpoint for critical loop alerts (optional) | HTTPS URL |

### Vercel Deployment Steps

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migration: `supabase db push` or paste `/supabase/migrations/20260101000000_initial_schema.sql` into the Supabase SQL editor.
3. Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project settings.
4. Import the repository to Vercel. Set all 9 environment variables in the Vercel project settings.
5. Deploy. Vercel will automatically pick up the cron configuration from `vercel.json`.
6. Verify cron jobs appear in the Vercel dashboard under the "Cron Jobs" tab.
7. Remove `netlify.toml` from the repository root before the first production deploy.

### vercel.json Structure

```json
{
  "crons": [
    {
      "path": "/api/agent/cron",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/agent/cron",
      "schedule": "0 6 * * *"
    }
  ],
  "regions": ["iad1"]
}
```

The `iad1` region (US East, Northern Virginia) is selected to minimise latency to Supabase's default AWS `us-east-1` region.

### Removing Netlify

Delete `netlify.toml` from the repository root. No other Netlify-specific configuration exists in the codebase.

---

## Dependencies

### New Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.49.0` | Supabase PostgreSQL client |
| `ai` | `^4.3.0` | Vercel AI SDK — `streamText`, `generateText`, tool orchestration |
| `@ai-sdk/openai` | `^1.3.0` | OpenAI provider for Vercel AI SDK |
| `@anthropic-ai/sdk` | `^0.39.0` | Anthropic Claude SDK for Strike Output Engine |

### No New Dev Dependencies

All testing infrastructure (`fast-check`, `jest`, `ts-jest`) is already installed. No additional dev dependencies are required.

### Dependency Constraints

- `@supabase/supabase-js` must be imported only in server-side code (`src/lib/db/`, `src/app/api/`, `src/lib/agent/`). It must never be imported in client components or `src/components/ui/`.
- `@anthropic-ai/sdk` must be imported only in `src/lib/strike/ClaudeStrikeEngine.ts`. All other code interacts with Claude through the `ClaudeStrikeEngine` interface.
- The `ai` package's `useChat` hook is the only Vercel AI SDK export permitted in client components (`src/components/ui/ChatWidget.tsx`). All other `ai` exports are server-side only.
