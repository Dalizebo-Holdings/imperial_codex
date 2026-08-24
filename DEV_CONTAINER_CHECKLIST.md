# ✅ Imperial Codex Dev Container - Validation Checklist

## Pre-Connection Checklist

- [ ] Docker Desktop installed and running
- [ ] VS Code installed with Dev Containers extension
- [ ] `.env.local` created with API keys
- [ ] GitHub SSH key at `~/.ssh/id_rsa`
- [ ] GitHub token set as `GITHUB_TOKEN` environment variable
- [ ] Git configured: `git config --global user.name` and `user.email`

## Configuration Files Validated

- [ ] `.devcontainer/devcontainer.json` - ✓ 21+ extensions configured
- [ ] `.devcontainer/Dockerfile` - ✓ Alpine, optimized npm, git/ssh pre-installed
- [ ] `.devcontainer/setup.sh` - ✓ GitHub SSH/credentials initialization
- [ ] `docker-compose.dev.yml` - ✓ Volume mounts, ports, health checks
- [ ] `imperial_codex.code-workspace` - ✓ GitHub integration, file watcher optimization
- [ ] `.devcontainer/.env.example` - ✓ Template for environment variables

## Features Enabled

### GitHub Integration
- [ ] SSH key mount: `~/.ssh → /root/.ssh` (read-only)
- [ ] Git credentials: `~/.git-credentials → /root/.git-credentials` (read-only)
- [ ] Git config: `~/.gitconfig → /root/.gitconfig` (read-only)
- [ ] GitHub token via environment: `GITHUB_TOKEN`
- [ ] GitHub CLI feature enabled in devcontainer
- [ ] SSH protocol configured in workspace settings

### Extensions (Auto-Install)
- [ ] GitHub Copilot
- [ ] GitHub Copilot Chat
- [ ] GitHub.copilot-labs
- [ ] GitLens (eamodio.gitlens)
- [ ] ESLint (dbaeumer.vscode-eslint)
- [ ] Prettier (esbenp.prettier-vscode)
- [ ] TypeScript (ms-vscode.vscode-typescript-next)
- [ ] Docker (ms-vscode.docker)
- [ ] Remote Containers (ms-vscode-remote.remote-containers)
- [ ] Remote SSH (ms-vscode-remote.remote-ssh)
- [ ] And 11+ more...

### Performance Optimizations
- [ ] File watcher excludes: `.git`, `node_modules`, `.next`
- [ ] Connection threads: 4 (for faster file copying)
- [ ] npm optimized: maxsockets=50, fetch-timeout=120000
- [ ] Node memory: --max-old-space-size=4096
- [ ] TypeScript incremental builds enabled
- [ ] InlayHints disabled (unless pressed)
- [ ] Word-based suggestions disabled
- [ ] Smart suggestions (other: true, comments/strings: false)

### Port Forwarding
- [ ] Port 3000 → Next.js App
- [ ] Port 3001 → MCP Server
- [ ] Port 9229 → Node Debugger
- [ ] All labeled for auto-forward notifications

### Editor Settings
- [ ] Format on save: ✓
- [ ] Default formatter: Prettier
- [ ] Code actions on save: ESLint + Prettier
- [ ] TypeScript workspace SDK enabled
- [ ] Terminal: bash

## Connection Process

1. [ ] Open `imperial_codex.code-workspace` in VS Code
2. [ ] Install "Dev Containers" extension (if needed)
3. [ ] Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
4. [ ] Type "Dev Containers: Reopen in Container"
5. [ ] Wait 2-5 minutes for initialization
6. [ ] Confirm terminal shows "✅ Dev container ready!"

## Post-Connection Verification

- [ ] Extensions installed (View → Extensions → Installed)
- [ ] TypeScript working (hover over code for types)
- [ ] ESLint working (red squiggles on errors)
- [ ] Prettier working (format document)
- [ ] GitHub SSH working (`ssh -T git@github.com`)
- [ ] npm dependencies installed (`npm list | head -20`)
- [ ] Next.js running (`npm run dev`)
- [ ] Browser access: http://localhost:3000

## Service Status

- [ ] Next.js App (port 3000): Accessible
- [ ] MCP Server (port 3001): Accessible
- [ ] Node Debugger (port 9229): Available
- [ ] Health check passing
- [ ] No errors in `docker logs imperial_codex-dev`

## Git & GitHub

- [ ] SSH: `ssh -T git@github.com` → Success
- [ ] Clone: `git clone git@github.com:<user>/<repo>` → Works
- [ ] Push: `git push origin main` → Works
- [ ] Pull: `git pull origin main` → Works
- [ ] GitHub token valid (if using API calls)
- [ ] Copilot connected (if subscribed)

## Development Ready

- [ ] Can edit files in `/app`
- [ ] Changes hot-reload in browser
- [ ] Can run npm scripts from terminal
- [ ] Debugger attaches properly
- [ ] VS Code IntelliSense responsive
- [ ] Git operations smooth and fast

## Issues Found & Resolved

Document any issues during setup:

| Issue | Symptom | Resolution |
|-------|---------|-----------|
| | | |
| | | |
| | | |

## Performance Metrics

Record baseline performance:

| Metric | Value | Expected |
|--------|-------|----------|
| Container startup time | __ min | 2-5 min |
| npm install time | __ min | 1-3 min |
| Next.js build time | __ sec | 30-60 sec |
| Hot reload time | __ sec | <1 sec |
| TypeScript check | __ sec | 2-5 sec |
| ESLint + Prettier | __ sec | 1-3 sec |

## Final Sign-Off

- [ ] All configurations validated
- [ ] All services running
- [ ] GitHub integration confirmed
- [ ] Extensions installed and working
- [ ] Performance meets expectations
- [ ] Ready for development! 🎉

---

**Validation Date**: _____________  
**Validated By**: _____________  
**Status**: ✅ Ready to Code

---

## Quick Reference Commands

```bash
# Start dev container
docker compose -f docker-compose.dev.yml up -d

# Attach in VS Code (CLI)
code --remote 'docker-container://imperial_codex-dev' /app

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop container
docker compose -f docker-compose.dev.yml down

# Rebuild
docker compose -f docker-compose.dev.yml up --build

# Check status
docker ps | grep imperial_codex
```

---

**Need Help?** See `DEV_CONTAINER_TROUBLESHOOTING.md`
