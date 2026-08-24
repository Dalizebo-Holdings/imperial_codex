# Imperial Codex — CI/CD & Deployment Guide

## GitHub Actions Setup

This project includes automated CI/CD with GitHub Actions:

### 1. Build & Push Workflow (`.github/workflows/docker-build-push.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Git tags matching `v*` (semantic versioning)
- Pull requests to `main` or `develop`

**What it does:**
- Builds Docker image using Buildx for layer caching
- Pushes to GitHub Container Registry (GHCR)
- Runs Trivy security scanning
- Tags images by branch, semver, and commit SHA

**Image naming:**
- `ghcr.io/username/repo:main` (from main branch)
- `ghcr.io/username/repo:develop` (from develop branch)
- `ghcr.io/username/repo:v1.2.3` (from git tag)
- `ghcr.io/username/repo:latest` (latest from main)

---

### 2. Deploy Workflow (`.github/workflows/deploy-production.yml`)

**Triggers:**
- Git tags matching `v*` (automatic)
- Manual trigger via GitHub UI (workflow_dispatch)

**Prerequisites:**
Set these secrets in GitHub Settings → Secrets and Variables:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Production server IP/hostname |
| `DEPLOY_USER` | SSH user (e.g., `ubuntu`) |
| `DEPLOY_KEY` | SSH private key for deployment |
| `DEPLOY_PATH` | Path to app on server (e.g., `/home/ubuntu/imperial-codex`) |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook for notifications |

**What it does:**
- Pulls latest image from GHCR
- Restarts containers with `docker-compose.prod.yml`
- Runs database migrations (if applicable)
- Cleans up old images
- Sends Slack notifications on success/failure

---

## Production Deployment

### Option 1: Automatic (Tag-based)

```bash
# Tag and push to trigger automatic deployment
git tag v1.2.3
git push origin v1.2.3
```

GitHub Actions will:
1. Build and push `ghcr.io/username/repo:v1.2.3`
2. Deploy to production automatically

### Option 2: Manual (Workflow Dispatch)

1. Go to GitHub → Actions → Deploy to Production
2. Click "Run workflow"
3. Select environment (staging/production)
4. Click "Run"

### Option 3: SSH Script

```bash
# Make script executable
chmod +x deploy.sh

# Deploy manually
./deploy.sh v1.2.3 production
```

Requires `.env.production` file with all secrets.

---

## Resource Limits

**docker-compose.yml** (default):
- CPU limit: 1 core
- Memory limit: 1GB
- CPU reservation: 0.5 cores
- Memory reservation: 512MB

**docker-compose.prod.yml** (recommended for production):
- CPU limit: 2 cores
- Memory limit: 2GB
- CPU reservation: 1 core
- Memory reservation: 1GB

Adjust these based on your load testing results:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

---

## Environment Management

### Local Development
```bash
cp .env.example .env.local
# Edit .env.local with your keys
docker compose -f docker-compose.dev.yml up
```

### Staging
```bash
cp .env.example .env.staging
# Edit .env.staging
docker compose -f docker-compose.prod.yml --env-file .env.staging up
```

### Production
```bash
# On server:
cp .env.example .env.production
# Edit .env.production with production secrets
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## Monitoring & Logs

```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# View application logs
docker compose -f docker-compose.prod.yml logs -f app

# View recent logs
docker compose -f docker-compose.prod.yml logs --tail=100 app

# Check health status
docker compose -f docker-compose.prod.yml exec app curl http://localhost:3000
```

---

## Security Best Practices

✅ **Implemented:**
- Non-root user (`nextjs` UID 1001)
- Health checks for orchestration
- Dropped all capabilities except NET_BIND_SERVICE
- `no-new-privileges` security option
- Trivy vulnerability scanning in CI/CD
- Separate staging/production environments

⚠️ **Additional steps:**
- Use environment-specific `.env` files (never commit secrets)
- Store secrets in GitHub Secrets, not in code
- Enable branch protection rules requiring PR reviews
- Rotate deployment SSH keys regularly
- Use private container registry for sensitive images

---

## Troubleshooting

### Image fails to pull

```bash
# Check if logged into GHCR
docker login ghcr.io -u USERNAME -p TOKEN

# Token must have `packages:read` scope
```

### Deployment timeout

```bash
# SSH into server and check container status
docker compose -f docker-compose.prod.yml logs app
docker compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3000
```

### OOM (Out of Memory) errors

```bash
# Check current memory usage
docker compose -f docker-compose.prod.yml stats app

# Increase limits in docker-compose.prod.yml
# Then redeploy
```
