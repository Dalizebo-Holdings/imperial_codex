# Design Document

## Imperial Codex v16 — Strategic Operating System for Dalizebo Holdings

---

## Overview

The Imperial Codex is a Next.js 16.2 / React 19 / TypeScript 5 web application that serves as the single source of truth for all operational logic, strategic decisions, capital allocation, and recursive automation across Dalizebo Holdings. It is governed by Kernel v16.2 and built on a multidimensional framework of 207 Strategic Pillars, 36 Integrated Operating Systems (OS_Modules), 277 Integrations, 104 Recursive Loops, and 345 Library Entries. Every output the system produces conforms to the 5-Part Strike Hierarchy. Access to sensitive data is gated by a clearance-level security model.

### Key Design Goals

- **Single source of truth**: All strategic data lives in version-controlled Markdown files under `/core`, `/os-modules`, `/vault`, `/instruments`, and `/rituals`.
- **Server-first rendering**: Next.js App Router with React Server Components handles all data access on the server; the client receives rendered HTML and minimal interactive islands.
- **Zero external database dependency at launch**: All registry data (Pillars, OS_Modules, Integrations, Loops, Library) is loaded from Markdown/JSON files at startup and held in a singleton in-memory store. A database migration path is preserved via the repository layer abstraction.
- **Security by default**: Every route is protected by Next.js Middleware. Sensitive data requires Level 1 clearance. The Vault is AES-256-GCM encrypted at rest.
- **Auditability**: An append-only audit log records every Clearance_Gate event. The Instrument archive provides a permanent record of every Strike_Output.

### Research Summary

**Session management**: `iron-session` (stateless encrypted-cookie sessions, App Router compatible) combined with `jose` for JWT signing provides the 24-hour expiry and session invalidation required by Requirement 7. This avoids a database session store while keeping sessions server-verifiable.

**Full-text search**: `Fuse.js` (fuzzy, zero-dependency, ~5 KB gzipped) is selected for in-memory search across Pillars, OS_Modules, and Library_Entries. It supports weighted field scoring (title > body > tags) and returns relevance scores natively, satisfying the descending-relevance ordering requirements of Requirements 2, 3, 5, and 10.

**LaTeX rendering**: `katex` (server-side rendering capable, no dependencies, print-quality output) is selected for rendering mathematical expressions in Instrument documents. KaTeX can pre-render on the server via `katex.renderToString()`, meaning no raw LaTeX markup reaches the browser (Requirement 11.8).

**Encryption**: Node.js built-in `crypto` module with AES-256-GCM is used for Vault encryption. No third-party crypto dependency is needed. The 32-byte key is supplied via environment variable `VAULT_ENCRYPTION_KEY`.

**Markdown parsing**: `gray-matter` + `remark` parse the Kernel, Pillar, OS_Module, and Library Markdown files at startup. These are well-established, zero-runtime-dependency parsers suitable for server-side use in Next.js.

---

## Architecture

### High-Level Architecture

```
+--------------------------------------------------+
|                  Browser (Client)                |
|  React 19 Client Components (interactive islands)|
|  KaTeX CSS, Fuse.js (search), polling (60s)      |
+------------------+-------------------------------+
                   | HTTPS
+------------------v-------------------------------+
|              Next.js 16.2 App Router             |
|  middleware.ts  (auth gate, clearance check)     |
|  /app           (Server Components, layouts)     |
|  /app/api       (Route Handlers — JSON API)      |
+------------------+-------------------------------+
                   |
+------------------v-------------------------------+
|              Service Layer                       |
|  KernelService  PillarService  OSModuleService   |
|  IntegrationService  LoopEngine  LibraryService  |
|  StrikeOutputEngine  InstrumentArchive           |
|  ClearanceGate  AuditLog  CapitalAllocationSvc   |
+------------------+-------------------------------+
                   |
+------------------v-------------------------------+
|           Repository / Data Layer                |
|  In-memory stores (loaded at startup from files) |
|  FileSystemRepository (instruments, rituals)     |
|  VaultRepository (AES-256-GCM encrypted JSON)    |
|  AuditLogRepository (append-only JSONL file)     |
+------------------+-------------------------------+
                   |
+------------------v-------------------------------+
|           File System (Repository Root)          |
|  /core   /os-modules   /vault                    |
|  /instruments   /rituals                         |
+--------------------------------------------------+
```

