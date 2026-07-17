"""
Imperial Codex v16.2 — Architecture Map
Dalizebo Holdings | Kernel v16.2 | Clearance-Gated | 5-Part Strike Hierarchy

This file documents the full system architecture: layers, services, data flows,
security model, and component relationships.
"""

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM IDENTITY
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM = {
    "name": "Imperial Codex",
    "version": "v16.2",
    "organisation": "Dalizebo Holdings",
    "kernel": "Kernel v16.2",
    "runtime": "Next.js 16.2 (App Router) + React 19",
    "language": "TypeScript 5",
    "deployment": "Vercel (edge + serverless)",
    "infrastructure": "AWS EKS + VPC (Terraform)",
}


# ─────────────────────────────────────────────────────────────────────────────
# ARCHITECTURE DIAGRAM
# ─────────────────────────────────────────────────────────────────────────────

DIAGRAM = """
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPERIAL CODEX v16.2                                 │
│                     Strategic Operating System                              │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐
  │   Browser    │    │  External AI │    │  Claude Desktop / Cursor / IDE   │
  │  (React 19)  │    │   Agents     │    │  (MCP Clients)                   │
  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────────────┘
         │                   │                           │
         ▼                   ▼                           ▼ stdio / HTTP+SSE
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     NEXT.JS APP ROUTER (Vercel)                         │
  │                                                                         │
  │  GET/POST /api/agent/chat          → ChatAgentService (GPT-4o stream)   │
  │  GET/POST /api/agent/conversations → ConversationRepository             │
  │  POST     /api/agent/cron          → BackgroundAgentService (15-min)    │
  │  POST     /api/mcp                 → MCP HTTP/SSE Transport             │
  └──────────────────────────────┬──────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌─────────────┐       ┌────────────────┐      ┌───────────────────┐
  │  AI LAYER   │       │  KERNEL LAYER  │      │  SECURITY LAYER   │
  │             │       │                │      │                   │
  │ ChatAgent   │       │ KernelLoader   │      │ iron-session      │
  │ (GPT-4o)   │       │ KernelService  │      │ (24h cookie)      │
  │             │       │ InMemoryStore  │      │                   │
  │ Background  │       │                │      │ Clearance L0-L2   │
  │ Agent       │       │ Pillars (207)  │      │                   │
  │ (15-min     │       │ OS Modules(36) │      │ VaultRepository   │
  │  cron)      │       │ Library (345)  │      │ AuditLog          │
  │             │       │ Loops (104)    │      │                   │
  │ Claude      │       │ Integrations   │      │ SESSION_SECRET    │
  │ Strike      │       │ (277)          │      │ (env-gated)       │
  │ Engine      │       │                │      │                   │
  └──────┬──────┘       └───────┬────────┘      └─────────┬─────────┘
         │                      │                         │
         └──────────────────────┼─────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────────┐
         ▼                      ▼                          ▼
  ┌─────────────┐      ┌────────────────┐       ┌──────────────────┐
  │  STRIKE     │      │  CAPITAL       │       │  INSTRUMENTS     │
  │  ENGINE     │      │  ALLOCATION    │       │  ARCHIVE         │
  │             │      │                │       │                  │
  │ 5-Part      │      │ 40/40/20       │       │ DH-RES-YYYY-NNN  │
  │ Hierarchy   │      │ Mandate        │       │ ID Generator     │
  │             │      │ ±0.005 tol.    │       │                  │
  │ Validator   │      │                │       │ Supabase-backed  │
  │ Template    │      │ Supabase-      │       │                  │
  │ Fallback    │      │ persisted      │       │                  │
  └──────┬──────┘      └───────┬────────┘       └────────┬─────────┘
         │                     │                         │
         └─────────────────────┼─────────────────────────┘
                               │
  ┌────────────────────────────▼────────────────────────────────────────────┐
  │                          DATA LAYER                                     │
  │                                                                         │
  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
  │  │ Supabase         │  │ InMemoryStore│  │  Qdrant  │  │  Pinecone  │  │
  │  │ (PostgreSQL)     │  │ (startup     │  │ (vector  │  │  (vector   │  │
  │  │                  │  │  hydration)  │  │  search) │  │   search)  │  │
  │  │ conversations    │  │              │  │          │  │            │  │
  │  │ instruments      │  │ kernel       │  │          │  │            │  │
  │  │ allocations      │  │ pillars      │  │          │  │            │  │
  │  │ loop_log         │  │ osModules    │  │          │  │            │  │
  │  │ audit_log        │  │ library      │  │          │  │            │  │
  │  │ vault_secrets    │  │ loops        │  │          │  │            │  │
  │  └──────────────────┘  └──────────────┘  └──────────┘  └────────────┘  │
  │                                                                         │
  │  ┌──────────────────┐                                                   │
  │  │ Redis            │                                                   │
  │  │ (cache + session)│                                                   │
  │  └──────────────────┘                                                   │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     MCP SERVER (13 Tools)                               │
  │                                                                         │
  │  READ  (7): get_pillar, search_pillars, get_os_module,                  │
  │             list_os_modules, search_library, get_library_entry,         │
  │             get_integration_map                                         │
  │                                                                         │
  │  WRITE (6): generate_strike_output, get_instrument, list_instruments,   │
  │             get_capital_allocation, submit_capital_allocation,          │
  │             get_loop_status                                             │
  │                                                                         │
  │  Transports: stdio (local) | HTTP/SSE via /api/mcp (remote)            │
  └─────────────────────────────────────────────────────────────────────────┘
"""


