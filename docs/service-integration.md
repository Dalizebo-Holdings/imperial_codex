# Imperial Codex — Service Integration Guide

This guide covers the comprehensive service integration architecture for Imperial Codex, including AWS, Docker, Supabase, Vercel, GitHub, Qdrant, Pinecone, and Redis.

---

## Overview

Imperial Codex integrates multiple cloud services to provide a robust, scalable infrastructure foundation:

| Service | Purpose |
|---------|---------|
| **AWS** | Cloud infrastructure (compute, storage, networking, security) |
| **Docker** | Containerization for local development and deployment consistency |
| **Supabase** | Primary persistence layer (PostgreSQL, authentication, storage) |
| **Vercel** | Deployment and hosting platform for Next.js applications |
| **GitHub** | Version control, CI/CD pipelines, and repository management |
| **Qdrant** | High-performance vector database for similarity search |
| **Pinecone** | Scalable vector database for machine learning applications |
| **Redis** | In-memory data store for caching, sessions, and real-time data |

---

## Architecture

### High-Level Architecture

```
+------------------------------------------------------------------+
|                        Browser (Client)                          |
|  React 19 Client Components                                      |
|  ChatWidget.tsx (streaming responses)                            |
|  KaTeX CSS, Fuse.js (search), polling (60s)                      |
+----------------------------+-------------------------------------+
                             | HTTPS
+----------------------------v-------------------------------------+
|                  Next.js 16.2 App Router                         |
|  middleware.ts  (auth gate, clearance check)                     |
|  /app           (Server Components, layouts)                     |
|  /app/api       (Route Handlers — JSON API + streaming)          |
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
|  SupabaseRepository (supabaseClient, supabaseServiceClient)      |
|  RedisRepository (redisClient)                                   |
|  QdrantRepository (qdrantClient)                                 |
|  PineconeRepository (pineconeClient)                             |
|  withRetry (exponential back-off utility)                        |
|  In-memory stores (Pillars, OS Modules, Library)                 |
+----------------------------+-------------------------------------+
                             |
+----------------------------+-------------------------------------+
|  Supabase PostgreSQL      |  Redis (cache, sessions)           |
|  - audit_log              |  - pillars:all (24h TTL)           |
|  - loop_execution_log     |  - os-modules:all (24h TTL)        |
|  - instruments            |  - library:all (1h TTL)            |
|  - instrument_registry    |  - capital-allocation:summary (5m) |
|  - capital_allocations    |  - loop-status:{id} (1m)           |
|  - capital_alloc_failures |                                    |
|  - vault                  |                                    |
|  - agent_conversations    |                                    |
|  - agent_messages         |                                    |
+----------------------------+-------------------------------------+
                             |
+----------------------------+-------------------------------------+
|  Qdrant (vector search)   |  Pinecone (vector search)          |
|  - library-embeddings     |  - imperial-codex-index            |
+----------------------------+-------------------------------------+
```

### Data Flow

**Write Path:**
1. Accept request → Validate authentication → Process business logic
2. Write to Supabase → Invalidate Redis cache → Update Qdrant/Pinecone embeddings

**Read Path:**
1. Accept request → Check Redis cache → If cache miss, query Supabase → Store in Redis → Return data

**Semantic Search:**
1. Generate embedding for query text
2. Query both Qdrant and Pinecone
3. Merge results using weighted scoring algorithm

---

## Service-Specific Configuration

### AWS Infrastructure

The AWS infrastructure is provisioned via Infrastructure-as-Code (Terraform) in the `/infrastructure/` directory.

**Resources:**
- **EC2 Instances** — Two t3.xlarge instances (production and staging)
- **S3 Buckets** — Three buckets for production, staging, and backup data
- **RDS PostgreSQL** — Production-grade PostgreSQL with multi-AZ deployment
- **IAM Roles** — Three roles with least-privilege permissions
- **CloudWatch Logs** — Centralized logging with 90-day retention
- **CloudWatch Alarms** — CPU > 80%, error rate > 1%, database connections > 80%