### Request Lifecycle

1. Browser sends request to Next.js.
2. `middleware.ts` intercepts every request. It verifies the `iron-session` cookie. If absent or expired, it redirects to `/login`. If present but the route requires Level 1 clearance, it checks the session clearance level and returns 403 if insufficient.
3. The matched App Router page or Route Handler runs as a React Server Component or Edge/Node.js handler.
4. Server Components call Service Layer functions directly (no HTTP round-trip).
5. Route Handlers (`/app/api/**`) are used for client-initiated mutations (login, capital allocation submission, Strike_Output generation) and for the 60-second polling endpoint.
6. Services read from in-memory stores (populated once at startup) or write to the filesystem (instruments, audit log).
7. The rendered HTML (with KaTeX pre-rendered math) is streamed to the browser.

### Startup Sequence

```
Next.js cold start
  └─ instrumentation.ts (register() hook)
       ├─ StructuralIntegrityCheck  → warns on missing dirs/files
       ├─ KernelLoader              → reads /core/KERNEL_V16_MASTER.md
       │    ├─ validates 36 OS_Module slugs
       │    ├─ sets KernelStatus: active | halted
       │    └─ logs version-mismatch warning if needed
       ├─ DataLoader (parallel)
       │    ├─ PillarLoader         → parses /core/PILLARS.md
       │    ├─ OSModuleLoader       → parses /os-modules/*.md
       │    ├─ IntegrationLoader    → parses integration JSON/MD
       │    ├─ LoopLoader           → parses loop definitions
       │    └─ LibraryLoader        → parses /core/LIBRARY.md
       └─ SearchIndexBuilder        → builds Fuse.js indexes
```

All loaders run in parallel after the Kernel is validated. If the Kernel status is `halted`, the DataLoader still runs (so the status UI can display), but all API routes return a 503 with a `kernel-halted` error code.


---

## Components and Interfaces

### Source Directory Layout

```
src/
  app/
    (auth)/login/page.tsx
    (protected)/
      layout.tsx
      dashboard/page.tsx
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
    layout.tsx
    page.tsx
  lib/
    kernel/KernelLoader.ts, KernelService.ts, types.ts
    pillars/PillarLoader.ts, PillarService.ts, types.ts
    os-modules/OSModuleLoader.ts, OSModuleService.ts, types.ts
    integrations/IntegrationLoader.ts, IntegrationService.ts, types.ts
    loops/LoopLoader.ts, LoopEngine.ts, types.ts
    library/LibraryLoader.ts, LibraryService.ts, types.ts
    strike/StrikeOutputEngine.ts, types.ts
    instruments/InstrumentArchive.ts, InstrumentIdGenerator.ts, types.ts
    security/ClearanceGate.ts, VaultRepository.ts, AuditLog.ts, session.ts, types.ts
    capital/CapitalAllocationService.ts, types.ts
    search/SearchIndex.ts, GlobalSearch.ts
    store/InMemoryStore.ts
    latex/LatexRenderer.ts
  components/ui/
    StatusBadge.tsx, PillarCard.tsx, OSModuleCard.tsx
    LibraryEntryCard.tsx, InstrumentViewer.tsx
    StrikeOutputViewer.tsx, GlobalSearchBar.tsx
    CapitalAllocationForm.tsx, SystemStatusBar.tsx, Navigation.tsx
  middleware.ts
  instrumentation.ts
```

### Middleware

`src/middleware.ts` runs on every request. It:
1. Reads the `imperial-session` cookie and decrypts it with `iron-session`.
2. If no valid session: redirects to `/login` (for page routes) or returns 401 JSON (for `/api/*` routes). Appends an audit log entry.
3. If valid session but route is a sensitive-data endpoint and clearance < 1: returns 403 JSON. Appends an audit log entry.
4. If Kernel status is `halted` and route is not `/api/auth/*` or `/api/status`: returns 503 JSON.
5. Otherwise: passes the request through.

The middleware matcher excludes `/_next/static`, `/_next/image`, and `/favicon.ico`.

### Key Service Contracts

