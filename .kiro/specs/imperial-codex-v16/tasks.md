<<<<<<< HEAD
# Imperial Codex v16 — Implementation Tasks

## Tasks

- [x] 1. Project Scaffold and Dependency Setup
  Set up the Next.js 16.2 / React 19 / TypeScript 5 project with all required dependencies.
  - Install and configure Next.js App Router with TypeScript
  - Add dependencies: `iron-session`, `jose`, `fuse.js`, `katex`, `gray-matter`, `remark`, `fast-check`, `jest`, `ts-jest`
  - Configure `tsconfig.json` with strict mode and path aliases (`@/lib`, `@/components`)
  - Configure `jest.config.ts` with `ts-jest` preset
  - Create `.env.example` documenting `VAULT_ENCRYPTION_KEY` (64-char hex) and `SESSION_SECRET`
  - Create mandatory repository directories: `/core`, `/os-modules`, `/vault`, `/instruments`, `/rituals`
  - **References:** Requirement 8, Design §Research Summary, Design §Testing Strategy

- [x] 2. Core Data Files and Directory Structure
  Populate the mandatory file-system artefacts required by Requirement 8.
  - Ensure `/core/KERNEL_V16_MASTER.md` exists with Kernel v16.2 header and the 36 canonical OS_Module slugs
  - Ensure `/core/PILLARS.md` exists with all 207 Pillar records (code, cluster, title, body) in parseable Markdown front-matter format
  - Ensure `/core/LIBRARY.md` exists with all 345 Library_Entry records (id, title, body, slug tags)
  - Create `/os-modules/{SLUG}.md` for each of the 36 OS_Modules (slug, cluster, description, linkedPillarCodes, linkedIntegrationIds)
  - Create `/vault/CLEARANCE_CODES.json` as an empty encrypted envelope placeholder
  - Create `/rituals/GRABOVOI_SEQUENCES.md` and `/rituals/SIGIL_LOG.md`
  - Create `/instruments/registry.json` as an empty JSON array `[]`
  - **References:** Requirement 8.1–8.5, Design §Data Models
  - **Depends on:** 1

- [x] 3. InMemoryStore and Type Definitions
  Implement the singleton in-memory store and all shared TypeScript types.
  - Create `src/lib/store/InMemoryStore.ts` — singleton with `Map` fields for pillars, osModules, integrations, loops, library, and Fuse.js index fields
  - Create `src/lib/kernel/types.ts` — `KernelState`, `KernelStatus` types
  - Create `src/lib/pillars/types.ts` — `Pillar`, `PillarCluster`, `PillarSearchResult` types
  - Create `src/lib/os-modules/types.ts` — `OSModule`, `OSModuleCluster` types
  - Create `src/lib/integrations/types.ts` — `Integration`, `IntegrationMap` types
  - Create `src/lib/loops/types.ts` — `RecursiveLoop`, `LoopTriggerEvent`, `LoopExecutionRecord` types
  - Create `src/lib/library/types.ts` — `LibraryEntry`, `LibrarySearchResult` types
  - Create `src/lib/strike/types.ts` — `StrikeRequest`, `StrikeOutput`, `StrikeSection` types
  - Create `src/lib/instruments/types.ts` — `InstrumentRegistryEntry` type
  - Create `src/lib/security/types.ts` — `SessionData`, `GateDecision`, `AuditLogEntry` types
  - Create `src/lib/capital/types.ts` — `CapitalAllocation`, `AllocationValidationError`, `AllocationRecord` types
  - **References:** Design §Data Models, Design §Key Service Contracts
  - **Depends on:** 1

