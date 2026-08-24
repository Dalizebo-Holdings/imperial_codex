# Emergency Fix: Container Reconnection Loop

## Issue

Docker compose with Model Runner sidecar is causing the container to get stuck in a reconnection loop.

## Solution

I've **simplified the setup** to remove the sidecar dependency:

### Changed Files:

1. **docker-compose.dev.yml** — Removed Model Runner service (no `depends_on`, no sidecar complexity)
2. **.devcontainer/devcontainer.json** — Removed model runner config, now just basic dev container

### What to do now:

**Step 1: Stop the stuck container**

In PowerShell/Terminal:
```powershell
cd "C:\Users\lucas\OneDrive\Dalizebo Holdings\imperial_codex"
docker compose -f docker-compose.dev.yml down -v
```

**Step 2: Close VS Code Remote Connection**

In VS Code:
- Click the green remote indicator (bottom left)
- Select "Close Remote Connection"
- This closes the stuck container connection

**Step 3: Restart fresh**

```powershell
docker compose -f docker-compose.dev.yml up --pull always -d
```

Wait 30 seconds for container to be healthy.

**Step 4: Re-attach in VS Code**

- **Ctrl+Shift+P** → **Remote-Containers: Attach to Running Container**
- Select `imperial_codex-app`

This should attach cleanly without looping.

---

## Alternative: Stop Container, Install Extensions Locally

If you still get stuck:

1. **Stop container:**
   ```powershell
   docker compose -f docker-compose.dev.yml down
   ```

2. **Install extensions locally** (in VS Code, not in container):
   ```powershell
   code --install-extension saoudrizwan.claude-dev
   code --install-extension ryanohalloran.opencode
   ```

3. **Then start container again:**
   ```powershell
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Attach to container** (extensions will sync in)

---

## Option: Use Local Models Later

Once you have a stable setup, we can add Model Runner back as an **optional** separate service (not a dependency).

For now, priority is stability.

---

## Run This Right Now

**PowerShell:**

```powershell
cd "C:\Users\lucas\OneDrive\Dalizebo Holdings\imperial_codex"
docker compose -f docker-compose.dev.yml down -v
docker system prune -f
docker compose -f docker-compose.dev.yml up --pull always -d
docker ps
```

Tell me:
- ✓ Does `docker ps` show the container running?
- ✓ Can you attach in VS Code without looping?