```typescript
// KernelService
getState(): KernelState
getStatus(): KernelStatus

// PillarService
getByCode(code: string): Pillar | null
search(query: string): PillarSearchResult[]

// OSModuleService
getBySlug(slug: string): OSModule | null
getAllGrouped(): Record<OSModuleCluster, OSModule[]>

// IntegrationService
getMap(slug: string): IntegrationMap

// LoopEngine
trigger(event: LoopTriggerEvent): Promise<LoopExecutionRecord>

// LibraryService
getById(id: string): LibraryEntry | null
search(query: string): LibrarySearchResult[]
findBySlug(slug: string): LibraryEntry[]

// StrikeOutputEngine
generate(request: StrikeRequest): Promise<StrikeOutput>

// InstrumentArchive
save(instrument: StrikeOutput): Promise<string>
getById(id: string): Promise<StrikeOutput | null>
getByYear(year: number): Promise<InstrumentRegistryEntry[]>

// ClearanceGate
verify(session: SessionData, resource: string, requireLevel1: boolean): GateDecision

// CapitalAllocationService
validate(allocation: CapitalAllocation): AllocationValidationError[]
record(allocation: CapitalAllocation, userId: string, slug: string): Promise<AllocationRecord>

// GlobalSearch
search(query: string): Promise<GlobalSearchResult>
```

---

## Data Models

### In-Memory Store

The InMemoryStore singleton is populated once during startup and is read-only at runtime.

```typescript
interface InMemoryStore {
  kernel: KernelState;
  pillars: Map<string, Pillar>;
  osModules: Map<string, OSModule>;
  integrations: Map<string, Integration>;
  loops: Map<string, RecursiveLoop>;
  library: Map<string, LibraryEntry>;
  pillarSearchIndex: Fuse<Pillar>;
  librarySearchIndex: Fuse<LibraryEntry>;
  osModuleSearchIndex: Fuse<OSModule>;
}
```

### Instrument Registry

Stored as JSON at /instruments/registry.json, append-only at runtime.

```typescript
interface InstrumentRegistryEntry {
  id: string;           // DH-RES-YYYY-NNN
  title: string;
  issuingAuthority: string;
  generatedAt: string;  // ISO 8601 UTC
  status: string;       // active | archived
  filePath: string;
}
```

### Capital Allocation Records

Approved allocations stored as JSON array at /core/CAPITAL_ALLOCATIONS.json. Failed attempts stored at /core/CAPITAL_ALLOCATION_FAILURES.json.

### Audit Log

Stored as JSONL at /vault/AUDIT_LOG.jsonl. Opened in append mode only. Entries older than 90 days are archived to /vault/AUDIT_LOG_ARCHIVE_YYYY.jsonl.

### Vault

/vault/CLEARANCE_CODES.json is AES-256-GCM encrypted. Encryption envelope: { iv, tag, ciphertext } all base64. The 32-byte key comes from VAULT_ENCRYPTION_KEY env var (64-char hex).

### Session

iron-session stores SessionData in an encrypted HTTP-only cookie named imperial-session. maxAge = 86400s (24h). Secret from SESSION_SECRET env var.

### Execution Log

Loop execution records stored as JSONL at /core/LOOP_EXECUTION_LOG.jsonl. Retained 90 days minimum.

---

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system -- essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Kernel Identifier Set Validation

For any set of OS_Module identifier strings parsed from the Kernel configuration file, the validator SHALL accept the set if and only if it contains exactly the 36 canonical slugs (no more, no fewer, no substitutions). For any set that differs from the canonical 36, the validator SHALL return a halted status and a diff listing every missing and every unexpected identifier.

**Validates: Requirements 1.4, 1.5**

### Property 2: Pillar Code Uniqueness and Range

For any collection of Pillar records loaded into the registry, every code SHALL be unique and SHALL fall within the range 001-207 (inclusive, zero-padded). No two Pillars may share the same code.

**Validates: Requirements 2.1**

### Property 3: Pillar Cluster Membership

For any Pillar record in the registry, the Pillar SHALL belong to exactly one of the five canonical clusters: Fiscal Weaponization, Hegemony and Capture, Infrastructure and Physical Dominance, Cognitive Dominance and Succession, or Singularity Laws.

**Validates: Requirements 2.2**

### Property 4: Pillar Lookup Correctness

For any valid Pillar code in the range 001-207, querying the registry by that code SHALL return the Pillar record whose code field matches the query, including all required fields (code, cluster, title, body).

**Validates: Requirements 2.3**

### Property 5: Pillar Search Result Ordering