- [x] 4. Kernel Loader and Service
  Implement Kernel loading, validation, and the KernelService.
  - Create `src/lib/kernel/KernelLoader.ts`: Read `/core/KERNEL_V16_MASTER.md` using `gray-matter` + `remark`; extract kernel version string and OS_Module slug list; validate slug set against the 36 canonical slugs; set status `halted` on mismatch and log diff; log version-mismatch warning if version string differs from `EXPECTED_KERNEL_VERSION` constant; return `KernelState` with `{ version, status, osModuleSlugs }`
  - Create `src/lib/kernel/KernelService.ts`: `getState(): KernelState`; `getStatus(): KernelStatus`; reads from InMemoryStore
  - Write unit tests in `src/lib/kernel/__tests__/KernelLoader.test.ts`: file-missing → halted + `KERNEL_FILE_MISSING` error; file-unreadable → halted + descriptive error; version-mismatch → warning logged, continues with file version; successful load → status `active`, 36 slugs recognised
  - Write property test `Property 1` in `src/__tests__/properties/property-01.test.ts`
  - **References:** Requirement 1, Design §Property 1, Design §Startup Sequence
  - **Depends on:** 2, 3

- [x] 5. Structural Integrity Check
  Implement the startup structural integrity checker.
  - Create `src/lib/structural/StructuralIntegrityCheck.ts`: define list of mandatory paths; for each missing path emit a `STRUCTURAL_INTEGRITY_WARNING` log entry; return a summary `{ ok: boolean, missingPaths: string[] }`
  - Write unit tests covering: all paths present → `ok: true`; each missing path → correct warning emitted
  - **References:** Requirement 8.6, Design §Startup Sequence, Design §Error Code Registry
  - **Depends on:** 3

- [x] 6. Pillar Loader and Service
  Implement Pillar data loading, registry, and search.
  - Create `src/lib/pillars/PillarLoader.ts`: parse `/core/PILLARS.md` with `gray-matter` + `remark`; validate each Pillar (unique code, range 001–207, valid cluster membership); populate `InMemoryStore.pillars` Map and `pillarSearchIndex` Fuse.js instance (weights: title > body)
  - Create `src/lib/pillars/PillarService.ts`: `getByCode(code: string): Pillar | null`; `search(query: string): PillarSearchResult[]` with 1000ms timeout
  - Write unit tests: no-results search, data source unavailable
  - Write property tests `Property 2`, `Property 3`, `Property 4`, `Property 5`, `Property 6`
  - **References:** Requirement 2, Design §Properties 2–6
  - **Depends on:** 2, 3

- [ ] 7. OS Module Loader and Service
  Implement OS_Module loading, registry, and grouped display.
  - Create `src/lib/os-modules/OSModuleLoader.ts`: parse each `/os-modules/{SLUG}.md` file; validate unique slug, slug matches pattern `[A-Z][A-Z-]{2,19}`, valid cluster membership; populate `InMemoryStore.osModules` Map and `osModuleSearchIndex` Fuse.js instance
  - Create `src/lib/os-modules/OSModuleService.ts`: `getBySlug(slug: string): OSModule | null`; `getAllGrouped(): Record<OSModuleCluster, OSModule[]>` — clusters in fixed order, modules alphabetical by slug
  - Write unit tests: data source unavailable
  - Write property tests `Property 7`, `Property 8`, `Property 9`, `Property 10`, `Property 11`
  - **References:** Requirement 3, Design §Properties 7–11
  - **Depends on:** 2, 3

- [ ] 8. Integration Loader and Service
  Implement Integration record loading and map resolution.
  - Create `src/lib/integrations/IntegrationLoader.ts`: parse integration data; validate each record (non-empty source slug in canonical 36, at least one target slug in canonical 36, non-empty relationship type); populate `InMemoryStore.integrations` Map
  - Create `src/lib/integrations/IntegrationService.ts`: `getMap(slug: string): IntegrationMap` — returns `{ inbound: Integration[], outbound: Integration[] }` with 500ms timeout
  - Write property tests `Property 12`, `Property 13`
  - **References:** Requirement 4.1–4.2, Design §Properties 12–13
  - **Depends on:** 2, 3

