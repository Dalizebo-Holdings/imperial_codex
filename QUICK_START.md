# Imperial Codex: Quick Start Guide

Complete setup steps for development, CI/CD, health monitoring, and deployment.

---

## 1. Initial Setup (One-time)

### Prerequisites
- Docker Desktop installed + running
- Docker Hub account (free at hub.docker.com)
- GitHub account with this repo
- VS Code (optional, but recommended)
- Slack workspace (optional, for health alerts)

### Step 1.1: Clone & Install

```bash
git clone https://github.com/your-username/imperial-codex.git
cd imperial-codex

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your secrets
# OPENAI_API_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, etc.
nano .env.local
```

### Step 1.2: Create Docker Hub Personal Access Token (PAT)

1. Go to **https://hub.docker.com/settings/security**
2. Click **"New Access Token"**
3. Name it: `imperial-codex-ci`
4. Copy the token (you'll need it once)

### Step 1.3: Add GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add two secrets:

   **Secret 1:**
   - Name: `DOCKER_HUB_USERNAME`
   - Value: your Docker Hub username

   **Secret 2:**
   - Name: `DOCKER_HUB_TOKEN`
   - Value: the PAT from Step 1.2

### Step 1.4: Get Slack Webhook (Optional)

For health check alerts:

1. Go to **https://api.slack.com/apps**
2. Click **"Create New App"** → **"From scratch"**
3. Name: `Imperial Codex Monitoring`
4. Select your workspace
5. Go to **"Incoming Webhooks"** → enable it
6. Click **"Add New Webhook to Workspace"**
7. Select channel: `#imperial-codex-alerts` (or create it)
8. Copy the webhook URL

---

## 2. Development Workflow

### Option A: Local Development (No Docker)

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run tests
npm test
```

Visit **http://localhost:3000**

### Option B: Dev Container in Docker (Recommended)

```bash
# Install VS Code extension: "Dev Containers"
# (Search in Extensions: "ms-vscode-remote.remote-containers")

# Open repo in VS Code
code .

# Press Ctrl+Shift+P → type "Dev Containers: Reopen in Container"
# VS Code will:
#  - Build the dev container
#  - Install dependencies
#  - Mount src/ for hot reload
#  - Expose ports 3000 + 9229

# Wait for startup (2-3 min first time)

# In integrated terminal:
npm run dev

# Visit http://localhost:3000
```

### Option C: Docker Compose Dev

```bash
# Start development environment (hot reload, all ports exposed)
docker compose -f docker-compose.dev.yml up

# Watch for file changes (auto-sync to container)
# Edit src/ locally → changes reflect in container instantly

# Attach debugger:
# Press F5 in VS Code → select "Attach to Docker Container"
```

### Debugging in VS Code

1. Start container: `docker compose -f docker-compose.dev.yml up`
2. Press **Ctrl+Shift+D** (Debug panel)
3. Select **"Attach to Docker Container"**
4. Press **F5** to attach
5. Set breakpoints in `src/` files
6. Refresh browser to hit breakpoints

### Stop Dev Environment

```bash
docker compose -f docker-compose.dev.yml down
# or Ctrl+C in terminal
```

---

## 3. Build & Push to Docker Hub

### Step 3.1: Build Locally (Optional)

```bash
# Build production image (takes ~5-10 min)
docker build --target runner -t imperial-codex:latest .

# Test it
docker run -p 3000:3000 --env-file .env.local imperial-codex:latest

# Visit http://localhost:3000
```

### Step 3.2: Manual Push to Docker Hub

```bash
# Make the script executable (first time only)
chmod +x docker-push.sh

# Push to Docker Hub
./docker-push.sh docker.io your-username/imperial-codex latest

# Script will:
#  - Tag image for registry
#  - Log into Docker Hub (prompts for username/PAT)
#  - Push image
#  - Also push as 'latest' tag
#  - Print pull command
```

### Step 3.3: Automatic Push via GitHub Actions (CI/CD)

Push to GitHub → CI/CD builds & pushes automatically.

**Push to main branch (development):**
```bash
git add .
git commit -m "Add feature X"
git push origin main

# GitHub Actions workflow starts automatically
# Wait ~3-5 minutes
# Image available as: your-user/imperial-codex:main, :latest
```

**Create a release (production):**
```bash
# Create a semantic version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions builds & pushes
# Image available as: your-user/imperial-codex:1.0.0, :1.0, :latest

# View workflow status: GitHub repo → Actions tab
```

**Pull your image anytime:**
```bash
docker pull your-username/imperial-codex:latest
docker run -p 3000:3000 --env-file .env.local your-username/imperial-codex:latest
```

---

## 4. Run Production Container

### Step 4.1: Build & Run Locally

```bash
# Build
docker build --target runner -t imperial-codex:latest .

# Run
docker compose up -d

# Check status
docker ps
docker logs -f imperial_codex-app

# Visit http://localhost:3000

# Stop
docker compose down
```

### Step 4.2: Health Checks

**View health status:**
```bash
# Quick status
docker ps --format "table {{.Names}}\t{{.Status}}"
# Shows: "Up 2 minutes (healthy)" or "(unhealthy)"

# Detailed health report
chmod +x docker-health-check.sh
./docker-health-check.sh imperial_codex-app
# Shows: uptime, health history, CPU/memory, logs, network, HTTP status
```

---

## 5. Active Health Monitoring (Single-Host)

### Step 5.1: Start Monitor Script

```bash
chmod +x docker-health-monitor.sh

# WITHOUT Slack alerts
./docker-health-monitor.sh imperial_codex-app &

# WITH Slack alerts (paste your webhook from Step 1.4)
./docker-health-monitor.sh imperial_codex-app \
  "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" 30 &
```

**What happens:**
- Watches container health every 30 seconds
- After 3 consecutive failures → sends Slack alert + restarts container
- Monitors for recovery → sends "recovered" alert
- Runs in background (add `&`)

### Step 5.2: Test Monitoring

```bash
# Simulate unhealthy state
docker exec imperial_codex-app bash -c "exit 1"

# Watch monitor detect it (within 30s):
# [2024-01-15 10:30:45] WARNING: Container is unhealthy (attempt 1/3)
# [2024-01-15 10:31:15] WARNING: Container is unhealthy (attempt 2/3)
# [2024-01-15 10:31:45] WARNING: Container is unhealthy (attempt 3/3)
# [2024-01-15 10:31:50] Container restarted successfully
# → Slack alert sent

# Verify container auto-restarted
docker ps
# Status should show: "Up 15 seconds (starting)"
```

### Step 5.3: Stop Monitor

```bash
# Kill background monitor
pkill -f docker-health-monitor.sh

# or press Ctrl+C if running in foreground
```

### Step 5.4: Run as Systemd Service (Persistent)

To keep monitoring even after reboot:

```bash
# Create service file
sudo tee /etc/systemd/system/imperial-codex-monitor.service > /dev/null <<'EOF'
[Unit]
Description=Imperial Codex Health Monitor
After=docker.service
Wants=docker.service

[Service]
Type=simple
WorkingDirectory=/path/to/imperial-codex
ExecStart=/path/to/imperial-codex/docker-health-monitor.sh imperial_codex-app \
  "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" 30
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Replace paths above with your actual paths

# Enable & start
sudo systemctl daemon-reload
sudo systemctl enable imperial-codex-monitor
sudo systemctl start imperial-codex-monitor

# Check status
sudo systemctl status imperial-codex-monitor

# View logs
sudo journalctl -u imperial-codex-monitor -f

# Stop
sudo systemctl stop imperial-codex-monitor
```

---

## 6. Kubernetes Deployment (Multi-Node)

### Step 6.1: Prerequisites

- Kubernetes cluster (EKS, AKS, GKE, local minikube)
- `kubectl` installed and configured
- Image pushed to Docker Hub (from Step 3)

### Step 6.2: Deploy

```bash
# Update kubernetes/deployment.yaml with your image
# Change: docker.io/your-username/imperial-codex:latest

nano kubernetes/deployment.yaml
# Find: image: docker.io/your-username/imperial-codex:latest

# Apply deployment
kubectl apply -f kubernetes/deployment.yaml

# Wait for pods to start (1-2 min)
kubectl get pods -w

# Should show:
# imperial-codex-xxx   1/1     Running   0          2m
# imperial-codex-yyy   1/1     Running   0          1m
```

### Step 6.3: Monitor Kubernetes

```bash
# Watch pods (auto-scaling)
kubectl get pods -w

# View pod details
kubectl describe pod imperial-codex-xxx

# View logs
kubectl logs -f imperial-codex-xxx

# Check service endpoints
kubectl get svc imperial-codex
kubectl get endpoints imperial-codex

# View events (health check failures, restarts)
kubectl get events --sort-by='.lastTimestamp'
```

### Step 6.4: Scale Manually

```bash
# Scale to 5 replicas
kubectl scale deployment imperial-codex --replicas=5

# Scale back to 2
kubectl scale deployment imperial-codex --replicas=2

# Check HPA status (auto-scaling)
kubectl get hpa imperial-codex
```

### Step 6.5: Update Deployment

```bash
# After pushing new image to Docker Hub
kubectl set image deployment/imperial-codex \
  app=your-username/imperial-codex:v1.0.1 \
  --record

# Watch rolling update (zero downtime)
kubectl rollout status deployment/imperial-codex
kubectl get pods -w

# Rollback if needed
kubectl rollout undo deployment/imperial-codex
```

### Step 6.6: Cleanup

```bash
# Delete deployment
kubectl delete deployment imperial-codex

# Delete service
kubectl delete svc imperial-codex

# Delete HPA
kubectl delete hpa imperial-codex
```

---

## 7. Troubleshooting

### Container won't start

```bash
# Check logs
docker logs imperial_codex-app

# Common issues:
# - Missing env vars → set in .env.local
# - Port 3000 in use → docker compose down && docker compose up
# - Bad image → rebuild: docker build --target runner -t imperial-codex .
```

### Health check failing

```bash
# Test endpoint manually
curl -v http://localhost:3000

# Check if app is responding
docker exec imperial_codex-app curl http://localhost:3000

# Increase startup grace period if app is slow
# Edit docker-compose.yml: start_period: 30s
```

### GitHub Actions push failed

```bash
# Check workflow logs
# GitHub repo → Actions tab → Failed workflow

# Common issues:
# - DOCKER_HUB_TOKEN expired → regenerate at hub.docker.com/settings/security
# - DOCKER_HUB_USERNAME wrong → verify in secrets
# - PAT permissions → ensure "Read & Write" permissions
```

### Monitor script not sending Slack alerts

```bash
# Test webhook manually
curl -X POST "YOUR-WEBHOOK-URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test from Docker"}'

