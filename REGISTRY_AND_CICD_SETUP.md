# Registry Setup & CI/CD Configuration Guide

## Overview

Your project now has a complete containerization and deployment pipeline:
- **Build**: Multi-stage Docker image (production runner + dev)
- **Test**: Smoke tests on container startup and health checks
- **Scan**: Security vulnerability scanning with Trivy
- **Push**: Dual registry deployment (Docker Hub + GitHub Container Registry)
- **Deploy**: Automated deployment with rollback on failure

---

## 1. Registry Setup

### Docker Hub

#### Create Docker Hub Account & Token
1. Sign up at [Docker Hub](https://hub.docker.com)
2. Create a repository: `your-username/imperial-codex`
3. Generate an access token:
   - Profile → Account Settings → Security → New Access Token
   - Copy the token (it's only shown once)

#### GitHub Secrets for Docker Hub
Add these secrets to your GitHub repository:
- **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username |
| `DOCKER_HUB_TOKEN` | Your Docker Hub access token |

### GitHub Container Registry (GHCR)

GHCR uses your GitHub account — no additional setup needed beyond existing `GITHUB_TOKEN`.

#### Access your images:
```bash
# Pull from GHCR
docker pull ghcr.io/YOUR-ORG/YOUR-REPO:latest

# Login (if needed)
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

---

## 2. Deployment Secrets

For the `deploy-verify.yml` workflow to work, add these secrets:

| Secret Name | Value | Description |
|---|---|---|
| `DEPLOY_HOST` | `your-server.com` | SSH host for deployment |
| `DEPLOY_USER` | `deploy` | SSH user on server |
| `DEPLOY_KEY` | (SSH private key) | SSH private key (PEM format, multiline) |
| `DEPLOY_PATH` | `/home/deploy/imperial-codex` | App path on server |
| `SLACK_WEBHOOK_URL` | (Slack webhook) | For Slack notifications (optional) |

#### Generating SSH key for deployment:
```bash
# Generate key (no passphrase)
ssh-keygen -t ed25519 -f deploy_key -N ""

# Add public key to server
cat deploy_key.pub >> ~/.ssh/authorized_keys

# Copy private key to GitHub Secrets (DEPLOY_KEY)
cat deploy_key
```

#### Slack webhook (optional):
1. Go to [Slack App Directory](https://api.slack.com/apps)
2. Create New App → From scratch
3. Enable Incoming Webhooks
4. Add Webhook to Workspace → select channel → copy URL

---

## 3. Workflows Explained

### `build-test-scan-push.yml`
**Trigger**: Push to `main`/`develop`, PR, or tag (`v*`)

**Steps**:
1. Build production image from Dockerfile (runner stage)
2. Smoke test: Container startup + `/api/health` check
3. Security scan with Trivy (results → GitHub Security tab)
4. Push to Docker Hub (tagged: `main`, `develop`, `v1.0.0`, git sha, `latest`)
5. Push to GHCR (same tags)
6. Push dev image to GHCR `:dev` tag (main/develop only)
7. Slack notification on success/failure

**Image tags generated** (example for `v1.2.3` tag):
- `your-username/imperial-codex:v1.2.3`
- `your-username/imperial-codex:1.2`
- `your-username/imperial-codex:latest`
- `your-username/imperial-codex:main-abc123`
- `ghcr.io/your-org/your-repo:v1.2.3`
- `ghcr.io/your-org/your-repo:dev` (on main/develop pushes)

### `deploy-verify.yml`
**Trigger**: Tag push (`v*`) or manual workflow dispatch

**Steps**:
1. Determine image tag (from git tag or latest)
2. SSH to server → pull image → `docker compose up -d`
3. Run database migrations (if `npm run db:migrate` exists)
4. Verify health: poll `/api/health` up to 60 attempts
5. Run smoke tests: home page, API, response time check
6. On failure: automatic rollback
7. Slack notification

---

## 4. Quick Start: Push Your First Image

### Step 1: Create GitHub secrets
```bash
# In GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret

DOCKER_HUB_USERNAME="your-username"
DOCKER_HUB_TOKEN="dckr_pat_xxxxxxxxxxxxx"
```

### Step 2: Create a tag and push
```bash
git tag v0.1.0
git push origin v0.1.0
```

### Step 3: Monitor workflow
- Go to **Actions** tab in GitHub
- Watch `Build → Test → Scan → Push` workflow
- Check Docker Hub & GHCR for new images

---

## 5. Local Testing (Before Pushing)

### Test build locally:
```bash
docker build -t imperial-codex:test .
```

### Test health check:
```bash
docker run -d --name test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  imperial-codex:test

# Wait 10 seconds, then test
sleep 10
curl http://localhost:3000/api/health
docker stop test
```

### Test security scan:
```bash
trivy image imperial-codex:test
```

---

## 6. Deployment: SSH Setup

### On your server:

```bash
# 1. Create deploy user
sudo adduser deploy
sudo usermod -aG docker deploy

# 2. Setup deployment directory
sudo mkdir -p /home/deploy/imperial-codex
sudo chown deploy:deploy /home/deploy/imperial-codex

# 3. Copy docker-compose.prod.yml to server
scp docker-compose.prod.yml deploy@your-server.com:/home/deploy/imperial-codex/

# 4. Create .env on server (manual, with secrets)
ssh deploy@your-server.com
cd /home/deploy/imperial-codex
nano .env  # Add your environment variables
```

### Create .env on server:
```bash
# .env (on server)
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=claude-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VAULT_ENCRYPTION_KEY=...
NEXT_PUBLIC_APP_URL=https://yourapp.com
SESSION_SECRET=...
CRON_SECRET=...
WEBHOOK_ALERT_URL=...
SLACK_BOT_TOKEN=...
GITHUB_TOKEN=...
GITHUB_REPO=your-org/your-repo
```

---

## 7. Monitoring & Troubleshooting

### View GitHub Actions logs:
- **Actions** tab → select workflow run → view logs

### View deployment logs on server:
```bash
ssh deploy@your-server.com
cd /home/deploy/imperial-codex
docker compose -f docker-compose.prod.yml logs -f app
```

### Check image security scan results:
- **GitHub** → **Security** → **Code scanning alerts** → Trivy results

### Pull latest image manually:
```bash
# On server
docker pull ghcr.io/your-org/your-repo:latest
docker compose -f docker-compose.prod.yml up -d
```

### Manual rollback:
```bash
# On server
docker compose -f docker-compose.prod.yml down
docker pull ghcr.io/your-org/your-repo:v0.1.0  # previous tag
docker compose -f docker-compose.prod.yml up -d
```

---

## 8. Health Check Endpoint

Ensure your app has a `/api/health` endpoint:

```typescript
// pages/api/health.ts (Next.js)
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
}
```

---

## 9. Matrix Builds (Optional)

To build for multiple architectures (arm64, amd64):

```yaml
strategy:
  matrix:
    platform:
      - linux/amd64
      - linux/arm64

steps:
  - uses: docker/build-push-action@v5
    with:
      platforms: ${{ matrix.platform }}
      # ... rest of config
```

---

## Checklist

- [ ] Docker Hub account created + token generated
- [ ] `DOCKER_HUB_USERNAME` secret added
- [ ] `DOCKER_HUB_TOKEN` secret added
- [ ] SSH key created for deployment
- [ ] `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, `DEPLOY_PATH` secrets added
- [ ] Server `/home/deploy/imperial-codex` directory ready
- [ ] `.env` file on server with all secrets
- [ ] First tag pushed: `git tag v0.1.0 && git push origin v0.1.0`
- [ ] Workflow completed successfully
- [ ] Image visible in Docker Hub and GHCR
- [ ] Health check endpoint implemented in app
- [ ] Deployment tested manually before using CD

---

## Support

For issues:
1. Check GitHub Actions logs
2. Run `docker compose logs` on server
3. Verify SSH access: `ssh -i deploy_key deploy@your-server.com`
4. Test health endpoint: `curl https://yourapp.com/api/health`