For any keyword query that returns one or more Pillar records, the results SHALL be ordered such that the relevance score of each result is greater than or equal to the relevance score of the next result (descending order).

**Validates: Requirements 2.4**

### Property 6: Out-of-Range Pillar Code Returns Structured Error

For any integer code outside the range 001-207, querying the Pillar registry SHALL return a structured error response that identifies the submitted code and states it is outside the valid range.

**Validates: Requirements 2.5**

### Property 7: OS_Module Slug Uniqueness and Format

For any collection of OS_Module records loaded into the registry, every slug SHALL be unique and SHALL match the pattern [A-Z][A-Z-]{2,19} (uppercase letters and hyphens, 3-20 characters).

**Validates: Requirements 3.1**

### Property 8: OS_Module Cluster Membership

For any OS_Module record in the registry, the module SHALL belong to exactly one of the four canonical clusters: Architecture of Power, Economic Fortress, Machinery of War, or Influence and Domain.

**Validates: Requirements 3.2**

### Property 9: OS_Module Lookup Correctness

For any valid OS_Module slug, querying the registry by that slug SHALL return the full module record including slug, cluster, description, linkedPillarCodes, and linkedIntegrationIds.

**Validates: Requirements 3.3**

### Property 10: OS_Module Registry Display Order

For any valid set of OS_Module records, the grouped display output SHALL present clusters in the fixed order (Architecture of Power, Economic Fortress, Machinery of War, Influence and Domain) and SHALL order modules within each cluster alphabetically by slug.

**Validates: Requirements 3.4**

### Property 11: Unrecognised OS_Module Slug Returns Structured Error

For any string that is not among the 36 registered OS_Module slugs, requesting that slug SHALL return a structured error response that includes the unrecognised slug.

**Validates: Requirements 3.5**

### Property 12: Integration Record Structural Validity

For any Integration record in the registry, the record SHALL have a non-empty source slug that is one of the 36 registered OS_Module slugs, at least one non-empty target slug each of which is one of the 36 registered slugs, and a non-empty relationship type string.

**Validates: Requirements 4.1**

### Property 13: Integration Map Completeness

For any OS_Module slug, the integration map returned by the service SHALL contain exactly the set of Integration records where that slug appears as the source slug (outbound) and exactly the set where it appears as any target slug (inbound). No record shall be omitted or duplicated.

**Validates: Requirements 4.2**

### Property 14: Recursive Loop Reference Validity

For any Recursive_Loop definition in the registry, the loop SHALL reference at least one slug that is among the 36 registered OS_Module slugs. Any loop that references only unregistered slugs SHALL be flagged with a broken-reference error and skipped.

**Validates: Requirements 4.4, 4.7**

### Property 15: Loop Execution Record Completeness

For any valid trigger event that matches a Recursive_Loop condition, the produced action record SHALL contain all five required fields: loop ID, trigger timestamp (UTC ISO 8601), matched condition string, target OS_Module slug, and output action label.

**Validates: Requirements 4.5**

### Property 16: Library Entry Uniqueness and Tagging

For any collection of Library_Entry records, every entry ID SHALL be unique and every entry SHALL have at least one OS_Module slug tag that is among the 36 registered slugs.

**Validates: Requirements 5.1**

### Property 17: Library Search Result Ordering

For any full-text search query that returns one or more Library_Entry records, the results SHALL be ordered such that the relevance score of each result is greater than or equal to the relevance score of the next result (descending order).

**Validates: Requirements 5.2, 5.3**

### Property 18: Library Entry Lookup Correctness

For any valid Library_Entry ID, querying the registry by that ID SHALL return the full entry record including ID, title, body, and all OS_Module slug tags.

**Validates: Requirements 5.6**

### Property 19: Strike_Output Executive Analysis Library Coverage

For any generated Strike_Output, the Executive Analysis section SHALL contain at least one Library_Entry whose OS_Module slug tags include at least one slug that is also referenced in the Strike_Output. If no such entry exists, the section SHALL contain a placeholder identifying the slugs that were searched.

**Validates: Requirements 5.8, 5.9**

### Property 20: Strike_Output Five-Section Structure

For any generated Strike_Output, the output SHALL contain exactly five sections in the order: Executive Analysis, OS Stress Test, Imperial Instrument, Action Plan, Ritual. No section may be omitted; missing-data sections SHALL be replaced by a placeholder section.