# If fails, webhook is invalid
# Regenerate at https://api.slack.com/apps
```

### Kubernetes pod stuck in CrashLoopBackOff

```bash
# Check pod logs
kubectl logs imperial-codex-xxx

# Check pod events
kubectl describe pod imperial-codex-xxx

# Check resource limits not too low
kubectl get pod imperial-codex-xxx -o yaml | grep -A 5 resources
```

---

## 8. Common Commands Reference

### Docker Commands

```bash
# Build
docker build --target runner -t imperial-codex:latest .

# Run
docker compose up -d

# Logs
docker logs -f imperial_codex-app

# Stop
docker compose down

# Health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Remove all
docker system prune -a --volumes
```

### GitHub Commands

```bash
# Push to develop branch
git push origin develop

# Create release tag
git tag v1.0.0
git push origin v1.0.0

# View tags
git tag -l
```

### Kubernetes Commands

```bash
# Deploy
kubectl apply -f kubernetes/deployment.yaml

# Watch
kubectl get pods -w

# Logs
kubectl logs -f pod-name

# Scale
kubectl scale deployment imperial-codex --replicas=5

# Update
kubectl set image deployment/imperial-codex app=image:tag

# Cleanup
kubectl delete deployment imperial-codex
```

### Health Monitoring

```bash
# Inspect health
./docker-health-check.sh imperial_codex-app

