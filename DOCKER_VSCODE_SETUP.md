# Docker + VS Code + Git Setup for Imperial Codex

## Quick Start

1. **Open the workspace**
   ```
   code imperial_codex.code-workspace
   ```

2. **Install VS Code extensions** (or run setup script)
   - Docker: `ms-vscode.docker`
   - Remote - Containers: `ms-vscode-remote.remote-containers`
   - GitLens: `eamodio.gitlens`
   - Prettier: `esbenp.prettier-vscode`

3. **Start Docker container**
   ```
   docker compose up --pull always
   ```

4. **Attach to container in VS Code**
   - Open Command Palette: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `Remote-Containers: Attach to Running Container`
   - Select the imperial_codex container
   - VS Code will sync files and give you full development environment

---

## File Locations

- **Workspace config**: `imperial_codex.code-workspace`
- **Dev container config**: `.devcontainer/devcontainer.json`
- **Docker config**: `docker-compose.yml`, `Dockerfile`
- **Setup scripts**: 
  - Linux/Mac: `setup-docker-vscode.sh`
  - Windows: `setup-docker-vscode.bat`

---

## Docker Management in VS Code

**Docker Extension Features:**
- View running containers, images, registries
- Build/Run/Stop containers from sidebar
- View logs and attach terminal
- Manage volumes and networks

**Remote Container Development:**
- Full IDE inside Docker container
- Install extensions in container context
- File sync, debugging, integrated terminal
- Same Node.js version as production

---

## Git Integration

**GitLens:**
- Blame annotations on each line
- Current line history
- File history explorer
- Remote branch tracking
- GitHub integration

**Basic Git commands:**
```bash
git status           # Check changes
git add .            # Stage changes
git commit -m "msg"  # Commit
git push origin main # Push to GitHub
git pull origin main # Pull latest
```

---

## Environment Variables

Store secrets in `.env.local` (not committed):
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `VAULT_ENCRYPTION_KEY`
- `GITHUB_TOKEN`

See `.env.example` for full list.

---

## Troubleshooting

**Docker daemon not running:**
- Windows/Mac: Start Docker Desktop
- Linux: `sudo systemctl start docker`

**Can't attach to container:**
- Ensure container is running: `docker ps`
- Restart container: `docker compose down && docker compose up --pull always`

**Git not working:**
- Configure: `git config user.name "Your Name" && git config user.email "your@email.com"`
- Check SSH key: `ssh -T git@github.com`

**File permissions in container:**
- Container runs as non-root (nextjs user)
- Data directories mounted with proper ownership
- See `docker-compose.yml` for volume config

---

## Production Deployment

For production, use:
```bash
docker compose -f docker-compose.prod.yml up --pull always
```

See `DEPLOYMENT.md` for full deployment guide.
