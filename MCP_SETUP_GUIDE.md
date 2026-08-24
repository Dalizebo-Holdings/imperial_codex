# MCP Toolkit Setup & Integration Guide

## Overview

The Model Context Protocol (MCP) Toolkit enables Claude, Cursor, and other AI clients to interact with Imperial Codex data and operations through a standardized interface.

Imperial Codex MCP exposes:
- **7 read tools**: Search pillars, OS modules, library, integrations
- **6 write tools**: Generate strikes, submit capital allocation, check loop status
- **Multiple transports**: stdio (local), HTTP/SSE (remote), Docker containers

---

## Quick Start

### Option 1: Docker Compose (Recommended for Development)

```bash
chmod +x mcp-setup.sh

# Start app + MCP server in Docker
./mcp-setup.sh docker

# Services running:
# - App: http://localhost:3000
# - MCP: http://localhost:3001
```

### Option 2: VS Code Dev Container (Integrated)

```bash
code .

# Ctrl+Shift+P → Dev Containers: Reopen in Container

# Inside container:
npm run dev

# MCP server auto-starts at http://localhost:3001
```

### Option 3: Claude Desktop Integration

```bash
# Start services first (Docker or Dev Container)
./mcp-setup.sh docker

# Then configure Claude Desktop
./mcp-setup.sh claude-desktop

# Restart Claude Desktop
# New MCP server available in conversations
```

---

## Setup by Environment

### 1. Docker Compose (Single-Host)

**What it does:**
- Builds MCP server image (`docker/mcp.dockerfile`)
- Starts app container + MCP server container
- Configures networking between services
- Health checks on both services

**Command:**
```bash
./mcp-setup.sh docker
```

**Or manually:**
```bash
docker build -f docker/mcp.dockerfile -t imperial-codex-mcp:latest .
docker compose -f docker-compose.mcp.yml up -d
```

**Access:**
- App: http://localhost:3000
- MCP: http://localhost:3001
- Network: `imperial-codex` (bridge)

**Logs:**
```bash
docker compose -f docker-compose.mcp.yml logs -f imperial_codex-app
docker compose -f docker-compose.mcp.yml logs -f imperial_codex-mcp
```

**Stop:**
```bash
docker compose -f docker-compose.mcp.yml down
```

---

### 2. VS Code Dev Container

**What it does:**
- Automatically builds & starts MCP server inside container
- Exposes ports 3000 (app), 3001 (MCP), 9229 (debugger)
- Pre-installs all extensions
- Configures Claude Dev extension

**Setup:**
```bash
code .
# Ctrl+Shift+P → Dev Containers: Reopen in Container
# Wait 2-3 minutes for first build
```

**Inside container:**
```bash
npm run dev

# MCP server is running at http://localhost:3001
# Access from host: http://localhost:3001
```

**Benefits:**
- Isolated environment (no host pollution)
- All dependencies in container
- Source code mounted for hot reload
- Debugger attached to port 9229
- Automatic extension installation

**Ports available inside container:**
- 3000 (Next.js app)
- 3001 (MCP server)
- 9229 (Node debugger)

---

### 3. Kubernetes Deployment

**Prerequisites:**
- Kubernetes cluster running
- `kubectl` configured

**Setup MCP ConfigMap:**
```bash
./mcp-setup.sh k8s

# Or manually:
kubectl create configmap imperial-codex-mcp-config \
  --from-file=mcp-config.json
```

**Deploy MCP server:**
```bash
# (Requires kubernetes/mcp-deployment.yaml — generate with)
kubectl apply -f kubernetes/mcp-deployment.yaml
```

---

### 4. Claude Desktop Integration

**Setup:**
```bash
# Ensure MCP server is running (Docker or Dev Container)

./mcp-setup.sh claude-desktop
```

**What happens:**
- Copies `mcp-config.json` to Claude Desktop config directory
- Configures MCP server endpoint (stdio or HTTP)
- Restarts Claude Desktop (manual)

**Configuration locations:**
- **macOS:** `~/Library/Application Support/Claude/config/mcp-config.json`
- **Linux:** `~/.config/Claude/mcp-config.json`
- **Windows:** `%APPDATA%\Claude\config\mcp-config.json`

**Using in Claude Desktop:**
1. Restart Claude Desktop after setup
2. Start a new conversation
3. Look for MCP toolkit icon (bottom of interface)
4. Select "imperial-codex" from available MCP servers
5. Use tools in prompts (e.g., "@get_pillar Pillar_001")

**Example prompt:**
```
@search_pillars "capital allocation"
Show me all pillars related to capital allocation and explain how they work.
```

---

## MCP Transports

### Stdio (Local)

**Configuration:**
```json
{
  "mcpServers": {
    "imperial-codex": {
      "command": "node",
      "args": ["/app/mcp-server.js"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

**Use cases:**
- Claude Desktop (local)
- Cursor (local)
- Local development

**Pros:**
- Direct process communication
- Lower latency
- No network overhead

**Cons:**
- Only on same machine
- Process-scoped

---

### HTTP/SSE (Remote)

**Configuration:**
```json
{
  "mcpServers": {
    "imperial-codex-remote": {
      "type": "http",
      "url": "http://mcp-server:3001"
    }
  }
}
```

**Use cases:**
- Docker containers (network)
- Kubernetes pods
- Remote development
- Multiple clients

**Pros:**
- Network accessible
- Stateless
- Scalable

**Cons:**
- Higher latency
- Network dependency
- Requires authentication (in production)

---

## Environment Variables

**Required for MCP:**
```bash
# In .env.local:
MCP_SERVER_URL=http://localhost:3001
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

