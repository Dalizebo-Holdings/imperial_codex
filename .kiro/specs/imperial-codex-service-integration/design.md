# Design Document

## Imperial Codex — Comprehensive Service Integration

---

## Introduction

This design document outlines the architecture and implementation strategy for integrating AWS, Docker, Supabase, Vercel, GitHub, Qdrant, Pinecone, and Redis into the Imperial Codex project.

The design follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Presentation Layer                              │
│                         (Next.js App Router)                                 │
│                    /src/app/(protected)/dashboard                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer                               │
│                         (API Routes & Services)                              │
│                    /src/app/api/* & /lib/*                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                      │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│         │Supabase  │  │  Redis   │  │  Qdrant  │  │ Pinecone │              │
│         │ PostgreSQL│ │  Cache   │  │  Vector  │  │  Vector  │              │
│         └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Infrastructure Layer                            │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│         │   AWS    │  │  Docker  │  │  GitHub  │  │  Vercel  │              │
│         │  Cloud   │  │Container │  │  CI/CD   │  │  Deploy  │              │
│         └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### Service Responsibilities

| Service | Responsibility | Key Resources |
|---------|---------------|---------------|
| **AWS** | Infrastructure provisioning, compute, storage, security | EC2, S3, RDS, IAM, CloudWatch |
| **Docker** | Containerization for local development and deployment consistency | Dockerfile, docker-compose.yml |
| **Supabase** | Primary persistence layer (PostgreSQL), authentication, real-time | PostgreSQL, Auth, Storage |
| **Vercel** | Deployment and hosting platform for Next.js | Edge Network, Serverless Functions |
| **GitHub** | Version control, CI/CD pipelines, repository management | Git Repository, Actions |
| **Qdrant** | High-performance vector database for similarity search | `library-embeddings` collection |
| **Pinecone** | Scalable vector database for ML applications | `imperial-codex-index` |
| **Redis** | In-memory data store for caching and sessions | Cache entries, session store |

### Data Flow

**Write Path:**
```
Request → Auth Check → Business Logic → Supabase (Primary DB)
                                      ↓
                              Redis Cache (Invalidate)
                                      ↓
                         Qdrant/Pinecone (Embeddings)
```

**Read Path:**
```
Request → Auth Check → Redis Cache (Check first)
                                      ↓
                              Supabase (Cache miss)
                                      ↓
                         Redis Cache (Store result)
```

---

## Authentication & Authorization Strategy

### Unified Auth Flow

```
┌─────────────┐
│   GitHub    │
│   OAuth2    │
└──────┬──────┘
       │
       │ User authenticates with GitHub
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Imperial Codex App                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. User clicks "Sign in with GitHub"                │   │
│  │  2. Redirect to GitHub OAuth consent screen          │   │
│  │  3. GitHub redirects back with authorization code    │   │
│  │  4. App exchanges code for user profile              │   │
│  │  5. App creates/updates user in Supabase Auth        │   │
│  │  6. App creates session in Redis with TTL            │   │
│  │  7. App sets JWT cookie for subsequent requests      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Clearance Levels

| Level | Name | Permissions | GitHub Requirement |
|-------|------|-------------|-------------------|
| 0 | Public | Read-only, no sensitive data | None |
| 1 | Standard | Read/write non-sensitive data | GitHub account |
| 2 | Admin | Full access to all data and config | GitHub org membership |

### Session Management

```typescript
// Session structure in Redis
{
  "session:{userId}": {
    "userId": "uuid",
    "githubId": "string",
    "clearanceLevel": 0|1|2,
    "createdAt": "timestamp",
    "expiresAt": "timestamp",
    "organizations": ["org1", "org2"]
  }
}
```

---

## Data Storage Strategy

### Database Selection Matrix

| Data Type | Storage | Reason |
|-----------|---------|--------|
| User accounts, auth | Supabase Auth | Managed authentication with OAuth2 |
| Relational data (instruments, capital allocations) | Supabase PostgreSQL | ACID compliance, complex queries |
| Vector embeddings | Qdrant + Pinecone | High-performance similarity search |
| Session data | Redis | Low-latency access, TTL support |
| Cache (Pillars, OS Modules, Library) | Redis | Fast reads, configurable TTL |
| Audit logs | Supabase PostgreSQL | Historical records, compliance |
| Loop execution logs | Supabase PostgreSQL | Historical records, analysis |

### Database Schema (Supabase)

```sql
-- Users and authentication
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  encrypted_password TEXT,
  clearance_level INTEGER DEFAULT 0,
  github_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for security events
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Loop execution history
CREATE TABLE loop_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id TEXT NOT NULL,
  trigger_conditions JSONB,
  outcome TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Instruments (Library entries)
CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  os_module_slug TEXT REFERENCES os_modules(slug),
  category TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capital allocations
CREATE TABLE capital_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision TEXT NOT NULL,
  amount DECIMAL(12,2),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent conversations
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent messages
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id),
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Redis Cache Keys

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `pillars:all` | 24h | All Strategic Pillars |
| `os-modules:all` | 24h | All Operating Systems |
| `library:all` | 1h | All Library entries |
| `capital-allocation:summary` | 5m | Capital allocation summary |
| `loop-status:{loop_id}` | 1m | Loop execution status |
| `session:{user_id}` | 7d | User session data |

---

## Deployment Pipeline

### CI/CD Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│  GitHub     │────▶│   Vercel    │────▶│   Production│
│  Repository │     │   Actions   │     │  Deployment │     │   Environment│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                         │
                         │ develop branch
                         │
                         ▼
                  ┌─────────────┐
                  │  Docker     │
                  │  Build &    │
                  │  Push to    │
                  │  Registry   │
                  └─────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

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
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build

  deploy-develop:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v30
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --token=${{ secrets.VERCEL_TOKEN }}'

  deploy-main:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v30
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod --token=${{ secrets.VERCEL_TOKEN }}'
```

---

## Development Environment Setup

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - PINECONE_API_KEY=${PINECONE_API_KEY}
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      - postgres
    command: npm run dev

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=imperial_codex
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=imperial_codex
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  postgres-data:
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for production build
ENV NODE_ENV=production
RUN npm run build

# Production image
FROM base AS production
WORKDIR /app

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

---

## Service Integration Patterns

### Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (for server-side operations that bypass RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### Redis Client Configuration

```typescript
// lib/redis/client.ts
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Handle reconnection
redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Connected to Redis'));

export default redis;
```

### Qdrant Client Configuration

```typescript
// lib/qdrant/client.ts
import { QdrantClient } from '@qdrant/qdrant-client';

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY;

export const qdrant = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});
```

### Pinecone Client Configuration

```typescript
// lib/pinecone/client.ts
import { PineconeClient } from '@pinecone-database/pinecone';

export const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
});
```

---

## Security Design

### Encryption Strategy

| Data Type | Encryption Method | Key Management |
|-----------|------------------|----------------|
| Sensitive fields in DB | AES-256-GCM | AWS KMS |
| API keys in config | Vercel encrypted env vars | Vercel |
| Database passwords | AWS Secrets Manager | AWS |
| Session tokens | JWT signing | Environment secret |

### Audit Logging

```typescript
// lib/audit/logger.ts
export async function logSecurityEvent(
  userId: string,
  resource: string,
  action: string,
  decision: string
) {
  const { error } = await supabaseAdmin
    .from('audit_log')
    .insert({
      user_id: userId,
      resource,
      action,
      decision,
    });

  if (error) {
    console.error('Failed to log security event:', error);
  }
}
```

---

## Monitoring & Observability

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    supabase: false,
    redis: false,
    qdrant: false,
    pinecone: false,
  };

  // Check Supabase
  try {
    await supabase.from('instruments').select('count', { count: 'exact', head: true });
    checks.supabase = true;
  } catch (e) {
    console.error('Supabase health check failed:', e);
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = true;
  } catch (e) {
    console.error('Redis health check failed:', e);
  }

  // Check Qdrant
  try {
    await qdrant.healthCheck();
    checks.qdrant = true;
  } catch (e) {
    console.error('Qdrant health check failed:', e);
  }

  // Check Pinecone
  try {
    await pinecone.describeIndex('imperial-codex-index');
    checks.pinecone = true;
  } catch (e) {
    console.error('Pinecone health check failed:', e);
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

### Cost Monitoring

```typescript
// lib/cost/monitor.ts
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';

const ceClient = new CostExplorerClient({ region: 'us-east-1' });

export async function getCostSummary() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const command = new GetCostAndUsageCommand({
    TimePeriod: {
      Start: startDate.toISOString().split('T')[0],
      End: endDate.toISOString().split('T')[0],
    },
    Granularity: 'DAILY',
    Metrics: ['UNBLENDED_COST'],
    GroupBy: [
      { Type: 'DIMENSION', Key: 'SERVICE' },
    ],
  });

  const response = await ceClient.send(command);
  return response.ResultsByTime;
}
```

---

## Implementation Tasks

### Phase 1: Infrastructure Setup
1. [ ] Set up AWS account and configure IAM user
2. [ ] Provision EC2 instances, S3 buckets, RDS PostgreSQL
3. [ ] Configure CloudWatch Logs and Alarms
4. [ ] Set up AWS Secrets Manager for sensitive data

### Phase 2: Containerization
1. [ ] Create Dockerfile for Next.js application
2. [ ] Create docker-compose.yml for local development
3. [ ] Set up Docker Hub or ECR for image registry
4. [ ] Configure CI/CD to build and push Docker images

### Phase 3: Supabase Integration
1. [ ] Create Supabase project and configure database
2. [ ] Set up Row Level Security policies
3. [ ] Create database migrations
4. [ ] Implement Supabase client in application

### Phase 4: Vector Database Integration
1. [ ] Set up Qdrant instance (self-hosted or cloud)
2. [ ] Create `library-embeddings` collection
3. [ ] Set up Pinecone index
4. [ ] Implement embedding generation and search

### Phase 5: Redis Integration
1. [ ] Set up Redis instance (ElastiCache or self-hosted)
2. [ ] Implement caching layer
3. [ ] Configure session storage
4. [ ] Set up cache invalidation

### Phase 6: Deployment Configuration
1. [ ] Configure Vercel project
2. [ ] Set up GitHub Actions CI/CD
3. [ ] Configure environment variables
4. [ ] Set up preview deployments

### Phase 7: Security & Monitoring
1. [ ] Implement audit logging
2. [ ] Set up CloudWatch alarms
3. [ ] Configure cost monitoring
4. [ ] Implement health check endpoints

---

## Next Steps

1. **Review and approve this design document**
2. **Create implementation tasks in tasks.md**
3. **Begin Phase 1: Infrastructure Setup**
4. **Set up development environment with Docker**
5. **Implement Supabase integration as the foundation**
