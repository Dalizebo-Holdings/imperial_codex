# Docker Registry & CI/CD Setup Guide

## Docker Registry Push

### Prerequisites
- Docker installed and running
- Docker Hub account (or custom registry)
- Image built locally: `docker build --target runner -t imperial-codex:latest .`

### Manual Push (Docker Hub)

1. **Log in to Docker Hub:**
   ```bash
   docker login
   # Enter your username and personal access token (PAT)
   ```

2. **Build the production image:**
   ```bash
   docker build --target runner -t imperial-codex:latest .
   ```

3. **Use the push script:**
   ```bash
   chmod +x docker-push.sh
   ./docker-push.sh docker.io your-username/imperial-codex latest
   # or: ./docker-push.sh docker.io your-username/imperial-codex v1.0.0
   ```

   The script will:
   - Verify the image exists
   - Tag it for your registry
   - Push to Docker Hub
   - Also push as `latest` tag
   - Print the pull command

4. **Verify in Docker Hub:**
   Visit `https://hub.docker.com/r/your-username/imperial-codex`

### Push to Private Registry

```bash
./docker-push.sh my-registry.azurecr.io my-app v1.0.0
# First authenticate: az acr login --name my-registry
```

---

## Production docker-compose.yml

The production compose file includes:

- **Health checks** — HTTP 200 probe every 30s (5s timeout, 3 retries, 10s startup grace)
- **Read-only filesystem** — Prevents unwanted file writes
- **Security hardening** — Dropped ALL capabilities except NET_BIND_SERVICE, no new privileges
- **Resource limits** — CPU: 0.5-1, Memory: 512M-1G
- **Logging** — JSON driver with 10MB max size, 3 files rotation
- **Volume mounts** — core/vault/rituals as read-only

**Start production container:**
```bash
docker compose up -d
docker compose ps
docker compose logs -f app
```

**Monitor health:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
# Status will show: "Up 2 minutes (healthy)"
```

---

## CI/CD with GitHub Actions

### Setup

1. **Create Docker Hub Personal Access Token (PAT):**
   - Go to `https://hub.docker.com/settings/security`
   - Click "New Access Token"
   - Name it `imperial-codex-ci`
   - Copy the token

2. **Add GitHub Secrets:**
   - Go to repo → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `DOCKER_HUB_USERNAME` = your Docker Hub username
     - `DOCKER_HUB_TOKEN` = the PAT from step 1

3. **Workflow triggers automatically on:**
   - Push to `main` or `develop` branches
   - Git tags starting with `v` (e.g., `v1.0.0`)
   - Pull requests to `main`

### Workflow Steps

The `.github/workflows/docker-build-push.yml` file:

1. **Checks out code** from the push/tag
2. **Sets up Docker Buildx** for multi-platform builds
3. **Logs into Docker Hub** (skipped for PRs)
4. **Extracts metadata** — generates tags:
   - Branch name (e.g., `main`)
   - Semantic version from git tags (e.g., `v1.2.3` → `1.2.3`, `1.2`)
   - Short commit SHA (e.g., `main-abc1234`)
   - `latest` (only for default branch)
5. **Builds production image** (`runner` target) with layer caching
6. **Builds dev image** (`development` target) and tags as `dev`
7. **Pushes to Docker Hub** (only on push events, not PRs)

### Example Workflows

**Push to main:**
```bash
git push origin main
# → Builds & pushes: your-user/imperial-codex:main, :latest
```

**Release with semantic versioning:**
```bash
git tag v1.2.3
git push origin v1.2.3
# → Builds & pushes: your-user/imperial-codex:1.2.3, :1.2, :latest
```

**Create feature branch:**
```bash
git push origin feature/new-feature
# → Builds (no push): your-user/imperial-codex:feature-new-feature
```

### View Build Logs

- Go to repo → Actions tab
- Click the workflow run
- Expand job steps to see build output

### Pull Image from Registry

After successful push:

```bash
# Pull latest
docker pull your-user/imperial-codex:latest

# Or specific version
docker pull your-user/imperial-codex:v1.2.3

# Run it
docker run -p 3000:3000 --env-file .env.local your-user/imperial-codex:latest
```

---

## Layer Caching in CI

The workflow uses Docker buildkit cache for faster rebuilds:

```yaml
cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
```

This stores build layers in your registry's `buildcache` tag, so subsequent builds reuse unchanged layers (npm dependencies, base images, etc.).

First build: ~5-10 minutes  
Subsequent builds: ~1-2 minutes (with cache hits)

---

## Troubleshooting

**Auth failure in GitHub Actions:**
```
Error response from daemon: Get token: access denied
```
→ Check `DOCKER_HUB_TOKEN` secret is correct and hasn't expired

**Image not pushed but build succeeded:**
→ Workflow only pushes on `push` events, not PRs. Merge PR to `main` to trigger push.

**Build cache not working:**
→ Clear registry cache: `docker buildx du` and rebuild

**Health check failing:**
```
Status: Up 1 minute (unhealthy)
```
→ Run `docker logs imperial_codex-app` to see errors. Check `NODE_ENV=production` and all env vars are set.

---

## Next Steps

- Set up deployment triggers (Vercel, Kubernetes, etc.) on successful Docker push
- Add image signing/scanning (Docker Content Trust, Trivy)
- Enable Dependabot for automated dependency updates
- Add integration tests in CI pipeline before pushing
