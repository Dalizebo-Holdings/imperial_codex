# VS Code + Docker Container Attachment Guide

## Fixed Issues ✓

Updated your setup:
- **devcontainer.json** — now uses `docker-compose.yml` instead of generic dev image (fixes the mismatch)
- **docker-compose.yml** — added `container_name: imperial_codex-app` for reliable container identification
- **troubleshooting scripts** — diagnostic tools for both Windows and Unix systems

---

## Method 1: Open Folder in Container (Recommended)

1. In VS Code, open Command Palette: **Ctrl+Shift+P** (Windows/Linux) or **Cmd+Shift+P** (Mac)
2. Type: **Remote-Containers: Open Folder in Container**
3. Select your `imperial_codex` project folder
4. VS Code will:
   - Build/start the container from `docker-compose.yml`
   - Sync your workspace into `/app`
   - Install extensions in container context
   - Open a new VS Code window connected to container

---

## Method 2: Attach to Running Container

If you prefer starting the container separately:

```bash
# Terminal/PowerShell
cd "C:\Users\lucas\OneDrive\Dalizebo Holdings\imperial_codex"
docker compose up --pull always
```

Then in VS Code:
1. **Ctrl+Shift+P** → **Remote-Containers: Attach to Running Container**
2. Select `imperial_codex-app` from the list
3. VS Code connects to the running container

---

## Method 3: Reopen in Container (After Opening Folder)

If you already have the folder open locally:
1. **Ctrl+Shift+P** → **Remote-Containers: Reopen in Container**
2. VS Code will use `.devcontainer/devcontainer.json` settings

---

## Troubleshooting

### Run diagnostic script:
```bash
# Windows PowerShell
.\troubleshoot-container.bat

# Linux/Mac
bash troubleshoot-container.sh
```

### Check if container exists:
```bash
docker ps -a | grep imperial_codex
```

### View container logs:
```bash
docker logs imperial_codex-app
```

### Force rebuild:
```bash
docker compose down
docker compose up --build --pull always
```

### Extension not found error:
- Ensure Remote - Containers is installed: `ms-vscode-remote.remote-containers`
- Reload VS Code: **Ctrl+Shift+P** → **Developer: Reload Window**

### Port 3000 already in use:
```bash
docker compose down
# Change port in docker-compose.yml if needed (e.g., 3001:3000)
docker compose up
```

### Permission denied / can't mount volumes:
- On Windows: Ensure Docker Desktop is running and has file sharing enabled
- Settings → Resources → File Sharing → Add imperial_codex folder

---

## Inside the Container

Once attached, you have:
- Full Node.js 20 environment
- npm/yarn package manager
- Git integration
- All extensions (ESLint, Prettier, TypeScript, GitLens)
- Hot reload via volume mounts
- Direct access to your source code

### Useful commands:
```bash
# Inside container terminal
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
git status           # Check git status
```

---

## Git Integration Inside Container

GitLens works inside the container:
- Blame annotations, file history
- Branch tracking
- GitHub integration
- Commit from container terminal

Configure git (if not already done):
```bash
git config user.name "Lucas"
git config user.email "your-email@example.com"
```

---

## Environment Variables

Create `.env.local` in the project root (not committed to git):
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=claude-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
GITHUB_TOKEN=ghp_...
```

The compose file will load these into the container.

---

## Next Steps

1. **Try Method 1 first** (Open Folder in Container) — simplest approach
2. Run troubleshooting script if issues occur
3. Once inside container, verify git and npm work: `git status && npm -v`
4. Make commits and push to GitHub via GitLens
5. For production, use `docker-compose.prod.yml`

---

## Common VS Code Shortcuts (Inside Container)

| Action | Shortcut |
|--------|----------|
| Command Palette | Ctrl+Shift+P |
| Open Terminal | Ctrl+` |
| Git: Commit | Ctrl+Shift+G, C |
| Format Document | Shift+Alt+F |
| Go to Definition | F12 |
| Find in Files | Ctrl+Shift+F |
| New Terminal | Ctrl+Shift+` |
