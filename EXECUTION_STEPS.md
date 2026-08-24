# Step-by-Step Execution Guide

## Step 1: Start Dev Environment (Terminal/PowerShell)

Run this from your project directory:

```bash
cd "C:\Users\lucas\OneDrive\Dalizebo Holdings\imperial_codex"

# Start containers in background
docker compose -f docker-compose.dev.yml up --pull always -d
```

**What happens:**
- Downloads Docker Model Runner image
- Pulls `ai/qwen3-coder` and `ai/devstral-small-2` models (~2-5 GB, first time only)
- Starts your app on port 3000
- Starts Model Runner on port 12434
- Takes 2-5 minutes first time (models cache after)

**Verify containers are running:**
```bash
docker compose -f docker-compose.dev.yml ps
```

Expected output:
```
CONTAINER ID   IMAGE                        STATUS              PORTS
...            docker/model-runner:latest   Up (healthy)        0.0.0.0:12434->12434/tcp
...            (your app image)             Up (healthy)        0.0.0.0:3000->3000/tcp
```

**Check Model Runner is ready:**
```bash
curl http://localhost:12434/health
```

Should return: `{"status":"ok"}`

---

## Step 2: Attach to Container in VS Code

Once containers are running:

1. **Ctrl+Shift+P** → **Remote-Containers: Attach to Running Container**
2. Select `imperial_codex-app` from the list
3. Wait for VS Code to sync (1-2 minutes first time)

OR (alternative):

1. **Ctrl+Shift+P** → **Remote-Containers: Open Folder in Container**
2. Select your imperial_codex folder
3. VS Code uses `docker-compose.dev.yml` and `.devcontainer/devcontainer.json`

---

## Step 3: Install AI Extensions (Inside Container Terminal)

Once attached, open terminal in VS Code: **Ctrl+\`**

Run installer script:

```bash
# Linux/Mac style (also works in Windows Git Bash)
bash install-ai-extensions.sh

# OR Windows PowerShell
.\install-ai-extensions.bat
```

**What this does:**
- Installs `saoudrizwan.claude-dev` (Cline)
- Installs `ryanohalloran.opencode` (OpenCode)
- Configures them to use local Model Runner on http://model-runner:12434/engines/v1

Expected output:
```
=== Installing Agentic AI Extensions ===
Installing extension 'saoudrizwan.claude-dev'...
[████████████████████████] 100%
Installing extension 'ryanohalloran.opencode'...
[████████████████████████] 100%
✓ Extensions installed
```

---

## Step 4: Reload VS Code

**Ctrl+Shift+P** → **Developer: Reload Window**

Wait for the reload to complete (20-30 seconds)

---

## Step 5: Verify Setup

### Check Model Runner Connection

1. Open terminal in VS Code: **Ctrl+\`**
2. Test the connection:

```bash
curl http://model-runner:12434/health
```

Expected: `{"status":"ok"}`

### List Available Models

```bash
docker model list
```

Expected:
```
ai/qwen3-coder
ai/devstral-small-2
```

---

## Step 6: Try Cline (Agentic AI)

1. **Ctrl+Shift+P** → **Cline: Open**
2. A new panel opens on the right side
3. Type your request in the message box:

```
Create a TypeScript utility for API validation that handles common HTTP status codes and error messages
```

4. Press Enter or click the send button
5. Watch Cline:
   - Analyze your codebase
   - Create a new file (likely `src/utils/apiValidation.ts`)
   - Write the validation logic
   - Ask for approval if it wants to modify files

---

## Step 7: Try OpenCode (AI Completion)

1. Create a new file or open existing TypeScript/JavaScript
2. Start typing a function signature:

```typescript
function validateEmail(
```

3. **Ctrl+Shift+P** → **OpenCode: Complete** (or wait for inline suggestion)
4. AI suggests or completes the function
5. Press Tab or Enter to accept

---

## Troubleshooting

### "Model Runner not responding"
```bash
# Check if service is healthy
docker compose -f docker-compose.dev.yml logs model-runner | tail -20

# Restart it
docker compose -f docker-compose.dev.yml restart model-runner

# Wait 30 seconds for models to load
```

### "Extensions not appearing"
```bash
# In VS Code, reload
Ctrl+Shift+P > Developer: Reload Window

# Or restart container
docker compose -f docker-compose.dev.yml restart app
```

### "Can't attach to container"
```bash
# Ensure container is running
docker compose -f docker-compose.dev.yml ps

# If not, start it
docker compose -f docker-compose.dev.yml up -d
```

### "Models slow to respond"
- First inference on a model is slow (loads from disk)
- Subsequent requests are faster
- If timeout, increase timeout in extension settings

### "Out of memory"
```bash
# Check current memory usage
docker stats imperial_codex-app imperial_codex-models

# Increase Docker Desktop memory:
# Settings > Resources > Memory > increase to 8GB+
```

---

## Commands Reference

```bash
# Start everything
docker compose -f docker-compose.dev.yml up --pull always -d

# View logs
docker compose -f docker-compose.dev.yml logs -f model-runner
docker compose -f docker-compose.dev.yml logs -f app

# Stop everything
docker compose -f docker-compose.dev.yml down

# Restart a service
docker compose -f docker-compose.dev.yml restart model-runner

# Remove all (including volumes with models)
docker compose -f docker-compose.dev.yml down -v
```

---

## Next Steps

1. ✅ Run `docker compose -f docker-compose.dev.yml up --pull always -d`
2. ✅ Attach to container in VS Code
3. ✅ Run `bash install-ai-extensions.sh`
4. ✅ Reload VS Code window
5. ✅ Try `Ctrl+Shift+P > Cline: Open`
6. ✅ Ask Cline to generate code

Then let me know:
- Did Cline start successfully?
- Was it able to generate code?
- Any errors in the process?
