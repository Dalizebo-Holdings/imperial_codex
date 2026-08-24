# Imperial Codex: Setup Checklist

Complete this checklist once. Then use the "Daily Workflow" section for each development cycle.

---

## ✅ ONE-TIME SETUP

### Accounts & Credentials (Step 1)
- [ ] Docker Hub account (https://hub.docker.com)
- [ ] GitHub repo cloned locally
- [ ] Docker Desktop installed & running
- [ ] Docker Hub Personal Access Token created (https://hub.docker.com/settings/security)
- [ ] GitHub Secrets added:
  - [ ] `DOCKER_HUB_USERNAME`
  - [ ] `DOCKER_HUB_TOKEN`
- [ ] (Optional) Slack workspace for alerts
- [ ] (Optional) Slack webhook created for #imperial-codex-alerts

### Local Environment (Step 1.1)
- [ ] `git clone https://github.com/your-username/imperial-codex.git`
- [ ] `cd imperial-codex`
- [ ] `npm install`
- [ ] `cp .env.example .env.local`
- [ ] `nano .env.local` (fill in all secrets)

### Docker Tooling (First-time Setup)
- [ ] `chmod +x docker-push.sh`
- [ ] `chmod +x docker-health-check.sh`
- [ ] `chmod +x docker-health-monitor.sh`

### VS Code (Optional but Recommended)
- [ ] Install "Dev Containers" extension
- [ ] Install "Docker" extension (official)
- [ ] Install "Remote - Containers" extension

---

## 📅 DAILY WORKFLOW

### Starting Development Session

```bash
# Option A: Dev Container (Recommended)
code .
# Ctrl+Shift+P → "Dev Containers: Reopen in Container"
# Wait 2-3 min first time

# Option B: Local with hot reload
docker compose -f docker-compose.dev.yml up
```

- [ ] Container started successfully
- [ ] `npm run dev` running (or started automatically)
- [ ] Visit http://localhost:3000 → app loads
- [ ] Edit `src/` file → see changes in real-time

### Debugging (If Needed)

- [ ] Press `Ctrl+Shift+D` (Debug panel)
- [ ] Select "Attach to Docker Container"
- [ ] Press `F5` to connect
- [ ] Set breakpoint in TypeScript
- [ ] Refresh browser → hit breakpoint

### Pushing Code

```bash
# Commit your changes
git add .
git commit -m "Your message"
git push origin main
```

- [ ] GitHub Actions triggered (check Actions tab)
- [ ] Wait 3-5 minutes for build
- [ ] Docker image pushed to Docker Hub
- [ ] Image available as: `your-username/imperial-codex:main`

### Testing Before Release

```bash
# Pull your image
docker pull your-username/imperial-codex:main

# Test it locally
docker run -p 3000:3000 --env-file .env.local your-username/imperial-codex:main

# Visit http://localhost:3000 to verify
```

- [ ] App starts without errors
- [ ] All features working
- [ ] No env var warnings in logs

### Creating Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

- [ ] GitHub Actions triggered for tag
- [ ] Image pushed as: `your-username/imperial-codex:v1.0.0`, `1.0.0`, `1.0`, `latest`

---

## 🚀 DEPLOY TO PRODUCTION (Single-Host)

### Build & Run

```bash
docker build --target runner -t imperial-codex:latest .
docker compose up -d
```

- [ ] Container running: `docker ps` shows "Up" status
- [ ] Health check passing: `docker ps` shows "(healthy)"
- [ ] Visit http://localhost:3000 → loads
- [ ] Check logs: `docker logs -f imperial_codex-app`

### Start Health Monitoring

```bash
chmod +x docker-health-monitor.sh

# Without Slack
./docker-health-monitor.sh imperial_codex-app &

# With Slack (recommended)
./docker-health-monitor.sh imperial_codex-app "your-slack-webhook" 30 &
```

- [ ] Monitor script running in background
- [ ] Slack channel subscribed to alerts (if enabled)
- [ ] Test: `docker exec imperial_codex-app exit 1` → watch auto-restart + Slack alert
- [ ] Verify recovery: `docker logs -f imperial_codex-app`

### Inspect Health

```bash
./docker-health-check.sh imperial_codex-app
```

- [ ] Shows: uptime, health status, CPU/memory, recent logs
- [ ] HTTP endpoint responding
- [ ] No errors in health check history

---

## 🌐 DEPLOY TO KUBERNETES (Multi-Node)

### Prerequisites

```bash
# Verify kubectl is installed & configured
kubectl get nodes
```

- [ ] Cluster is accessible
- [ ] 2+ nodes available

### Deploy

```bash
# Update image in kubernetes/deployment.yaml
nano kubernetes/deployment.yaml
# Change: image: docker.io/your-username/imperial-codex:latest

kubectl apply -f kubernetes/deployment.yaml
```

- [ ] Deployment created: `kubectl get deployment imperial-codex`
- [ ] 2 replicas running: `kubectl get pods`
- [ ] Service created: `kubectl get svc imperial-codex`

### Monitor

```bash
# Watch scaling
kubectl get pods -w

# View logs
kubectl logs -f pod-name

# Check health
kubectl get events --sort-by='.lastTimestamp'
```

- [ ] Pods are "Running" + "Ready"
- [ ] No restart loops
- [ ] Health probes passing (check Events)

---

## 🛠️ TROUBLESHOOTING CHECKLIST

### Container Won't Start
- [ ] Check logs: `docker logs imperial_codex-app`
- [ ] Verify env vars set: `cat .env.local`
- [ ] Rebuild image: `docker build --target runner -t imperial-codex:latest .`
- [ ] Check port 3000 free: `lsof -i :3000`

### Health Check Failing
- [ ] Test endpoint: `curl http://localhost:3000`
- [ ] Check app logs: `docker logs imperial_codex-app`
- [ ] Increase start grace period: edit `docker-compose.yml` `start_period: 30s`
- [ ] Verify `NODE_ENV=production` set

### GitHub Actions Push Failed
- [ ] Check workflow: GitHub → Actions tab
- [ ] Verify secrets: Settings → Secrets → check `DOCKER_HUB_TOKEN`
- [ ] Regenerate PAT if expired: https://hub.docker.com/settings/security

### Monitor Script Not Alerting
- [ ] Test webhook: `curl -X POST webhook-url -H 'Content-Type: application/json' -d '{"text":"test"}'`
- [ ] Check webhook URL is correct and recent
- [ ] Regenerate at: https://api.slack.com/apps

### Kubernetes Pod in CrashLoopBackOff
- [ ] Check pod logs: `kubectl logs pod-name`
- [ ] Describe pod: `kubectl describe pod pod-name`
- [ ] Check resource limits not too low
- [ ] Verify image pulls successfully: `docker pull image-url`

---

## 📊 QUICK STATUS COMMANDS

```bash
# All containers
docker ps -a

# Image list + sizes
docker images

# Disk usage
docker system df

# Health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# App logs (last 20 lines)
docker logs --tail 20 imperial_codex-app

# Kubernetes status
kubectl get all

# Kubernetes events
kubectl get events --sort-by='.lastTimestamp'
```

---

## 🎯 Typical Milestones

| Milestone | When | Commands |
|-----------|------|----------|
| **Start Dev** | Morning | `code .` → Dev Containers: Reopen |
| **Push to Main** | Throughout day | `git push origin main` |
| **CI Completes** | ~5 min after push | Check GitHub Actions tab |
| **Image in Hub** | After CI completes | `docker pull your-user/imperial-codex:main` |
| **Deploy Prod** | End of day/before release | `docker compose up -d` |
| **Start Monitor** | After deploy | `./docker-health-monitor.sh ... &` |
| **Create Release** | Weekly/as needed | `git tag v1.0.0 && git push origin v1.0.0` |
| **Deploy to K8s** | Production push | `kubectl apply -f kubernetes/deployment.yaml` |

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| `QUICK_START.md` | Full setup guide (this is the overview) |
| `HEALTH_CHECKS_GUIDE.md` | Deep dive: Docker, Monitor script, Kubernetes probes |
| `DOCKER_REGISTRY_CI_CD.md` | Registry, GitHub Actions, caching |
| `architecture.py` | System design overview |
| `.devcontainer/devcontainer.json` | Dev Container config |
| `.vscode/launch.json` | VS Code debugger config |
| `docker-compose.dev.yml` | Development compose |
| `docker-compose.yml` | Production compose |
| `Dockerfile` | Multi-stage build (dev + prod) |
| `kubernetes/deployment.yaml` | K8s manifests with probes + HPA |

---

## ✨ You're All Set!

- ✅ Local development with hot reload
- ✅ VS Code debugging
- ✅ Automated CI/CD (GitHub Actions)
- ✅ Docker Hub registry push
- ✅ Health monitoring with auto-restart
- ✅ Slack alerting
- ✅ Kubernetes deployment ready
- ✅ Production-grade multi-stage build

**Next step:** Run `code .` and start developing! 🚀