# ─────────────────────────────────────────────────────────────────────────────
# LAYERS
# ─────────────────────────────────────────────────────────────────────────────

LAYERS = {
    "presentation": {
        "description": "Browser UI + external AI client entry points",
        "components": ["React 19 (App Router pages)", "Chat widget (useChat hook)", "MCP clients (Claude Desktop, Cursor)"],
    },
    "api": {
        "description": "Next.js App Router API routes on Vercel",
        "routes": {
            "/api/agent/chat": "Streaming GPT-4o chat with 8 tool definitions",
            "/api/agent/conversations": "CRUD for conversation history",
            "/api/agent/conversations/[id]": "Single conversation retrieval",
            "/api/agent/cron": "Background agent trigger (15-min heartbeat)",
            "/api/mcp": "MCP HTTP/SSE transport for external AI agents",
        },
    },
    "service": {
        "description": "Core business logic — all stateless, singleton instances",
        "services": {
            "KernelService": "Read-only facade over InMemoryStore kernel state",
            "ChatAgentService": "Builds 8 AI tool definitions for the chat route",
            "BackgroundAgentService": "Evaluates 104 loops + generates daily summaries",
            "ClaudeStrikeEngine": "Claude-powered 5-part Strike Output generation",
            "StrikeOutputEngine": "Orchestrates strike generation + validation + persistence",
            "StrikeValidator": "Structural validation of 5-part hierarchy",
            "CapitalAllocationService": "Enforces 40/40/20 mandate with ±0.005 tolerance",
            "InstrumentArchive": "DH-RES instrument persistence + retrieval",
            "PillarService": "Fuzzy search over 207 Strategic Pillars",
            "LoopEngine": "IF/THEN evaluation of 104 Recursive Loops",
            "IntegrationLoader": "Loads 277 OS integration mappings",
            "LibraryLoader": "Loads 345 Library entries",
            "AuditLog": "Immutable audit trail (Supabase-backed)",
            "VaultRepository": "Clearance-gated secret retrieval",
        },
    },
    "kernel": {
        "description": "Startup hydration — loads all static data into InMemoryStore",
        "sequence": [
            "1. KernelLoader  → parses KERNEL_V16_MASTER.md → kernel state",
            "2. PillarLoader  → parses PILLARS.md → 207 pillars",
            "3. OSModuleLoader → parses os-modules/*.md → 36 OS modules",
            "4. LibraryLoader → parses LIBRARY.md → 345 entries",
            "5. LoopLoader    → parses KERNEL_V16_MASTER.md loops → 104 loops",
            "6. IntegrationLoader → parses integrations → 277 mappings",
        ],
        "store": "InMemoryStore (singleton, process-scoped)",
    },
    "data": {
        "description": "Persistence and search backends",
        "supabase": {
            "tables": ["conversations", "instruments", "capital_allocations", "loop_execution_log", "audit_log", "vault_secrets"],
            "retry": "Exponential backoff (retry.ts)",
        },
        "in_memory": "InMemoryStore — hydrated at startup via instrumentation.ts",
        "vector_search": ["Qdrant (high-performance)", "Pinecone (scalable)"],
        "cache": "Redis (session + response caching)",
    },
    "infrastructure": {
        "description": "AWS cloud infrastructure via Terraform",
        "provider": "AWS (~5.0)",
        "components": ["EKS cluster (eks.tf)", "VPC + networking (vpc.tf)", "Variables (variables.tf)", "Outputs (outputs.tf)"],
        "deployment": "Vercel (primary) | Docker (local dev)",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# CORE DATA MODEL
# ─────────────────────────────────────────────────────────────────────────────

CORE_DATA = {
    "strategic_pillars": {"count": 207, "source": "core/PILLARS.md", "search": "Fuse.js fuzzy search"},
    "os_modules": {"count": 36, "source": "os-modules/*.md", "loader": "OSModuleLoader"},
    "integrations": {"count": 277, "source": "KERNEL_V16_MASTER.md", "loader": "IntegrationLoader"},
    "recursive_loops": {"count": 104, "source": "KERNEL_V16_MASTER.md", "engine": "LoopEngine (15-min cron)"},
    "library_entries": {"count": 345, "source": "core/LIBRARY.md", "loader": "LibraryLoader"},
}


# ─────────────────────────────────────────────────────────────────────────────
# SECURITY MODEL
# ─────────────────────────────────────────────────────────────────────────────

SECURITY = {
    "clearance_levels": {
        0: "Public — no authentication required",
        1: "Authenticated — valid session cookie",
        2: "Elevated — explicit clearance grant in session",
    },
    "session": {
        "mechanism": "iron-session (encrypted cookie)",
        "cookie": "imperial-session",
        "max_age_seconds": 86400,
        "flags": ["httpOnly", "sameSite=lax", "secure (production)"],
    },
    "vault": "VaultRepository — clearance-gated secret retrieval from Supabase",
    "audit": "AuditLog — immutable event trail for all sensitive operations",
    "env_secrets": ["SESSION_SECRET", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"],
}


# ─────────────────────────────────────────────────────────────────────────────
# STRIKE OUTPUT — 5-PART HIERARCHY
# ─────────────────────────────────────────────────────────────────────────────

STRIKE_HIERARCHY = [
    {"part": 1, "name": "Executive Analysis", "description": "High-level strategic assessment"},
    {"part": 2, "name": "OS Stress Test",      "description": "Pressure-test relevant OS modules"},
    {"part": 3, "name": "Imperial Instrument", "description": "DH-RES instrument generation"},
    {"part": 4, "name": "Action Plan",         "description": "T-Minus 24-hour execution steps"},
    {"part": 5, "name": "Ritual",              "description": "Closing directive and commitment"},
]

CAPITAL_MANDATE = {
    "growth_percent": 40,
    "operational_percent": 40,
    "reserve_percent": 20,
    "tolerance_points": 0.005,
    "enforcement": "CapitalAllocationService — rejects submissions outside tolerance",
}


# ─────────────────────────────────────────────────────────────────────────────
# MCP SERVER
# ─────────────────────────────────────────────────────────────────────────────

MCP_SERVER = {
    "name": "imperial-codex",
    "version": "1.0.0",
    "total_tools": 13,
    "transports": ["stdio (local — Claude Desktop)", "HTTP/SSE via /api/mcp (remote)"],
    "read_tools": [
        "get_pillar",
        "search_pillars",
        "get_os_module",
        "list_os_modules",
        "search_library",
        "get_library_entry",
        "get_integration_map",
    ],
    "write_tools": [
        "generate_strike_output",
        "get_instrument",
        "list_instruments",
        "get_capital_allocation",
        "submit_capital_allocation",
        "get_loop_status",
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# DEPENDENCY MAP  (service → what it depends on)
# ─────────────────────────────────────────────────────────────────────────────

DEPENDENCIES = {
    "ChatAgentService":       ["InMemoryStore", "Supabase", "OpenAI (GPT-4o)"],
    "BackgroundAgentService": ["LoopEngine", "ClaudeStrikeEngine", "Supabase", "InMemoryStore"],
    "ClaudeStrikeEngine":     ["Anthropic (Claude)", "InMemoryStore", "Supabase"],
    "StrikeOutputEngine":     ["ClaudeStrikeEngine", "StrikeValidator", "InstrumentArchive"],
    "CapitalAllocationService": ["Supabase"],
    "KernelService":          ["InMemoryStore"],
    "PillarService":          ["InMemoryStore", "Fuse.js"],
    "LoopEngine":             ["InMemoryStore", "Supabase (loop_execution_log)"],
    "VaultRepository":        ["Supabase (vault_secrets)", "SecuritySession"],
    "AuditLog":               ["Supabase (audit_log)"],
    "InstrumentArchive":      ["Supabase (instruments)", "InstrumentIdGenerator"],
    "MCP Server":             ["InMemoryStore", "Supabase", "ClaudeStrikeEngine", "CapitalAllocationService"],
}


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Imperial Codex {SYSTEM['version']} — Architecture Map")
    print(DIAGRAM)

    print("── Core Data ──")
    for key, val in CORE_DATA.items():
        print(f"  {key}: {val['count']} entries")

    print("\n── Strike Hierarchy ──")
    for s in STRIKE_HIERARCHY:
        print(f"  Part {s['part']}: {s['name']} — {s['description']}")

    print("\n── Capital Mandate ──")
    print(f"  {CAPITAL_MANDATE['growth_percent']}% growth / "
          f"{CAPITAL_MANDATE['operational_percent']}% operational / "
          f"{CAPITAL_MANDATE['reserve_percent']}% reserve  "
          f"(±{CAPITAL_MANDATE['tolerance_points']} tolerance)")

    print("\n── MCP Server ──")
    print(f"  {MCP_SERVER['total_tools']} tools | transports: {', '.join(MCP_SERVER['transports'])}")

    print("\n── Security ──")
    for level, desc in SECURITY["clearance_levels"].items():
        print(f"  Clearance L{level}: {desc}")
