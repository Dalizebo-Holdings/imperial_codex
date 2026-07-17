# Tech Stack

## Runtime and Framework

- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Next.js 16.2 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS (inferred from component structure)
- **Type System**: TypeScript 5

## Package Managers

- **npm** — Primary package manager (package-lock.json present)

## Build and Development Tools

- **Build Output**: `.next/` (Next.js default)
- **Test Runner**: Jest with ts-jest preset
- **Property-Based Testing**: fast-check
- **Bundle Analyzer**: Next.js built-in

## Database and Persistence

- **Primary Database**: Supabase (PostgreSQL-as-a-service)
- **Caching**: Redis (in-memory data store)
- **Vector Search**: Qdrant (high-performance) and Pinecone (scalable)
- **ORM/Client**: `@supabase/supabase-js`

## AI and Machine Learning

- **LLM Provider**: OpenAI (GPT-4o) via Vercel AI SDK
- **Secondary LLM**: Anthropic (Claude 3.5 Sonnet) via `@anthropic-ai/sdk`
- **Embedding Model**: OpenAI `text-embedding-3-large` (1536 dimensions)
- **Streaming**: Vercel AI SDK `streamText` and `generateText`

## Infrastructure and Deployment

- **Cloud Provider**: AWS (EC2, S3, RDS, IAM, CloudWatch)
- **Containerization**: Docker with multi-stage builds
- **Deployment Platform**: Vercel (edge network, serverless functions)
- **Version Control**: GitHub (CI/CD pipelines)
- **Infrastructure-as-Code**: Terraform (AWS provisioning)

## Security and Authentication

- **Session Management**: `iron-session` (cookie-based)
- **Encryption**: AES-256-GCM for vault data
- **Authentication**: Clearance-gated (Level 0-2)
- **Secrets Management**: AWS Secrets Manager and Vercel encrypted env vars

## Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build
npm run build

# Tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Notes

- `.env` files are gitignored — use `.env.example` to document required environment variables
- Secrets (`.p12`, `.pem`, `.key`, `auth.json`) must never be committed
- All Supabase write operations use exponential back-off retry (base 500ms, cap 5000ms, max 2 retries)
- All AI API calls have fallback strategies (template-based generation for Claude failures, keyword search for vector DB failures)