- [ ] 9. Loop Loader and Loop Engine
  Implement Recursive Loop loading, trigger evaluation, and execution logging.
  - Create `src/lib/loops/LoopLoader.ts`: parse loop definitions; validate each loop references at least one registered slug; flag broken-reference loops with `LOOP_BROKEN_REFERENCE`; populate `InMemoryStore.loops`
  - Create `src/lib/loops/LoopEngine.ts`: `trigger(event: LoopTriggerEvent): Promise<LoopExecutionRecord>`; evaluate matching loops in isolated try/catch; enforce 2000ms timeout; on broken-reference log error and skip; append execution record to `/core/LOOP_EXECUTION_LOG.jsonl`; return `LoopExecutionRecord` with all five required fields
  - Write unit tests: timeout path, fatal-error path, execution log retention
  - Write property tests `Property 14`, `Property 15`
  - **References:** Requirement 4.3–4.6, Design §Properties 14–15, Design §Loop Engine Error Isolation
  - **Depends on:** 2, 3

- [ ] 10. Library Loader and Service
  Implement Library_Entry loading, lookup, and full-text search.
  - Create `src/lib/library/LibraryLoader.ts`: parse `/core/LIBRARY.md`; validate unique IDs and at least one registered slug tag per entry; populate `InMemoryStore.library` Map and `librarySearchIndex` Fuse.js instance (weights: title > body > tags)
  - Create `src/lib/library/LibraryService.ts`: `getById(id: string): LibraryEntry | null`; `search(query: string): LibrarySearchResult[]` with 1000ms timeout; `findBySlug(slug: string): LibraryEntry[]`
  - Write unit tests: no-results search, entry-not-found
  - Write property tests `Property 16`, `Property 17`, `Property 18`
  - **References:** Requirement 5, Design §Properties 16–18
  - **Depends on:** 2, 3

- [ ] 11. Vault Repository and AES-256-GCM Encryption
  Implement the encrypted Vault storage layer.
  - Create `src/lib/security/VaultRepository.ts`: `encrypt(plaintext: string, key: Buffer): EncryptedEnvelope` — AES-256-GCM; `decrypt(envelope: EncryptedEnvelope, key: Buffer): string`; `read(): VaultData`; `write(data: VaultData): void`; key from `VAULT_ENCRYPTION_KEY` env var
  - Write integration test: encrypt → write → read → decrypt round-trip
  - **References:** Requirement 7.4, Design §Vault, Design §Vault Decryption Failure
  - **Depends on:** 2, 3

- [ ] 12. Audit Log Repository
  Implement the append-only audit log.
  - Create `src/lib/security/AuditLog.ts`: `append(entry: AuditLogEntry): void` — opens `/vault/AUDIT_LOG.jsonl` in append mode; `archive(cutoffDate: Date): void` — moves entries older than cutoff to archive file; never modifies or deletes existing entries
  - Write integration tests: entries written correctly; existing entries byte-for-byte unchanged after subsequent appends
  - Write property test `Property 28`
  - **References:** Requirement 7.6, Design §Audit Log, Design §Property 28
  - **Depends on:** 3

- [ ] 13. Session Management
  Implement `iron-session` cookie-based session management.
  - Create `src/lib/security/session.ts`: configure `iron-session` with cookie name `imperial-session`, `maxAge: 86400`, secret from `SESSION_SECRET` env var; export `getSession(req, res)` helper; define `SessionData` shape
  - Write property test `Property 29` (session expiry at T+24h+1s)
  - **References:** Requirement 7, Design §Session
  - **Depends on:** 3

- [ ] 14. Clearance Gate
  Implement the clearance-level security gate.
  - Create `src/lib/security/ClearanceGate.ts`: `verify(session: SessionData, resource: string, requireLevel1: boolean): GateDecision`; returns `{ granted: true }` or `{ granted: false, code: 'UNAUTHENTICATED' | 'CLEARANCE_DENIED' }`; on denial calls `AuditLog.append`; on vault-error state returns 503 `VAULT_UNAVAILABLE`
  - Write unit tests: vault decryption failure path, code rotation session invalidation
  - Write property tests `Property 26`, `Property 27`
  - **References:** Requirement 7.1–7.5, Design §Properties 26–27
  - **Depends on:** 11, 12, 13