**Validates: Requirements 6.1, 6.8**

### Property 21: Strike_Output Executive Analysis Citation Counts

For any generated Strike_Output, the Executive Analysis section SHALL cite at least five distinct OS_Module slugs and at least one Library_Entry ID within the section body.

**Validates: Requirements 6.2**

### Property 22: OS Stress Test Three-Path Structure

For any generated Strike_Output, the OS Stress Test section SHALL contain exactly three outcome paths labelled Golden Path, Stagnation Path, and Black Swan, each accompanied by a self-correction protocol that names a corrective action and states the trigger condition.

**Validates: Requirements 6.3**

### Property 23: Instrument Identifier Sequential Uniqueness

For any sequence of Instrument generations within a single calendar year, each assigned identifier SHALL match the pattern DH-RES-YYYY-NNN where YYYY is the current year, NNN increments by exactly 1 from the previous instrument in that year (starting at 001), and no two instruments in the same year share the same NNN value. At the start of a new calendar year, NNN resets to 001.

**Validates: Requirements 6.4, 11.1**

### Property 24: Action Plan Three-Strike Structure

For any generated Strike_Output, the Action Plan section SHALL contain exactly three strikes with the labels Extraction (Resource), Citadel (Infrastructure), and Sovereign (Decree).

**Validates: Requirements 6.6**

### Property 25: Ritual Section Completeness

For any generated Strike_Output where all Ritual data is available, The Ritual section SHALL contain a bilingual consecration in both Sepedi and Latin, at least one Grabovoi Code sequence, and a visual sigil reference. If any element is missing, the entire Ritual section SHALL be replaced by a placeholder.

**Validates: Requirements 6.7**

### Property 26: Unauthenticated Request Denial and Audit

For any request that arrives without a valid session credential (absent, malformed, or expired), the Clearance_Gate SHALL deny access and SHALL append an audit log entry containing the user identifier (if available), the requested resource path, and the UTC timestamp.

**Validates: Requirements 7.1**

### Property 27: Insufficient Clearance Returns 403 and Audit

For any request for Sensitive_Data from a user whose session clearance level is below Level 1, the Clearance_Gate SHALL return an HTTP 403 response and SHALL append an audit log entry containing the user identifier, resource path, clearance level presented, and UTC timestamp.

**Validates: Requirements 7.2, 7.3**

### Property 28: Audit Log Immutability

For any sequence of audit log append operations, all previously written entries SHALL remain byte-for-byte identical after each subsequent append. No entry may be modified or deleted.

**Validates: Requirements 7.6**

### Property 29: Session Expiry After 24 Hours

For any session credential issued at time T, the credential SHALL be accepted for requests at time T + 23h59m and SHALL be rejected (treated as unauthenticated) for requests at time T + 24h + 1s.

**Validates: Requirements 7.7**

### Property 30: Capital Allocation Validation Correctness

For any triple of submitted percentages (growth, operational, reserve), the validator SHALL accept the triple if and only if |growth - 40| <= 0.005 AND |operational - 40| <= 0.005 AND |reserve - 20| <= 0.005. For any rejected triple, the structured error SHALL specify the submitted value and the deviation in percentage points for each of the three categories.

**Validates: Requirements 9.2, 9.3**

### Property 31: Approved Allocation Record Completeness

For any capital allocation submission that passes validation, the recorded entry SHALL contain the UTC timestamp of approval, the approving user identifier, and the associated OS_Module slug.

**Validates: Requirements 9.4**

### Property 32: Global Search Result Grouping Order

For any global search query that returns results across multiple entity types, the consolidated result set SHALL present Pillars first, OS_Modules second, and Library_Entries third. No entity type group may appear out of this order.

**Validates: Requirements 10.4**

### Property 33: Instrument Persistence Round-Trip

For any generated Instrument, after the generation completes successfully, querying the Instrument archive by the assigned identifier SHALL return the complete Instrument document with all fields intact.

**Validates: Requirements 11.2**

### Property 34: LaTeX Rendering Completeness

For any string containing LaTeX expressions delimited by $ or $$, the rendered HTML output SHALL contain no raw LaTeX delimiter characters ($ signs surrounding math expressions) and SHALL contain KaTeX-rendered HTML elements in their place.

**Validates: Requirements 11.8**

---

## Error Handling

### Structured Error Response Format

