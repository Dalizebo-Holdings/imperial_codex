---
name: docker-patterns
description: >
  Docker and Docker Compose patterns for local development, container security,
  networking, volume strategies, and multi-service orchestration. Use when
  setting up containerized development environments, optimizing Dockerfiles,
  auditing container security, or reviewing Docker configurations.
  Tailored for the imperial_codex Next.js 20 / Node.js stack.
metadata:
  sources:
    - affaan-m/everything-claude-code (.kiro/skills/docker-patterns/SKILL.md)
    - LeoYeAI/openclaw-master-skills (docker-essentials + docker-development)
    - miqui/oh-my-claude (skills/docker/docker.md)
    - Impertio-Studio/Docker-Claude-Skill-Package
  consolidated: true
  version: 1.0.0
---

# Docker Patterns

Consolidated Docker and Docker Compose best practices extracted from community
skill repositories. Covers local development, security hardening, networking,
volume management, multi-service orchestration, and production-ready patterns.

---

## When to Activate

- Setting up Docker Compose for local development
- Designing multi-container architectures
- Troubleshooting container networking or volume issues
- Reviewing or optimizing Dockerfiles for security and size
- Implementing multi-stage builds
- Auditing container security
- Migrating from local dev to a containerized workflow

---

## Slash Commands

| Command            | What it does                                                         |
| ------------------ | -------------------------------------------------------------------- |
| `/docker:optimize` | Analyze and optimize a Dockerfile for size, speed, and layer caching |
| `/docker:compose`  | Generate or improve docker-compose.yml with best practices           |
| `/docker:security` | Audit a Dockerfile or running container for security issues          |

---

## 1. Local Development

### Standard Web App Compose Stack

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: dev # Use dev stage of multi-stage Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app # Bind mount for hot reload
      - /app/node_modules # Anonymous volume — preserves container deps
      - /app/.next # Protect Next.js build cache
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://redis:6379/0
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5432:5432" # Only accessible from host
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redisdata:/data

  mailpit: # Local email testing
    image: axllent/mailpit
    ports:
      - "8025:8025" # Web UI
      - "1025:1025" # SMTP

volumes:
  pgdata:
  redisdata:
```

### Dev vs Production Override Files

```yaml
# docker-compose.override.yml (auto-loaded, dev-only)
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "9229:9229"                   # Node.js inspector/debugger

# docker-compose.prod.yml (explicit for production)
services:
  app:
    build:
      target: production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

```bash
# Development (auto-loads override)
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 2. Multi-Stage Dockerfile Patterns

### Pattern: Node.js / Next.js (matches imperial_codex stack)

```dockerfile
# Stage: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage: dev (hot reload, debug tools)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage: production (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

### Pattern: Compiled Language (Go / Rust)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

### Pattern: Python

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /install /usr/local
COPY . .
USER appuser
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Base Image Decision Tree

```
Is it a compiled binary (Go, Rust, C)?
├── Yes → distroless/static or scratch
└── No
    ├── Need a shell for debugging?
    │   ├── Yes → alpine variant (e.g., node:20-alpine)
    │   └── No → distroless variant
    ├── Need glibc (not musl)?
    │   ├── Yes → slim variant (e.g., python:3.12-slim)
    │   └── No → alpine variant
    └── Need many OS packages?
        ├── Yes → debian-slim
        └── No → alpine + apk add
```

---

## 3. Networking

### Service Discovery

Services in the same Compose network resolve by service name:

```
# From "app" container:
postgres://postgres:postgres@db:5432/app_dev   # "db" resolves to db container
redis://redis:6379/0                            # "redis" resolves to redis container
```

### Custom Networks (Segmentation)

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net # Only reachable from api, not frontend

networks:
  frontend-net:
  backend-net:
    internal: true # No external internet access
```

### Port Exposure Rules

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432" # Host-only; omit entirely in production
  app:
    ports:
      - "3000:3000" # Expose only what users/LB need
```

### Debugging Network Issues

```bash
docker compose exec app nslookup db
docker compose exec app wget -qO- http://api:3000/health
docker network ls
docker network inspect <project>_default
```

---

## 4. Volume Strategies

```yaml
volumes:
  pgdata: # Named — persists across restarts, Docker-managed
  redisdata:

services:
  app:
    volumes:
      - .:/app # Bind mount for hot reload (dev only)
      - /app/node_modules # Anonymous — protect container deps
      - /app/.next # Protect build cache

  db:
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
```

```bash
docker volume ls
docker volume inspect pgdata
docker volume prune                    # Remove unused volumes
docker compose down -v                 # ⚠ DESTRUCTIVE — removes volumes
```

---

## 5. Container Security

### Dockerfile Hardening

```dockerfile
# 1. Pin specific tags — never :latest in production
FROM node:20.19-alpine3.20

# 2. Run as non-root
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app

# 3. No secrets baked into image layers
# Use BuildKit secret mounts or runtime env injection

# 4. Add HEALTHCHECK
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

# 5. Clean package manager cache in the same RUN layer
RUN apk add --no-cache curl && rm -rf /var/cache/apk/*
```

### Compose Security Options

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/.cache
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE # Only if binding port < 1024
```

### Secret Management

```yaml
# GOOD: env_file (never committed)
services:
  app:
    env_file:
      - .env
    environment:
      - API_KEY                       # Inherits from host shell

# GOOD: Docker secrets (Swarm / production)
secrets:
  db_password:
    file: ./secrets/db_password.txt