**Commands:**
```bash
# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy -target=module.infrastructure
```

### Docker Containerization

**Dockerfile** — Multi-stage build for production images:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml** — Development environment:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
  postgres:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: imperial
      POSTGRES_PASSWORD: imperial
      POSTGRES_DB: imperial
```

**Commands:**
```bash
# Start development environment
docker-compose up

# Stop development environment
docker-compose down

# Build production image
docker build -t imperial-codex .
```

### Supabase Integration

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Database Schema:**
- `audit_log` — Security events
- `loop_execution_log` — Loop execution records
- `instruments` — Generated DH-RES documents
- `instrument_registry` — Instrument index
- `capital_allocations` — Approved allocations
- `capital_allocation_failures` — Failed allocations
- `vault` — Encrypted secrets
- `agent_conversations` — Chat session metadata
- `agent_messages` — Chat messages

**Migration:**
```bash
# Apply migrations
supabase db push

# Create new migration
supabase migration new migration_name
```

### Vercel Deployment

**vercel.json** — Deployment configuration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/agent/cron",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/agent/cron",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VAULT_ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM |
| `SESSION_SECRET` | 32+ char secret for iron-session |
| `CRON_SECRET` | 32+ char secret for cron authentication |
| `WEBHOOK_ALERT_URL` | Optional webhook URL for critical alerts |

### GitHub CI/CD Pipeline

**Workflow** — `.github/workflows/ci-cd.yml`:
```yaml
name: CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Qdrant Vector Database

**Collection Configuration:**
- **Name:** `library-embeddings`
- **Vector dimension:** 1536 (OpenAI `text-embedding-3-large`)
- **Distance metric:** Cosine
- **Payload indexing:** Enabled for `os_module_slug`, `category`, `year`

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `QDRANT_URL` | Qdrant cluster URL |
| `QDRANT_API_KEY` | Qdrant API key |

**Commands:**
```bash
# Create collection
curl -X PUT $QDRANT_URL/collections/library-embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $QDRANT_API_KEY" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    },
    "on_disk_payload": true
  }'

# Upsert embeddings
curl -X POST $QDRANT_URL/collections/library-embeddings/points \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $QDRANT_API_KEY" \
  -d '{
    "points": [
      {
        "id": "entry-id",
        "vector": [0.1, 0.2, ...],
        "payload": {
          "os_module_slug": "TAX-OS",
          "category": "fiscal",
          "year": 2026
        }
      }
    ]
  }'
```

### Pinecone Vector Database

**Index Configuration:**
- **Name:** `imperial-codex-index`
- **Dimension:** 1536
- **Metric:** Cosine
- **Pod type:** s1.x1 (production)

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_ENVIRONMENT` | Pinecone environment (e.g., `gcp-starter`) |

**Commands:**
```bash
# Create index
pinecone indexes create imperial-codex-index \
  --dimension 1536 \
  --metric cosine \
  --pod-type s1.x1

# Upsert vectors
pinecone upsert \
  --index imperial-codex-index \
  --namespace default \
  --file embeddings.jsonl
```

### Redis In-Memory Data Store

**Cache Configuration:**
| Key | TTL | Description |
|-----|-----|-------------|
| `pillars:all` | 24 hours | All 207 Pillars |
| `os-modules:all` | 24 hours | All 36 OS Modules |
| `library:all` | 1 hour | All 345 Library entries |
| `capital-allocation:summary` | 5 minutes | Most recent allocation |
| `loop-status:{loop_id}` | 1 minute | Loop execution status |

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string (e.g., `redis://localhost:6379`) |

**Commands:**
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Check connection
redis-cli ping