All API Route Handlers return errors in a consistent JSON envelope:

```typescript
interface ErrorResponse {
  error: {
    code: string;       // machine-readable, e.g. "PILLAR_NOT_FOUND"
    message: string;    // human-readable
    details?: unknown;  // optional structured detail
  };
}
```

HTTP status codes follow standard semantics: 400 for validation errors, 401 for unauthenticated, 403 for insufficient clearance, 404 for not-found, 408 for timeout, 503 for service unavailable.

### Error Code Registry

| Code | HTTP | Trigger |
|------|------|---------|
| KERNEL_HALTED | 503 | Any request while kernel status is halted |
| KERNEL_FILE_MISSING | 503 | /core/KERNEL_V16_MASTER.md not found |
| KERNEL_VALIDATION_FAILED | 503 | OS_Module slug set mismatch |
| PILLAR_NOT_FOUND | 404 | Pillar code not in registry |
| PILLAR_CODE_OUT_OF_RANGE | 400 | Code outside 001-207 |
| PILLAR_SEARCH_TIMEOUT | 408 | Search exceeded 1000ms |
| OS_MODULE_NOT_FOUND | 404 | Slug not in registry |
| OS_MODULE_REGISTRY_UNAVAILABLE | 503 | Data source unavailable |
| INTEGRATION_REGISTRY_NOT_LOADED | 503 | Integration store not initialised |
| LOOP_TIMEOUT | 408 | Loop evaluation exceeded 2000ms |
| LOOP_BROKEN_REFERENCE | 422 | Loop references unregistered slug |
| LOOP_FATAL_ERROR | 500 | Unexpected loop evaluation error |
| LIBRARY_NOT_FOUND | 404 | Entry ID not in registry |
| LIBRARY_SEARCH_TIMEOUT | 408 | Search exceeded 1000ms |
| STRIKE_SECTION_MISSING_DATA | 422 | Required section data unavailable |
| INSTRUMENT_PERSIST_FAILED | 500 | Filesystem write failed |
| INSTRUMENT_NOT_FOUND | 404 | Identifier not in registry |
| INSTRUMENT_ARCHIVE_UNAVAILABLE | 503 | Storage layer unavailable |
| INSTRUMENT_QUERY_TIMEOUT | 408 | Archive query exceeded 1000ms |
| UNAUTHENTICATED | 401 | No valid session credential |
| CLEARANCE_DENIED | 403 | Clearance level below Level 1 |
| CAPITAL_ALLOCATION_INVALID | 400 | Allocation deviates beyond tolerance |
| STRUCTURAL_INTEGRITY_WARNING | n/a | Startup log only, not an HTTP error |

### Kernel Halted Guard

A Next.js middleware check runs before every API route. If `KernelService.getStatus() === "halted"`, the middleware returns a 503 with code `KERNEL_HALTED` immediately, without invoking the route handler. The login route (`/api/auth/login`) and the status route (`/api/status`) are exempt from this guard so the UI can display the halted state.

### Timeout Enforcement

All service methods that have SLA requirements use `Promise.race` with a `setTimeout` rejection:

```typescript
async function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject({ code, message: `Operation timed out after ${ms}ms` }), ms)
    ),
  ]);
}
```

### Loop Engine Error Isolation

The LoopEngine processes each loop in an isolated try/catch. A broken-reference error, timeout, or fatal error in one loop does not halt processing of subsequent loops. All errors are logged to the execution log with the appropriate outcome code.

### Instrument Persistence Atomicity

Instrument generation follows a two-phase commit pattern:
1. Reserve the next NNN identifier (atomic counter increment).
2. Write the document file to `/instruments/DH-RES-YYYY-NNN.md`.
3. Append the registry entry to `/instruments/registry.json`.

If step 2 or 3 fails, the reserved identifier is released (counter decremented), the partial file is deleted if it exists, and a structured error is returned. The identifier is never exposed to the caller on failure.

### Vault Decryption Failure

If the Vault cannot be decrypted (wrong key, corrupted file), the Clearance_Gate enters a `vault-error` state. All requests for Sensitive_Data return 503 with code `VAULT_UNAVAILABLE`. The Admin is notified via the system status interface.

---

## Testing Strategy

### Overview

The testing strategy uses a dual approach: property-based tests for universal correctness properties and unit/integration tests for specific examples, edge cases, and infrastructure wiring.