- [ ] 15. Next.js Middleware
  Implement `src/middleware.ts` for auth gating and kernel-halted guard.
  - Read `imperial-session` cookie via `iron-session`; if no valid session redirect to `/login` or return 401 JSON; if valid session but sensitive route and clearance < 1 return 403 JSON; if `KernelService.getStatus() === 'halted'` and route not exempt return 503 `KERNEL_HALTED`; matcher excludes static assets
  - **References:** Requirement 7, Design §Middleware, Design §Kernel Halted Guard
  - **Depends on:** 4, 14

- [ ] 16. Instrumentation and Startup Sequence
  Implement `src/instrumentation.ts` to wire the full startup sequence.
  - Export `register()` async function; call `StructuralIntegrityCheck` first; call `KernelLoader`; call all data loaders in parallel; call `SearchIndexBuilder` to build all three Fuse.js indexes; populate `InMemoryStore` singleton
  - Write integration test: full startup sequence — kernel loads, data loads, search indexes built
  - **References:** Requirement 1, Design §Startup Sequence
  - **Depends on:** 4, 5, 6, 7, 8, 9, 10

- [ ] 17. Instrument ID Generator and Archive
  Implement sequential DH-RES identifier generation and the Instrument archive.
  - Create `src/lib/instruments/InstrumentIdGenerator.ts`: reads `/instruments/registry.json`; atomically increments counter; resets to 001 at year boundary; returns `DH-RES-YYYY-NNN`
  - Create `src/lib/instruments/InstrumentArchive.ts`: `save(instrument: StrikeOutput): Promise<string>` — two-phase commit; `getById(id: string): Promise<StrikeOutput | null>` with 500ms timeout; `getByYear(year: number): Promise<InstrumentRegistryEntry[]>` with 1000ms timeout
  - Write unit tests: persistence failure step 2, persistence failure step 3, year-boundary NNN reset
  - Write property tests `Property 23`, `Property 33`
  - **References:** Requirement 6.4, Requirement 11, Design §Instrument Persistence Atomicity, Design §Properties 23, 33
  - **Depends on:** 3

- [ ] 18. LaTeX Renderer
  Implement server-side KaTeX rendering.
  - Create `src/lib/latex/LatexRenderer.ts`: `render(input: string): string` — finds all `$...$` and `$$...$$` delimiters, calls `katex.renderToString()` for each, replaces delimiters with KaTeX HTML output; output contains no raw `$` delimiters surrounding math expressions
  - Write property test `Property 34`
  - **References:** Requirement 6.5, Requirement 11.6, Design §Property 34
  - **Depends on:** 1

- [ ] 19. Capital Allocation Service
  Implement the 40/40/20 capital allocation validator and recorder.
  - Create `src/lib/capital/CapitalAllocationService.ts`: `validate(allocation: CapitalAllocation): AllocationValidationError[]` — accepts if `|growth-40| ≤ 0.005 AND |operational-40| ≤ 0.005 AND |reserve-20| ≤ 0.005`; `record(allocation, userId, slug): Promise<AllocationRecord>` — appends to appropriate JSON file; recorded entry includes UTC timestamp, approving userId, associated OS_Module slug
  - Write unit test: mandate constant (40+40+20=100)
  - Write property tests `Property 30`, `Property 31`
  - **References:** Requirement 9, Design §Properties 30–31
  - **Depends on:** 3

- [ ] 20. Global Search
  Implement the unified cross-entity search.
  - Create `src/lib/search/SearchIndex.ts` — builds and exposes the three Fuse.js indexes
  - Create `src/lib/search/GlobalSearch.ts`: `search(query: string): Promise<GlobalSearchResult>` — queries all three indexes in parallel; consolidates results Pillars first, OS_Modules second, Library_Entries third; enforces 1500ms timeout
  - Write property test `Property 32`
  - **References:** Requirement 10.4, Design §Property 32
  - **Depends on:** 6, 7, 10