# View cache keys
redis-cli keys '*'
```

---

## Authentication and Authorization

### Clearance Levels

| Level | Description | Access |
|-------|-------------|--------|
| **0** | Public | Read-only, no sensitive data |
| **1** | Standard | Read and write access to non-sensitive data |
| **2** | Admin | Full access to all data and system configuration |

### OAuth2 with GitHub

Developers authenticate with GitHub, and their organization membership is mapped to an Imperial Codex clearance level:
- **Dalizebo Holdings members** → Level 2 (Admin)
- **External contributors** → Level 1 (Standard)
- **Public** → Level 0 (Read-only)

---

## Cost Management

### Cost Monitoring

The `/api/cost/summary` route returns estimated monthly costs for each service:
- AWS EC2 instances
- AWS S3 storage
- AWS RDS PostgreSQL
- Supabase usage
- Vercel usage
- Qdrant usage
- Pinecone usage
- Redis usage

### Budget Alerts

When any service's usage exceeds 80% of the allocated budget:
- A warning is logged
- A notification is sent to the `#imperial-codex-alerts` Slack channel

### Cost Optimization

The `/api/cost/optimization` route provides recommendations:
- Downgrade underutilized resources
- Implement reserved instances for predictable workloads
- Use spot instances for non-critical workloads

---

## Security and Compliance

### Data Encryption

- **At rest:** AES-256-GCM encryption for sensitive fields
- **In transit:** TLS 1.3 for all external communications
- **Keys:** Stored in AWS Secrets Manager or Vercel's encrypted environment variables

### Audit Logging

All security events are logged with:
- Event type
- User ID
- Timestamp
- Resource
- Action

### Compliance

- SOC 2 Type II
- GDPR
- HIPAA (if applicable)

---

## Monitoring and Observability

### Health Checks

The `/api/health` route returns the health status of all integrated services:
```json
{
  "status": "healthy",
  "services": {
    "supabase": "healthy",
    "redis": "healthy",
    "qdrant": "healthy",
    "pinecone": "healthy"
  }
}
```

### Metrics

The `/api/metrics` route returns application metrics:
- Request rate
- Error rate
- Latency percentiles (p50, p95, p99)

### Alerting

When a metric exceeds a threshold (e.g., error rate > 1%):
- A notification is sent to the `#imperial-codex-alerts` Slack channel

---

## Development Environment Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Supabase CLI (optional, for local development)
- Terraform (optional, for local infrastructure testing)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dalizebo/imperial-codex.git
cd imperial-codex

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development environment
docker-compose up

# Run development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:
```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Vault
VAULT_ENCRYPTION_KEY=64-char-hex-key
SESSION_SECRET=32-char-secret
CRON_SECRET=32-char-secret

# Redis
REDIS_URL=redis://localhost:6379

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key

# Pinecone
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=gcp-starter

# Webhook (optional)
WEBHOOK_ALERT_URL=https://hooks.slack.com/services/...
```

---

## Troubleshooting

### Supabase Connection Errors

- Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
- Ensure the migration SQL has been applied (check the Table Editor in Supabase)
- Check that Row Level Security policies are configured correctly

### Redis Cache Misses

- Verify `REDIS_URL` is set correctly
- Check that Redis is running (`docker-compose ps`)
- Check Redis memory usage (`docker stats`)

### Qdrant/Pinecone Search Issues

- Verify `QDRANT_URL` and `PINECONE_API_KEY` are set correctly
- Check that embeddings have been upserted to the vector databases
- Verify the embedding model output dimension matches the collection/index dimension (1536)

### Docker Build Failures

- Check that all dependencies are listed in `package.json`
- Verify that the `.dockerignore` file excludes unnecessary files
- Check Docker daemon logs for more details

### Cost Alerts

- Review the `/api/cost/summary` response to identify high-cost services
- Consider downgrading underutilized resources
- Implement reserved instances for predictable workloads

---

## Next Steps

1. **Review the architecture diagram** — Understand how services interact
2. **Set up your development environment** — Follow the quick start guide
3. **Review the service-specific documentation** — Learn more about each service
4. **Start developing** — Begin implementing features using the integrated services