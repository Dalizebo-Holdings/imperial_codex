# Open Source Agent Configuration

This configuration enables Continue.dev to use open source agents (Qwen, Phi4) before falling back to Kiro agent credits.

## Agent Priority Order

1. **Qwen Agentic** - Primary open source agent (Qwen 2.5 32B)
   - Best for complex reasoning and coding tasks
   - Runs on local Ollama instance
2. **Phi4 Agentic** - Secondary open source agent (Phi-4 Mini)
   - Best for quick tasks and lightweight operations
   - Runs on local Ollama instance
3. **Kiro** - Fallback agent
   - Used when open source agents are unavailable or exhausted
   - Uses Kiro agent credits

## How It Works

- Continue.dev checks agent priorities first
- Open source agents (Ollama) are tried first
- Kiro agent is only used as a fallback
- This preserves your Kiro credits while leveraging free open source models

## Ollama Setup Required

Make sure you have Ollama running with the required models:

```bash
# Pull required models
ollama pull qwen2.5:32b
ollama pull phi4:mini

# Start Ollama server (default: http://localhost:11434)
ollama serve
```

## Configuration Files

- `config.json` - Main agent routing configuration
- `mcp_config.json` - MCP server configuration (reuses your existing mcp-config.json)
- `prompt_library/` - Custom prompts for each agent type

## Customizing Agent Rules

Edit `agent_routing.rules` in `config.json` to adjust:

- Which agent handles which task type
- Priority order for specific task categories
- Fallback behavior

## Monitoring Agent Usage

Check which agents are being used by:

1. Looking at the agent selection in Continue.dev sidebar
2. Reviewing task completion logs
3. Monitoring Ollama server metrics
