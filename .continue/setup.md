# Continue.dev Open Source Agent Setup Guide

## Quick Start

1. **Install Ollama** (if not already installed)
   ```bash
   # Windows (using winget)
   winget install Ollama.Ollama
   
   # Or download from https://ollama.com/download
   ```

2. **Pull Required Models**
   ```bash
   ollama pull qwen2.5:32b
   ollama pull phi4:mini
   ```

3. **Verify Models**
   ```bash
   ollama list
   # Should show: qwen2.5:32b and phi4:mini
   ```

4. **Restart Continue.dev**
   - Close and reopen Continue.dev
   - The new agent configuration will be loaded automatically

5. **Test Agent Selection**
   - Open Continue.dev chat
   - Send a test message
   - Check which agent responds (should be Qwen or Phi4, not Kiro)

## Configuration Overview

The `.continue` directory contains:

| File | Purpose |
|------|---------|
| `config.json` | Main agent routing configuration with priority order |
| `mcp_config.json` | MCP server connections (reuses your existing setup) |
| `prompt_library/open_source_agents.md` | This setup guide |

## Agent Routing Strategy

The configuration uses a **priority-based** routing system:

1. **Qwen Agentic** (Priority 1) - Complex reasoning, coding
2. **Phi4 Agentic** (Priority 2) - Quick tasks, lightweight work
3. **Kiro** (Priority 10) - Fallback when open source unavailable

## Troubleshooting

### Agents Not Selected

If Kiro is still being used instead of open source agents:

1. **Check Ollama is Running**
   ```bash
   ollama serve
   # Should show: Ollama is running at http://localhost:11434
   ```

2. **Verify Models**
   ```bash
   ollama list
   # Should show qwen2.5:32b and phi4:mini
   ```

3. **Restart Continue.dev**
   -完全关闭 Continue.dev
   -重新打开

4. **Check Config File**
   - Verify `config.json` is in `.continue` directory
   - Check for JSON syntax errors

### Model Download Issues

If model downloads fail:

```bash
# Try pulling with different quantization
ollama pull qwen2.5:32b-instruct
ollama pull phi4:q4_k_m  # Smaller, faster variant
```

### Connection Errors

If Continue.dev can't reach Ollama:

1. **Check Ollama service**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return list of installed models
   ```

2. **Firewall settings**
   - Allow Ollama through Windows Firewall
   - Check antivirus isn't blocking localhost connections

## Advanced Configuration

### Modify Agent Priority

Edit `config.json` and change the `priority` values:

```json
{
    "agents": [
        {
            "name": "phi4-agentic",
            "priority": 1  // Lower = higher priority
        },
        {
            "name": "qwen-agentic", 
            "priority": 2
        }
    ]
}
```

### Add More Open Source Agents

```json
{
    "agents": [
        {
            "name": "llama-agentic",
            "provider": "ollama",
            "model": "llama3:70b",
            "endpoint": "http://localhost:11434",
            "priority": 3,
            "enabled": true
        }
    ]
}
```

## Benefits

Using open source agents before Kiro credits provides:

- **Cost savings** - Free open source models vs paid Kiro credits
- **Unlimited usage** - No credit limits on open source agents
- **Local processing** - Data stays on your machine
- **Customizable** - Full control over agent behavior

## Next Steps

1. Test the setup with simple queries
2. Monitor which agents handle different task types
3. Adjust routing rules based on your usage patterns
4. Add more open source models as needed