- [ ] 21. Strike Output Engine
  Implement the 5-Part Strike Hierarchy output generator.
  - Create `src/lib/strike/StrikeOutputEngine.ts`: `generate(request: StrikeRequest): Promise<StrikeOutput>`; Section 1 — Executive Analysis (≥5 OS_Module slugs, ≥1 Library_Entry citation); Section 2 — OS Stress Test (exactly three paths); Section 3 — Imperial Instrument (DH-RES-YYYY-NNN, LaTeX math); Section 4 — Action Plan (exactly three strikes); Section 5 — The Ritual (bilingual Sepedi/Latin, ≥1 Grabovoi Code, sigil reference); on missing data insert placeholder section
  - Write unit tests: placeholder generation for each of the five sections
  - Write property tests `Property 19`, `Property 20`, `Property 21`, `Property 22`, `Property 24`, `Property 25`
  - **References:** Requirement 6, Requirement 5.5, Design §Properties 19–25
  - **Depends on:** 6, 7, 10, 17, 18

- [ ] 22. API Route Handlers
  Implement all Next.js App Router API routes.
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/status`, `GET /api/pillars`, `GET /api/pillars/[code]`, `GET /api/os-modules`, `GET /api/os-modules/[slug]`, `GET /api/library`, `GET /api/library/[id]`, `GET /api/integrations/[slug]`, `GET /api/loops`, `POST /api/strike`, `GET /api/instruments`, `GET /api/instruments/[id]`, `POST /api/capital`
  - All routes return errors in the `{ error: { code, message, details? } }` envelope
  - **References:** Requirement 2–11, Design §Source Directory Layout, Design §Structured Error Response Format
  - **Depends on:** 4, 6, 7, 8, 9, 10, 13, 14, 17, 19, 21

- [ ] 23. Authentication Page
  Implement the login UI.
  - Create `src/app/(auth)/login/page.tsx` — server component with a client-side login form; form submits to `POST /api/auth/login`; on success redirect to `/dashboard`; on failure display structured error message; responsive layout (375px–2560px)
  - **References:** Requirement 7.1, Requirement 10.6
  - **Depends on:** 22

- [ ] 24. Protected Layout and Dashboard Page
  Implement the authenticated shell and primary dashboard.
  - Create `src/app/(protected)/layout.tsx` — wraps all protected pages; includes `<Navigation>` and `<SystemStatusBar>` components
  - Create `src/app/(protected)/dashboard/page.tsx` — displays active Kernel version, system health status, active Recursive_Loop count; renders `<GlobalSearchBar>`; polls `/api/status` every 60 seconds; responsive layout (375px–2560px)
  - **References:** Requirement 10.1, Requirement 10.5, Requirement 10.6
  - **Depends on:** 22

- [ ] 25. Pillar Pages
  Implement the Pillar registry browser and detail pages.
  - Create `src/app/(protected)/pillars/page.tsx` — lists all 207 Pillars grouped by cluster using `<PillarCard>` components; includes search input
  - Create `src/app/(protected)/pillars/[code]/page.tsx` — displays full Pillar record; 404 on invalid code
  - Create `src/components/ui/PillarCard.tsx` — displays pillar code, cluster badge, title
  - Responsive layout (375px–2560px)
  - **References:** Requirement 2, Requirement 10.2
  - **Depends on:** 22

- [ ] 26. OS Module Pages
  Implement the OS_Module registry browser and detail pages.
  - Create `src/app/(protected)/os-modules/page.tsx` — displays all 36 modules grouped by cluster using `<OSModuleCard>` components
  - Create `src/app/(protected)/os-modules/[slug]/page.tsx` — displays full module record including linked Pillars, active Integrations, pending Recursive_Loop triggers; 404 on unknown slug
  - Create `src/components/ui/OSModuleCard.tsx` — displays slug, cluster badge, description excerpt
  - Responsive layout (375px–2560px)
  - **References:** Requirement 3, Requirement 10.2, Requirement 10.3
  - **Depends on:** 22

- [ ] 27. Library Pages
  Implement the Library knowledge base browser and detail pages.
  - Create `src/app/(protected)/library/page.tsx` — full-text search interface using `<LibraryEntryCard>` components
  - Create `src/app/(protected)/library/[id]/page.tsx` — displays full Library_Entry record; 404 on missing ID
  - Create `src/components/ui/LibraryEntryCard.tsx` — displays entry ID, title, slug tags
  - **References:** Requirement 5
  - **Depends on:** 22

- [ ] 28. Instrument Archive Pages
  Implement the Instrument archive browser and viewer.
  - Create `src/app/(protected)/instruments/page.tsx` — lists instruments filterable by year; ordered by NNN ascending
  - Create `src/app/(protected)/instruments/[id]/page.tsx` — renders full Instrument document with KaTeX-rendered math via `<InstrumentViewer>`; 404 on missing ID
  - Create `src/components/ui/InstrumentViewer.tsx` — renders Instrument markdown with pre-rendered KaTeX HTML; includes KaTeX CSS
  - **References:** Requirement 11, Design §Property 34
  - **Depends on:** 22

- [ ] 29. Strike Output Page
  Implement the Strike_Output generation interface.
  - Create `src/app/(protected)/strike/page.tsx` — form to submit a `StrikeRequest`; requires Level 1 clearance; on submission calls `POST /api/strike`; displays result via `<StrikeOutputViewer>`
  - Create `src/components/ui/StrikeOutputViewer.tsx` — renders all five sections with correct labels; renders KaTeX math; shows placeholder sections with explanatory text when data is missing
  - **References:** Requirement 6, Requirement 7.2
  - **Depends on:** 22

- [ ] 30. Capital Allocation Page
  Implement the capital allocation submission and summary view.
  - Create `src/app/(protected)/capital/page.tsx` — displays current cumulative allocations vs 40/40/20 mandate; includes `<CapitalAllocationForm>`
  - Create `src/components/ui/CapitalAllocationForm.tsx` — client component; submits to `POST /api/capital`; displays per-category deviation errors on rejection; summary view refreshes on successful submission
  - **References:** Requirement 9
  - **Depends on:** 22

- [ ] 31. UI Shell Components
  Implement shared navigation and status components.
  - Create `src/components/ui/Navigation.tsx` — sidebar/top-nav with links to all sections; responsive (375px–2560px)
  - Create `src/components/ui/SystemStatusBar.tsx` — client component; displays Kernel version, health badge, active loop count; polls `/api/status` every 60 seconds
  - Create `src/components/ui/StatusBadge.tsx` — colour-coded badge for `active | halted | vault-error` states
  - Create `src/components/ui/GlobalSearchBar.tsx` — client component; debounced input; calls pillars, os-modules, library APIs in parallel; renders consolidated results
  - **References:** Requirement 10.1, Requirement 10.4, Requirement 10.5, Requirement 10.6
  - **Depends on:** 22

- [ ] 32. Integration Tests
  Write the full suite of integration tests.
  - Full startup sequence: kernel loads, data loads, search indexes built
  - End-to-end Strike_Output generation: input → five-section output → instrument persisted → retrievable by ID
  - Audit log: entries written; existing entries byte-for-byte unchanged after subsequent appends
  - Vault: encrypt → write → read → decrypt round-trip
  - Loop execution log: entries written; 90-day retention boundary respected
  - Capital allocation: approved record written to `CAPITAL_ALLOCATIONS.json`; failed record written to `CAPITAL_ALLOCATION_FAILURES.json`
  - **References:** Design §Integration Tests
  - **Depends on:** 16, 21, 11, 12, 9, 19

- [ ] 33. Build Verification and Final Checks
  Verify the complete application builds and all tests pass.
  - Run `npm run build` — confirm zero TypeScript errors and zero build warnings
  - Run `npm test` — confirm all unit, property-based, and integration tests pass
  - Verify all 34 property tests are present and tagged with `// Feature: imperial-codex-v16, Property N:`
  - Confirm `/api/status` returns `{ version: "v16.2", status: "active" }` against the built app
  - Confirm middleware correctly blocks unauthenticated requests to all protected routes
  - **References:** All requirements, Design §Testing Strategy
  - **Depends on:** 15, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
=======
# placeholder
>>>>>>> 62b893a2803c043c64e5fdbb8265c50dc1186bf6