# Monitor actively
./docker-health-monitor.sh imperial_codex-app "webhook-url" &

# Stop monitor
pkill -f docker-health-monitor.sh
```

---

## 9. Typical Workflow

### Day 1: Local Development

```bash
code .  # Open in VS Code

# Dev Containers: Reopen in Container

npm run dev  # Runs in container with hot reload

# Edit src/ files → auto-sync to container
# Press F5 → attach debugger
# Write tests: npm test
```

### Day 2: Push to GitHub

```bash
git add .
git commit -m "Add new feature"
git push origin main

# GitHub Actions starts automatically
# Builds production image
# Pushes to Docker Hub as :main, :latest
# Wait 3-5 minutes
```

### Day 3: Deploy to Production

```bash
# Test locally first
docker pull your-username/imperial-codex:main
docker run -p 3000:3000 --env-file .env.local your-username/imperial-codex:main

# Deploy to Docker Compose
docker compose up -d

# Start monitoring
./docker-health-monitor.sh imperial_codex-app "slack-webhook" &

# Or deploy to Kubernetes
kubectl apply -f kubernetes/deployment.yaml
kubectl get pods -w
```

### Day 4: Create Release

```bash
# Tag for release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions pushes as v1.0.0, 1.0, latest
# Wait for workflow to complete (Actions tab)

# Verify
docker pull your-username/imperial-codex:v1.0.0
```

---

## 10. Additional Resources

- **Docker Healthchecks:** See `HEALTH_CHECKS_GUIDE.md`
- **Registry & CI/CD:** See `DOCKER_REGISTRY_CI_CD.md`
- **Architecture:** See `architecture.py`
- **Kubernetes Manifests:** See `kubernetes/deployment.yaml`
- **Dev Container Setup:** See `.devcontainer/devcontainer.json`
- **VS Code Debugger:** See `.vscode/launch.json`

---

## Need Help?

```bash
# Check all services running
docker ps -a

# View system status
docker system df

# View image sizes
docker images

# Clean up unused resources
docker system prune --volumes

# Full cleanup (careful!)
docker system prune -a --volumes
```

Happy coding! 🚀