services:
  db:
    secrets:
      - db_password

# BAD — never do this:
# ENV API_KEY=sk-proj-xxxxx
# ARG SECRET=value
```

### Security Audit Checklist

| Check                                             | Severity | Fix                                     |
| ------------------------------------------------- | -------- | --------------------------------------- |
| Running as root                                   | Critical | Add `USER` after creating non-root user |
| Using `:latest` tag                               | High     | Pin to specific version                 |
| Secrets in `ENV`/`ARG`                            | Critical | Use BuildKit secret mounts              |
| No `HEALTHCHECK`                                  | Medium   | Add HEALTHCHECK with interval/timeout   |
| Writable root filesystem                          | Medium   | `read_only: true` in compose            |
| All capabilities retained                         | High     | `cap_drop: [ALL]`                       |
| No resource limits                                | Medium   | Set `mem_limit` and `cpus`              |
| Host network mode                                 | High     | Use bridge or custom network            |
| Sensitive mounts (`/etc`, `/var/run/docker.sock`) | Critical | Never in production                     |
| Package cache retained                            | Low      | Clean in same `RUN` layer               |

---

## 6. Container Lifecycle & Management

### Running Containers

```bash
docker run -d --name my-app -p 3000:3000 -e NODE_ENV=production app:1.0
docker run --rm -it node:20-alpine sh           # One-off, auto-removed
docker run -v $(pwd):/app -w /app node:20 npm run dev
```

### Managing Containers

```bash
docker ps                    # Running
docker ps -a                 # All (including stopped)
docker stop my-app
docker start my-app
docker restart my-app
docker rm my-app
docker rm -f my-app          # Force remove running container
docker container prune       # Remove all stopped containers
```

### Logs & Debugging

```bash
docker logs -f my-app
docker logs --tail 100 my-app
docker exec -it my-app sh
docker exec -u root -it my-app bash
docker inspect my-app
docker stats                              # Resource usage (all containers)
docker top my-app                         # Processes inside container

# Copy files
docker cp my-app:/app/config.json ./local/
docker cp ./local/file my-app:/app/file
```

---

## 7. Image Management

```bash
docker build -t myapp:1.0 .
docker build -f Dockerfile.dev -t myapp:dev .
docker build --build-arg VERSION=1.0 -t myapp .
docker build --no-cache -t myapp .

docker images
docker pull node:20-alpine
docker tag myapp:1.0 myapp:latest
docker push myrepo/myapp:1.0
docker rmi myapp:old
docker image prune -a                    # Remove all unused images
```

---

## 8. .dockerignore (Next.js / Node)

```
node_modules
.git
.env
.env.*
.next
dist
coverage
*.log
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
infrastructure/
.kiro/
core/
vault/
```

---

## 9. System Cleanup

```bash
docker system df                         # Disk usage
docker system prune                      # Remove unused containers, networks, images
docker system prune -a                   # Include unused images
docker system prune --volumes            # ⚠ Also remove volumes
```

---

## 10. Proactive Flags (Auto-trigger on these patterns)

- **`:latest` tag detected** → Pin to a specific version tag
- **No `.dockerignore`** → Create one; at minimum exclude `.git`, `node_modules`, `.env`, `.next`
- **`COPY . .` before dependency install** → Cache bust — reorder to install deps first
- **Running as root** → Add `USER` instruction; no exceptions for production
- **Secrets in `ENV` or `ARG`** → Use BuildKit secret mounts; never bake into layers
- **Image over 500MB for Node apps** → Multi-stage build required
- **No `HEALTHCHECK`** → Orchestrators need it for proper lifecycle management
- **`apt-get` without cleanup in same layer** → Add `rm -rf /var/lib/apt/lists/*`
- **`docker.sock` mounted** → Flag as Critical security risk in production

---

## 11. Anti-Patterns

```
BAD: docker compose in production without orchestration
     → Use Kubernetes, ECS, or Docker Swarm for production multi-container workloads

BAD: Storing data in containers without volumes
     → Containers are ephemeral — data lost on restart without volumes

BAD: Running as root
     → Always create and switch to a non-root user

BAD: Using :latest tag
     → Pin to specific versions for reproducible builds

BAD: One giant container with all services
     → One process per container

BAD: Secrets in docker-compose.yml or Dockerfile
     → Use .env files (gitignored) or Docker secrets

BAD: Mounting /var/run/docker.sock in production
     → Gives container full control of the host Docker daemon

BAD: COPY . . before npm install / pip install
     → Invalidates layer cache on every code change
```

---

## 12. Quick Reference

```bash
# Compose lifecycle
docker compose up -d
docker compose down
docker compose logs -f app
docker compose exec app sh
docker compose ps
docker compose build --no-cache app
docker compose up --build

# Multi-file compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale a service
docker compose up -d --scale worker=3
```

---

## Sources

Content paraphrased and consolidated from:

- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) — docker-patterns skill (MIT)
- [LeoYeAI/openclaw-master-skills](https://github.com/LeoYeAI/openclaw-master-skills) — docker-essentials + docker-development (MIT)
- [miqui/oh-my-claude](https://github.com/miqui/oh-my-claude) — docker patterns (MIT)
- [Impertio-Studio/Docker-Claude-Skill-Package](https://github.com/Impertio-Studio/Docker-Claude-Skill-Package) — security audit patterns

_Content was paraphrased and restructured for compliance with licensing restrictions and adapted for the imperial_codex Next.js/Node.js stack._