**Docker Compose:**
```yaml
environment:
  NODE_ENV: development
  PORT: 3001
  MCP_TRANSPORT: http
  MCP_SERVER_URL: "http://mcp-server:3001"
```

**Dev Container:**
```json
{
  "remoteEnv": {
    "MCP_SERVER_URL": "http://localhost:3001",
    "ANTHROPIC_API_KEY": "${localEnv:ANTHROPIC_API_KEY}"
  }
}
```

---

## Available MCP Tools

### Read Tools (7)

| Tool | Input | Output |
|------|-------|--------|
| `get_pillar` | pillar_id | Full pillar details |
| `search_pillars` | query | Matching pillars (fuzzy search) |
| `get_os_module` | module_id | Module details + relationships |
| `list_os_modules` | (none) | All 36 OS modules |
| `search_library` | query | Library entries matching query |
| `get_library_entry` | entry_id | Entry details + context |
| `get_integration_map` | (none) | All 277 integrations graph |

### Write Tools (6)

| Tool | Input | Output |
|------|-------|--------|
| `generate_strike_output` | prompt | 5-part Strike (executive analysis → action plan → ritual) |
| `get_instrument` | instrument_id | DH-RES instrument details |
| `list_instruments` | (filter) | Instruments matching filter |
| `get_capital_allocation` | allocation_id | Allocation details + validation |
| `submit_capital_allocation` | 40/40/20 split | Submitted allocation + confirmation |
| `get_loop_status` | loop_id | Loop execution status + next run |

---

## Testing MCP

### Test HTTP endpoint

```bash
# Health check
curl http://localhost:3001/health

# List available tools
curl http://localhost:3001/api/tools

# Call a tool
curl -X POST http://localhost:3001/api/tools/search_pillars \
  -H "Content-Type: application/json" \
  -d '{"query": "capital allocation"}'
```

### Test with Claude

```bash
# In Claude Desktop (after ./mcp-setup.sh claude-desktop + restart):
@search_pillars capital allocation

# MCP will respond with matching pillars
```

### Test in Dev Container

```bash
# Inside container terminal (inside VS Code):
curl http://localhost:3001/health
# Should respond with: {"status":"healthy"}

# Call MCP tool
curl -X POST http://localhost:3001/api/tools/list_os_modules
```

---

## Troubleshooting

### MCP server won't start

**Check logs:**
```bash
docker logs imperial_codex-mcp
# or
docker compose -f docker-compose.mcp.yml logs imperial_codex-mcp
```

**Common issues:**
- Port 3001 already in use: `lsof -i :3001`
- Missing env vars: check `.env.local`
- App dependencies not built: `npm install && npm run build`

**Fix:**
```bash
docker compose -f docker-compose.mcp.yml down
docker compose -f docker-compose.mcp.yml up -d
```

### Claude Desktop can't connect to MCP

**Check:**
1. MCP server running: `curl http://localhost:3001/health`
2. Config file exists: `cat ~/Library/Application\ Support/Claude/config/mcp-config.json`
3. Claude Desktop restarted after setup

**Fix:**
```bash
# Re-run setup
./mcp-setup.sh claude-desktop

# Restart Claude Desktop (Command+Q on macOS, Alt+F4 on Windows)
```

### Dev Container MCP not accessible from host

**Issue:** Inside container `curl http://localhost:3001` works, but from host it doesn't

**Fix:** Port forwarding configured in `.devcontainer/devcontainer.json`
- Ports 3000, 3001, 9229 are already forwarded
- Access from host as: `http://localhost:3001`

**Verify:**
```bash
# On host machine
curl http://localhost:3001/health
# Should return: {"status":"healthy"}
```

### MCP tools return empty results

**Check:**
1. Core data loaded: `curl http://localhost:3001/api/debug/state`
2. Search index populated: MCP server logs should show "Kernel loaded"
3. Query syntax: Use simple keywords first

**Example working queries:**
```bash
curl -X POST http://localhost:3001/api/tools/search_pillars \
  -H "Content-Type: application/json" \
  -d '{"query": "growth"}'
```

---

## Production Deployment

### Kubernetes with MCP

```bash
# Generate K8s manifests (if not present)
kubectl apply -f kubernetes/mcp-deployment.yaml

# Scale MCP
kubectl scale deployment imperial-codex-mcp --replicas=3

# View MCP pods
kubectl get pods -l app=imperial-codex-mcp
```

### Docker Swarm

```bash
docker stack deploy -c docker-compose.mcp.yml imperial-codex
```

### Auto-scaling (Kubernetes HPA)

```bash
kubectl autoscale deployment imperial-codex-mcp \
  --min=2 --max=10 --cpu-percent=70
```

---

## Next Steps

1. **Start dev environment:** `./mcp-setup.sh docker` or `code .`
2. **Configure Claude:** `./mcp-setup.sh claude-desktop`
3. **Test tools:** Use Claude prompts with `@` syntax
4. **Deploy:** Use `./deploy.sh` or `./k8s-deploy.sh`

---

## Reference

- **MCP Config:** `mcp-config.json`
- **Dockerfile:** `docker/mcp.dockerfile`
- **Compose:** `docker-compose.mcp.yml`
- **Dev Container:** `.devcontainer/devcontainer.json`
- **Setup Script:** `mcp-setup.sh`
- **Kubernetes:** `kubernetes/mcp-deployment.yaml` (generate as needed)
