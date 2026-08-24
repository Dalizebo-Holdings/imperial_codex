# 🔧 Dev Container Troubleshooting & Performance Tuning

## Quick Diagnostics

Run this to check your setup:

```bash
# Check Docker daemon
docker ps

# Check dev container
docker ps | grep imperial_codex

# Check logs
docker compose -f docker-compose.dev.yml logs -f

# Check VS Code connection
# In VS Code: View → Output → Remote Container
```

---

## Common Issues & Fixes

### 🔴 Container won't start

**Symptom**: `docker compose up` fails or hangs

**Fixes**:
```bash
# 1. Clean up old containers
docker compose -f docker-compose.dev.yml down
docker system prune -a

# 2. Rebuild from scratch
docker compose -f docker-compose.dev.yml up --build --no-cache

# 3. Check daemon resources
docker system df
docker stats --no-stream

# 4. Increase Docker memory (Settings → Resources)
```

### 🔴 Extensions not installing

**Symptom**: Extensions don't appear inside container

**Fixes**:
1. Verify `remote.containers.allowRemoteExtensions: true` in workspace
2. Rebuild container: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"
3. Check logs: `View → Output → Remote Container`

### 🔴 npm install is extremely slow

**Symptom**: `npm ci` takes 10+ minutes

**Fixes**:
```bash
# Inside container terminal:
npm config set maxsockets 50
npm config set fetch-timeout 120000
npm cache verify

# Or use yarn for faster installs:
npm install -g yarn
yarn install
```

### 🔴 Port 3000 (or 3001, 9229) already in use

**Symptom**: "Address already in use" error

**Fixes**:
```bash
# On Linux/Mac, find process using port 3000:
lsof -i :3000
kill -9 <PID>

# Or use different port in docker-compose.dev.yml:
ports:
  - "3002:3000"  # Use 3002 instead
```

### 🔴 GitHub SSH not working

**Symptom**: `git clone git@github.com:...` fails

**Fixes**:
```bash
# Inside container terminal:

# 1. Test SSH connection
ssh -T git@github.com
# Should output: "Hi [username]! You've successfully authenticated..."

# 2. Ensure key is mounted and loaded
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

# 3. Add GitHub to known_hosts
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# 4. Check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### 🔴 Git authentication failing

**Symptom**: `git push` or `git pull` fails

**Fixes**:
```bash
# Option 1: SSH (Recommended)
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Option 2: HTTPS with token
git config --global credential.helper store
# Add to ~/.git-credentials:
# https://YOUR_TOKEN@github.com

# Option 3: Check current config
git config --list
```

### 🔴 "Permission denied" errors

**Symptom**: Can't edit files, permission errors

**Fixes**:
```bash
# Inside container:
sudo chmod -R 755 /app
sudo chown -R node:node /app

# Or use root in devcontainer.json:
"containerUser": "root"
```

### 🔴 Dev Container won't reconnect

**Symptom**: "Failed to connect to container"

**Fixes**:
1. Stop all containers: `docker compose -f docker-compose.dev.yml down`
2. Rebuild: `docker compose -f docker-compose.dev.yml up --build`
3. Reopen in container: `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
4. Or manually: `code --remote 'docker-container://imperial_codex-dev' /app`

### 🔴 TypeScript IntelliSense not working

**Symptom**: No autocomplete, type errors ignored

**Fixes**:
```bash
# Inside container terminal:
npm install
npx tsc --version  # Verify TypeScript installed

# In VS Code settings:
"typescript.tsdk": "node_modules/typescript/lib"
"typescript.enablePromptUseWorkspaceTsdk": true

# Restart TS server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 🔴 Hot reload not working (Next.js)

**Symptom**: Changes don't reflect in browser

**Fixes**:
```bash
# 1. Check Next.js is actually running
# In container terminal: npm run dev

# 2. Verify volume mounts
docker inspect imperial_codex-dev | grep -A 5 "Mounts"

# 3. Check file watching
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 4. Rebuild container
docker compose -f docker-compose.dev.yml down && up
```

### 🔴 Memory issues / Out of Memory

**Symptom**: Node process killed (exit code 137)

**Fixes**:
```bash
# 1. Increase Docker memory limit
# Docker Desktop Settings → Resources → Memory (increase to 8GB+)

# 2. Increase Node heap size
export NODE_OPTIONS="--max-old-space-size=8192"

# Or in devcontainer.json:
"remoteEnv": {
  "NODE_OPTIONS": "--max-old-space-size=8192"
}
```

### 🔴 Disk space issues

**Symptom**: "No space left on device"

**Fixes**:
```bash
# Check usage
docker system df

# Clean up
docker system prune -a --volumes  # ⚠️ Removes all unused images/volumes
docker builder prune  # Clean build cache
docker image prune -a

# Or specific to dev container
docker compose -f docker-compose.dev.yml down -v
```

---

## Performance Optimization

### Enable BuildKit (faster builds)

```bash
export DOCKER_BUILDKIT=1
docker compose -f docker-compose.dev.yml build --no-cache
```

### Optimize npm for containers

```bash
# Inside container:
npm config set maxsockets 50
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set strict-ssl false  # ⚠️ Only for testing
```

### Use npm ci instead of npm install

```bash
# In Dockerfile or postCreateCommand:
npm ci --prefer-offline --no-audit
# Faster and more reliable than npm install
```

### Exclude large directories from watching

Already configured in workspace:
```json
"files.watcherExclude": {
  "**/node_modules/**": true,
  "**/.next/**": true,
  "**/.git/**": true
}
```

---

## Connection Speed Optimization

### Increase copy threads

In `devcontainer.json`:
```json
"remote.containers.copyMgmtThreadCount": 4
```

### Disable unnecessary features

```json
"features": {
  "ghcr.io/devcontainers/features/git:1": {},
  // Remove features you don't use
}
```

### Use Alpine-based images

Already using `node:20-alpine` for small footprint.

---

## Verify Setup is Correct

Run this checklist:

```bash
# ✓ Container running
docker ps | grep imperial_codex

# ✓ Extensions installed (in container terminal)
code --list-extensions

# ✓ Dependencies installed
npm list typescript

# ✓ GitHub SSH working
ssh -T git@github.com

# ✓ Next.js running
curl http://localhost:3000

# ✓ Debugger available
# Check in VS Code debugger dropdown
```

---

## When to Ask for Help

Gather this info before asking:

```bash
# Your environment
docker --version
code --version
git --version

# Container logs
docker compose -f docker-compose.dev.yml logs > logs.txt

# System resources
docker stats --no-stream

# VS Code logs
# View → Output → Remote Container (copy full output)
```

---

## 📊 Expected Performance

| Task | Expected Time |
|------|----------------|
| Container build | 2-5 minutes (first time) |
| Dependencies install | 1-3 minutes |
| Next.js build | 30-60 seconds |
| Hot reload | <1 second |
| TypeScript check | 2-5 seconds |
| ESLint + Prettier | 1-3 seconds |

---

**Last Updated**: 2025-07-27  
**Status**: ✅ All systems optimized for maximum performance
