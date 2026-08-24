# Imperial Codex — Dual-Model OpenHands Setup

Full agentic stack: **Qwen 3.6** (primary) + **Phi-4 mini** (fallback)
running via Ollama, with a FastAPI router and OpenHands agent UI.

---

## Architecture

```
                ┌─────────────────────────────────────────┐
                │           imperial-agent-net             │
                │                                          │
  ┌──────────┐  │  ┌──────────┐    ┌──────────────────┐  │
  │ OpenHands│──┼──│  Router  │────│  qwen36 (Ollama) │  │
  │  :3000   │  │  │  :8000   │    │  qwen2.5:7b      │  │
  └──────────┘  │  │ FastAPI  │    │  port 8001       │  │
                │  └──────────┘    └──────────────────┘  │
                │        │                                 │
                │        └─────────┌──────────────────┐  │
                │                  │ phi4mini (Ollama) │  │
                │                  │  phi4-mini        │  │
                │                  │  port 8002        │  │
                │                  └──────────────────┘  │
                └─────────────────────────────────────────┘
```

### Routing Logic

| Prompt contains                                                      | Routes to                             |
| -------------------------------------------------------------------- | ------------------------------------- |
| code, python, function, debug, sql, algorithm, analyze, implement... | **Qwen 3.6**                          |
| Everything else (quick Q&A, summaries, simple tasks)                 | **Phi-4 mini**                        |
| Primary fails                                                        | Automatic fallback to the other model |

---

## Prerequisites

- Docker Desktop (Windows) with WSL2 backend
- 12 GB RAM minimum
- `HF_TOKEN` from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## Quick Start

### 1. Configure environment

```bash
cd OpenHands/
# Edit .env — set your HF_TOKEN
notepad .env
```

### 2. Start the full stack

```bash
./start-dual-mode.sh
```

On first run this pulls:

- `ollama/ollama:0.9.2` (× 2)
- `docker.openhands.dev/all-hands-ai/openhands:0.40`
- Model weights: `qwen2.5:7b-instruct` (~4.7 GB) + `phi4-mini` (~2.5 GB)

### 3. Verify everything is healthy

```bash
./verify-dual-model.sh
```

### 4. Open OpenHands

Navigate to **http://localhost:3000** — the agent is pre-configured to use Qwen via the router.

---

## Service URLs

| Service       | URL                            | Purpose                  |
| ------------- | ------------------------------ | ------------------------ |
| OpenHands UI  | http://localhost:3000          | Agentic coding interface |
| Router API    | http://localhost:8000          | Smart model routing      |
| Router models | http://localhost:8000/models   | Routing status           |
| Qwen (Ollama) | http://localhost:8001/api/tags | Qwen model list          |
| Phi (Ollama)  | http://localhost:8002/api/tags | Phi model list           |

---

## Resource Allocation

| Container | Memory limit | CPU threads | Model size            |
| --------- | ------------ | ----------- | --------------------- |
| qwen36    | 6 GB         | 4           | ~4.7 GB (Q4_K_M)      |
| phi4mini  | 4 GB         | 2           | ~2.5 GB (Q4_K_M)      |
| router    | ~128 MB      | —           | FastAPI               |
| openhands | ~512 MB      | —           | Agent UI              |
| **Total** | **~11 GB**   | **6**       | Leaves ~1 GB for host |

---

## MCP Integration

The Kiro MCP config (`.kiro/settings/mcp.json`) now includes:

- `ollama-qwen` — MCP server pointing to Qwen on port 8001
- `ollama-phi` — MCP server pointing to Phi on port 8002
- `model-router` — Fetch MCP proxy to the router on port 8000

These activate automatically when the Docker stack is running.

---

## Common Operations

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f qwen36
docker compose logs -f openhands

# Stop all services
docker compose down

# Stop and remove model volumes (re-download models next start)
docker compose down -v

# Rebuild router (after editing router.py)
docker compose up -d --build router

# Pull latest OpenHands image
docker compose pull openhands && docker compose up -d openhands

# Shell into Qwen container
docker exec -it qwen36 bash

# List Qwen models
docker exec qwen36 ollama list

# Pull a different model into Qwen
docker exec qwen36 ollama pull qwen2.5:14b
```

---

## Switching Models

To use a larger Qwen model (if RAM allows):

1. Edit `.env`:

   ```
   QWEN_MEM_LIMIT=10g
   ```

2. Pull the larger model:

   ```bash
   docker exec qwen36 ollama pull qwen2.5:14b
   ```

3. Update `router.py` `QWEN_MODEL` env or compose env:

   ```
   QWEN_MODEL=qwen2.5:14b
   ```

4. Restart router:
   ```bash
   docker compose up -d --build router
   ```

---

## GPU Mode (Optional)

If you have an NVIDIA GPU:

1. Install [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
2. In `docker-compose.yml`, uncomment the `runtime: nvidia` and `deploy.resources.reservations.devices` lines under `qwen36`/`phi4mini`
3. In `.env`:
   ```
   COMPUTE_MODE=gpu
   GPU_ENABLED=1
   GPU_COUNT=1
   QWEN_MEM_LIMIT=4g
   PHI_MEM_LIMIT=2g
   ```
4. Restart: `docker compose down && docker compose up -d`

---

## Troubleshooting

**Models not pulling?**

```bash
docker compose logs model-init
# If it failed, run manually:
docker exec qwen36 ollama pull qwen2.5:7b-instruct
docker exec phi4mini ollama pull phi4-mini
```

**OpenHands can't reach Qwen?**

```bash
# Check qwen36 is healthy
docker compose ps
# Test from inside OpenHands container
docker exec openhands curl http://qwen36:11434/api/tags
```

**Memory issues / OOM?**

```bash
# Reduce limits in .env:
QWEN_MEM_LIMIT=5g
PHI_MEM_LIMIT=3g
# Or use smaller quantization:
docker exec qwen36 ollama pull qwen2.5:3b
```

**Port conflicts?**
Edit `.env` — change `QWEN_PORT`, `PHI_PORT`, `ROUTER_PORT`, or `OPENHANDS_PORT` and restart.
