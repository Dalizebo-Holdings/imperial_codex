# Agentic AI Setup for Imperial Codex

## Overview

This setup gives you **free, open-source AI coding agents** in VS Code using Docker Model Runner:

- **Cline (Claude Dev)** — Agentic AI that can read/write files, run commands, and iterate on code
- **OpenCode** — Lightweight open-source AI assistant for code completion and generation
- **Docker Model Runner** — Runs models locally (no API keys, no costs)

**Models used:**
- `ai/qwen3-coder` — Best for coding (large context window)
- `ai/devstral-small-2` — Good for agentic tasks, faster inference

---

## Setup Steps

### 1. Start Development Environment with Models

```bash
# From project root
docker compose -f docker-compose.dev.yml up --pull always
```

This starts:
- Your app on port 3000
- Model Runner on port 12434 with models pre-loaded

### 2. Install VS Code Extensions (in container)

Inside the container terminal:
```bash
# Linux/Mac
bash install-ai-extensions.sh

# Windows PowerShell
.\install-ai-extensions.bat
```

Or manually in VS Code:
- **Cline**: `saoudrizwan.claude-dev`
- **OpenCode**: `ryanohalloran.opencode`

### 3. Reload VS Code

**Ctrl+Shift+P** → **Developer: Reload Window**

---

## Using the AI Agents

### Cline (Agentic Coding)

1. **Ctrl+Shift+P** → **Cline: Open**
2. Describe what you want (e.g., "Create a TypeScript utility for API error handling")
3. Cline will:
   - Read your codebase
   - Write new files
   - Run tests
   - Iterate based on feedback
   - All autonomously

**Example prompts:**
```
"Add a new API endpoint for user authentication using NextAuth"
"Refactor the dashboard component to use React Query"
"Write unit tests for the validation service"
"Fix the TypeScript errors in the auth module"
```

### OpenCode (Code Completion)

1. Start typing code or highlight a section
2. **Ctrl+Shift+P** → **OpenCode: Generate** (or use inline completion)
3. AI suggests or completes the code
4. Accept/reject inline

**Example use cases:**
- Auto-complete function bodies
- Generate JSDoc comments
- Write test cases
- Suggest refactoring

---

## Extension Configuration

Already configured in `.devcontainer/devcontainer.json`:

```json
{
  "opencode.modelProvider": "openai-compatible",
  "opencode.apiBase": "http://model-runner:12434/engines/v1",
  "opencode.apiKey": "not-needed",
  "opencode.model": "ai/qwen3-coder",
  "cline.apiProvider": "openai-compatible",
  "cline.apiBase": "http://model-runner:12434/engines/v1",
  "cline.apiKey": "not-needed",
  "cline.modelId": "ai/qwen3-coder"
}
```

**To switch models**, update:
- `"opencode.model": "ai/devstral-small-2"`
- `"cline.modelId": "ai/devstral-small-2"`

Then reload VS Code.

---

## Available Models

| Model | Best For | Context | Speed |
|-------|----------|---------|-------|
| `ai/qwen3-coder` | Code generation, analysis | 128K | Medium |
| `ai/devstral-small-2` | Agentic tasks, tools | 4K | Fast |
| `ai/llama3.2` | General assistance | 8K | Medium |
| `ai/smollm2` | Quick tasks | 8K | Very fast |

Pull more models:
```bash
docker model pull ai/llama3.2
docker model pull ai/smollm2
docker model list  # See all available
```

---

## File Structure

```
.devcontainer/
  devcontainer.json        # Dev container config with AI settings
docker-compose.dev.yml     # App + Model Runner sidecar
install-ai-extensions.sh   # Extension installer (Unix)
install-ai-extensions.bat  # Extension installer (Windows)
```

---

## Troubleshooting

### "Model not found" error
```bash
# Pull the model
docker model pull ai/qwen3-coder
docker model pull ai/devstral-small-2
```

### "Connection refused" on port 12434
```bash
# Check Model Runner is running
docker ps | grep model-runner

# Restart it
docker restart imperial_codex-models
```

### Extensions not appearing in VS Code
```bash
# Reload window
Ctrl+Shift+P > Developer: Reload Window

# Or restart container
docker compose -f docker-compose.dev.yml restart app
```

### Slow inference
- Use `ai/devstral-small-2` (faster, 2.5B params)
- Reduce context window in extension settings
- Ensure model-runner has enough memory

### Out of memory
```bash
# Increase Docker Desktop memory
Settings > Resources > Memory > increase slider
```

---

## Advanced: Add Custom MCP Tools

Extend agents with Model Context Protocol tools from Docker Hub:

1. Update `docker-compose.dev.yml` to add MCP services
2. Reference in extension settings
3. Agents can now access databases, APIs, file systems via MCPs

Example: Add file indexing tool
```yaml
services:
  mcp-files:
    image: mcp/files:latest
    ports:
      - "3001:3001"
```

Then configure extension to use MCP server.

---

## Next Steps

1. **Try Cline now**: Ctrl+Shift+P → Cline: Open
2. **Ask it to generate**: "Create a new React hook for form validation"
3. **Review the code** it generates
4. **Iterate**: Give feedback and let it improve
5. **Push to GitHub** using GitLens integration

---

## Cost Comparison

| Setup | Cost | Speed | Privacy |
|-------|------|-------|---------|
| OpenAI API (GPT-4o) | $0.03/1K tokens | Fast | Cloud |
| Claude API | $0.003/1K tokens | Medium | Cloud |
| **Docker Model Runner (local)** | **Free** | **Medium** | **100% Local** |

---

## References

- [Docker Model Runner Docs](https://docs.docker.com/ai/model-runner/)
- [Cline (Claude Dev) GitHub](https://github.com/saoudrizwan/claude-dev)
- [OpenCode GitHub](https://github.com/opencode-ai/opencode)
- [Docker Agent Framework](https://docs.docker.com/ai/docker-agent/)
