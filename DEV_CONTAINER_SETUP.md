# 🚀 Imperial Codex Dev Container - Quick Setup Guide

## ✅ What's Been Configured

Your Dev Container is now optimized for fast, bug-free development with full GitHub integration:

### 1. **Enhanced devcontainer.json**
- ✓ 21+ extensions auto-installed (GitHub Copilot, GitLens, ESLint, Prettier, etc.)
- ✓ TypeScript path resolution configured
- ✓ Format on save enabled (ESLint + Prettier)
- ✓ Performance optimizations (file watcher exclusions, connection threading)
- ✓ Port forwarding: 3000 (Next.js), 3001 (MCP), 9229 (Debugger)
- ✓ GitHub SSH + credentials mounts (read-only)
- ✓ Environment variables auto-loaded

### 2. **Optimized Dockerfile** (.devcontainer/Dockerfile)
- ✓ Alpine base (fast builds, small footprint)
- ✓ Git, SSH, CA certs pre-installed
- ✓ NPM optimized for container installs
- ✓ Health checks enabled
- ✓ Max memory: 4GB for Node processes

### 3. **Docker Compose Dev** (docker-compose.dev.yml)
- ✓ Volume mounts optimized (node_modules in container, source hot-reload)
- ✓ GitHub credentials passed through securely
- ✓ All 3 ports exposed with health checks

### 4. **Workspace Config** (imperial_codex.code-workspace)
- ✓ GitHub token auth configured
- ✓ SSH git protocol enabled
- ✓ File watcher optimizations (excludes .git, node_modules, .next)
- ✓ Debugging configs included
- ✓ Terminal integrated (bash)

### 5. **Setup Scripts**
- `.devcontainer/setup.sh` - GitHub SSH/credentials init
- `setup-dev-container.sh` - One-command container startup

---

## 🔧 Prerequisites

Before connecting, ensure you have:

1. **GitHub SSH Key**
   ```bash
   # If you don't have one:
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   # Add public key to GitHub: https://github.com/settings/keys
   cat ~/.ssh/id_rsa.pub
   ```

2. **GitHub Token** (optional but recommended)
   ```bash
   # Create at: https://github.com/settings/tokens/new
   # Scopes: repo, read:user, user:email
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

3. **Git Credentials** (for HTTPS clones)
   ```bash
   # If you use git credential helper:
   git config --global credential.helper store
   # Or add credentials to ~/.git-credentials
   ```

4. **API Keys** in `.env.local`
   ```bash
   cp .devcontainer/.env.example .env.local
   # Edit with your actual keys:
   ANTHROPIC_API_KEY=sk-...
   OPENAI_API_KEY=sk-...
   GITHUB_TOKEN=ghp_...
   ```

---

## 🚀 Quick Start

### Option A: Using VS Code GUI (Recommended)

1. **Install Dev Containers Extension**
   - Open VS Code
   - Extensions → Search "Dev Containers" (ms-vscode-remote.remote-containers)
   - Install

2. **Open Workspace**
   - File → Open Workspace from File
   - Select `imperial_codex.code-workspace`

3. **Connect to Container**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: "Dev Containers: Reopen in Container"
   - Or: Click the green `><` icon in bottom-left corner → "Reopen in Container"

4. **Wait for initialization**
   - Extensions auto-install (~2-5 min)
   - Dependencies install (npm ci)
   - Build completes
   - Terminal shows "Dev container ready!"

### Option B: Using CLI

```bash
# Build and start dev container
docker compose -f docker-compose.dev.yml up --build -d

# Attach VS Code (requires VS Code CLI)
code --remote 'docker-container://imperial_codex-dev' /app
```

### Option C: Using Setup Script

```bash
# Make executable
chmod +x setup-dev-container.sh

# Run
./setup-dev-container.sh
```

---

## ✨ Features Enabled

### GitHub Integration
- ✓ SSH-based git operations (faster, more secure)
- ✓ Auto-configured credentials
- ✓ GitHub CLI available in container
- ✓ Copilot & Chat extensions ready

### Performance
- ✓ 4 connection threads for faster file copying
- ✓ npm cache optimized
- ✓ File watching excludes node_modules, .git, .next
- ✓ TypeScript incremental builds
- ✓ Hot reload for Next.js changes

### Extensions (Auto-Installed)
- **GitHub Copilot** - AI code completion
- **GitHub Copilot Chat** - AI conversations
- **GitLens** - Git history, blame, diffs
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Smart IntelliSense
- **Docker** - Container management
- **Tailwind CSS** - CSS intellisense
- **Auto Rename Tag** - Paired tag renaming
- **Todo Tree** - TODO highlighting
- And more...

### Settings Pre-Configured
- ✓ Format on save (ESLint + Prettier)
- ✓ TypeScript workspace SDK enabled
- ✓ Code actions on save
- ✓ Terminal: bash
- ✓ Debugging: Server + Client-side

---

## 🌐 Access Points

Once connected and running:

| Service | URL | Port |
|---------|-----|------|
| Next.js App | http://localhost:3000 | 3000 |
| MCP Server | http://localhost:3001 | 3001 |
| Node Debugger | localhost:9229 | 9229 |

---

## 🐛 Debugging

### Issue: Container won't start
```bash
# Check logs
docker compose -f docker-compose.dev.yml logs -f

# Rebuild
docker compose -f docker-compose.dev.yml up --build -d
```

### Issue: Extensions not installing
- Ensure `remote.containers.allowRemoteExtensions` is `true`
- Restart the container: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"

### Issue: npm install is slow
- Clear cache: `docker exec imperial_codex-dev npm cache clean --force`
- Use `--prefer-offline`: Already configured in devcontainer.json

### Issue: GitHub SSH not working
```bash
# Inside container, test:
ssh -T git@github.com
# Should output: "Hi [username]! You've successfully authenticated..."
```

### Issue: Port 3000 already in use
```bash
# Use a different port
docker compose -f docker-compose.dev.yml run -p 3001:3000 app
```

---

## 📋 Next Steps

1. ✓ Set environment variables in `.env.local`
2. ✓ Add your GitHub SSH key and token
3. ✓ Open workspace in VS Code
4. ✓ Reopen in container
5. ✓ Start coding! 🎉

---

## 💡 Tips & Tricks

- **Hot Reload**: Changes to `src/` auto-reload in browser
- **Debugging**: Use `debugger;` statement, then attach Chrome debugger
- **Git**: All git commands work seamlessly with GitHub
- **npm**: Use npm scripts from VS Code integrated terminal
- **Extensions**: Manage in VS Code (Settings → Recommended Extensions)

---

## 🔗 Useful Links

- [Dev Containers Docs](https://containers.dev/)
- [VS Code Remote Dev](https://code.visualstudio.com/docs/remote/remote-overview)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Docker Docs](https://docs.docker.com/)

---

**Status**: ✅ Ready to code! Your dev container is fully optimized.
