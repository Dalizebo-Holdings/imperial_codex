# Project Structure

## Current Layout

```
imperial_codex/
├── .gitignore
├── .env.example
├── README.md
├── gen_core.py
├── gen.js
├── jest.config.ts
├── next.config.ts
├── netlify.toml
├── mcp-config.json
├── .kiro/
│   ├── specs/              # Spec documents (requirements, design, tasks)
│   │   ├── imperial-codex-v16/
│   │   ├── imperial-codex-ai-agent/
│   │   ├── imperial-codex-mcp/
│   │   └── imperial-codex-service-integration/
│   ├── steering/           # AI assistant guidance documents
│   │   ├── product.md
│   │   ├── structure.md
│   │   └── tech.md
│   └── settings/           # Kiro and MCP settings
│       └── mcp.json
├── .next/                  # Next.js build output (gitignored)
├── core/                   # Core data files
│   ├── KERNEL_V16_MASTER.md
│   ├── PILLARS.md
│   ├── LIBRARY.md
│   ├── CAPITAL_ALLOCATIONS.json
│   ├── CAPITAL_ALLOCATION_FAILURES.json
│   └── LOOP_EXECUTION_LOG.jsonl
├── os-modules/             # 36 Integrated Operating Systems
├── vault/                  # Encrypted secrets (gitignored)
├── instruments/            # Generated DH-RES documents
├── rituals/                # Grabovoi sequences and sigils
├── supabase/               # Supabase migrations
│   └── migrations/
├── infrastructure/         # AWS Infrastructure-as-Code (Terraform)
├── docs/                   # Documentation
│   ├── deployment.md
│   ├── service-integration.md
│   └── monitoring.md
├── src/                    # Application source code
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth routes (login, logout)
│   │   ├── (protected)/    # Protected routes (dashboard, pillars, etc.)
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Auth endpoints
│   │   │   ├── agent/      # AI agent endpoints
│   │   │   └── mcp/        # MCP endpoints
│   │   └── layout.tsx
│   ├── lib/                # Application logic
│   │   ├── db/             # Database repositories
│   │   ├── kernel/         # Kernel service
│   │   ├── pillars/        # Pillar service
│   │   ├── os-modules/     # OS Module service
│   │   ├── integrations/   # Integration service
│   │   ├── loops/          # Loop engine
│   │   ├── library/        # Library service
│   │   ├── strike/         # Strike output engine
│   │   ├── instruments/    # Instrument archive
│   │   ├── security/       # Security services
│   │   ├── capital/        # Capital allocation service
│   │   ├── agent/          # AI agent services
│   │   ├── search/         # Search services
│   │   ├── store/          # In-memory store
│   │   └── latex/          # LaTeX renderer
│   └── components/         # React components
│       └── ui/             # UI components
├── node_modules/           # Dependencies (gitignored)
└── docs/                   # Documentation
```

## Expected Directories

| Path | Purpose |
|------|---------|
| `src/` | Application source code |
| `core/` | Core data files (Kernel, Pillars, Library) |
| `os-modules/` | 36 Integrated Operating Systems |
| `supabase/migrations/` | Supabase database migrations |
| `infrastructure/` | AWS Infrastructure-as-Code (Terraform) |
| `docs/` | Documentation |
| `.kiro/specs/` | Spec documents (requirements, design, tasks) |
| `.kiro/steering/` | AI assistant guidance documents |

## Conventions

- Update this file as the project structure evolves
- Keep source code under a single top-level `src/` directory
- Avoid committing build artifacts or generated files
- Use kebab-case for directory and file names (e.g., `os-modules`, `capital-allocation`)
- Use PascalCase for React components (e.g., `ChatWidget.tsx`)
- Use snake_case for JSON files (e.g., `CAPITAL_ALLOCATIONS.json`)
