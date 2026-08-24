#!/bin/bash
# Install AI coding extensions in container

echo "=== Installing Agentic AI Extensions ==="

# Cline (agentic coding assistant - Claude Dev)
code --install-extension saoudrizwan.claude-dev

# OpenCode (open-source AI coding assistant)
code --install-extension ryanohalloran.opencode

# GitHub Copilot (optional, if you have access)
# code --install-extension GitHub.copilot

echo "✓ Extensions installed"
echo ""
echo "=== Extension Configuration ==="
echo ""
echo "1. Cline (Claude Dev) - Agentic AI for coding"
echo "   - Configured to use local Docker Model Runner"
echo "   - Model: ai/qwen3-coder or ai/devstral-small-2"
echo "   - Base URL: http://model-runner:12434/engines/v1"
echo ""
echo "2. OpenCode - Open-source AI assistant"
echo "   - Also connected to Docker Model Runner"
echo "   - Free, no API key needed"
echo ""
echo "=== Next Steps ==="
echo "1. Restart VS Code or reload window (Ctrl+Shift+P → Developer: Reload Window)"
echo "2. Open Command Palette (Ctrl+Shift+P)"
echo "3. Try:"
echo "   - 'Cline: Open' to start agentic coding"
echo "   - 'OpenCode: Generate' to use AI completion"
echo ""
echo "=== Models Available ==="
docker model list 2>/dev/null || echo "Run 'docker model pull' to load models locally"