### Property-Based Testing

**Library**: `fast-check` (TypeScript-native, actively maintained, supports arbitrary generators).

**Configuration**: Each property test runs a minimum of 100 iterations. Tests are tagged with a comment referencing the design property they validate.

**Tag format**: `// Feature: imperial-codex-v16, Property N: <property title>`

**Scope**: Properties 1-34 defined in the Correctness Properties section above. Each property maps to exactly one `fc.assert(fc.property(...))` call.

**Key generators**:
- `fc.integer({ min: 1, max: 207 })` for Pillar codes
- `fc.constantFrom(...CANONICAL_SLUGS)` for valid OS_Module slugs
- `fc.string()` for arbitrary search queries
- `fc.tuple(fc.float(), fc.float(), fc.float())` for capital allocation triples
- `fc.array(fc.record({ ... }))` for collections of registry records
- `fc.date()` for session timestamp testing

### Unit Tests

**Framework**: Jest with `ts-jest`.

**Coverage targets**:
- Kernel loader: file-missing, file-unreadable, version-mismatch, successful load
- Pillar service: no-results search, data source unavailable
- OS_Module service: data source unavailable
- Loop engine: timeout path, fatal-error path, execution log retention
- Library service: no-results search, entry-not-found
- Strike_Output engine: placeholder section generation for each of the five sections
- Instrument archive: persistence failure (step 2 fail, step 3 fail), year-boundary NNN reset
- Clearance gate: vault decryption failure, code rotation session invalidation
- Capital allocation: mandate constant definition (40+40+20=100)
- Structural integrity check: all mandatory paths present, each missing path emits correct warning

### Integration Tests

**Framework**: Jest with real filesystem (temp directory) and mocked `iron-session`.

**Coverage**:
- Full startup sequence: kernel loads, data loads, search indexes built
- End-to-end Strike_Output generation: input -> five-section output -> instrument persisted -> retrievable
- Audit log: entries written, existing entries unchanged after subsequent appends
- Vault: encrypt -> write -> read -> decrypt round-trip
- Loop execution log: entries written, 90-day retention boundary
- Capital allocation: approved record written, failed record written to separate log

### Smoke Tests

- Structural integrity check at startup: all mandatory directories and files present
- Vault encryption key present and valid length
- Session secret present and minimum length

### Responsive UI Testing

The Dashboard and Navigation components are tested with snapshot tests at three representative viewport widths: 375px (mobile), 1280px (desktop), and 2560px (wide). Snapshot tests use `@testing-library/react` with `jest-environment-jsdom`.

### Performance Benchmarks

The following SLAs are verified in integration tests using `performance.now()`:

| Operation | SLA | Test approach |
|-----------|-----|---------------|
| Pillar lookup by code | 500ms | Unit test with 207 pillars in memory |
| Pillar keyword search | 1000ms | Integration test with full 207-pillar index |
| OS_Module lookup by slug | 500ms | Unit test with 36 modules in memory |
| Integration map query | 500ms | Integration test with 277 records |
| Loop evaluation | 2000ms | Unit test with mock condition evaluator |
| Library search | 1000ms | Integration test with full 345-entry index |
| Library lookup by ID | 500ms | Unit test with 345 entries in memory |
| Instrument archive query by year | 1000ms | Integration test |
| Instrument lookup by ID | 500ms | Integration test |
| Global search (all three indexes) | 1500ms | Integration test |

### Dependencies to Add

The following packages need to be added to `package.json`:

```json
{
  "dependencies": {
    "iron-session": "8.0.4",
    "fuse.js": "7.0.0",
    "katex": "0.16.21",
    "gray-matter": "4.0.3",
    "remark": "15.0.1",
    "remark-html": "16.0.1"
  },
  "devDependencies": {
    "jest": "29.7.0",
    "ts-jest": "29.2.5",
    "@types/jest": "29.5.14",
    "@types/katex": "0.16.7",
    "fast-check": "3.23.2",
    "@testing-library/react": "16.3.0",
    "@testing-library/jest-dom": "6.6.3",
    "jest-environment-jsdom": "29.7.0"
  }
}
```

All versions are pinned exactly. `iron-session` v8 is the current App Router-compatible release. `fuse.js` v7 is the current stable release. `katex` v0.16.21 is the current stable release with full server-side rendering support.
