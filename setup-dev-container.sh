#!/bin/bash

# Imperial Codex - VS Code Dev Container Setup & Connection Guide

echo "🐳 Imperial Codex Dev Container Optimizer"
echo "=========================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."
command -v docker &> /dev/null || { echo "❌ Docker not found. Install Docker Desktop."; exit 1; }
command -v code &> /dev/null || { echo "⚠️  VS Code CLI not found (optional)"; }

# Ensure GitHub credentials are available
if [ ! -f ~/.ssh/id_rsa ]; then
    echo ""
    echo "⚠️  GitHub SSH key not found at ~/.ssh/id_rsa"
    echo "   Run: ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa"
    echo "   Then add the public key to GitHub: cat ~/.ssh/id_rsa.pub"
fi

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "⚠️  GITHUB_TOKEN not set"
    echo "   Create a token at: https://github.com/settings/tokens"
    echo "   Then run: export GITHUB_TOKEN=<your_token>"
fi

# Create .env.local from example if not exists
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from example..."
    cp .devcontainer/.env.example .env.local
    echo "⚠️  Edit .env.local with your API keys before continuing"
fi

echo ""
echo "🚀 Starting Dev Container..."
echo ""

# Build and start the dev container
docker compose -f docker-compose.dev.yml up --build -d

echo ""
echo "✅ Dev container started!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Open VS Code and install the 'Dev Containers' extension (if not installed)"
echo "2️⃣  Open the project folder in VS Code"
echo "3️⃣  Press Ctrl+Shift+P (or Cmd+Shift+P on macOS)"
echo "4️⃣  Type: 'Dev Containers: Attach to Running Container'"
echo "5️⃣  Select: 'imperial_codex-dev'"
echo ""
echo "OR use: code --remote 'docker-container://imperial_codex-dev' /app"
echo ""
echo "🌐 Access:"
echo "   • Next.js App: http://localhost:3000"
echo "   • MCP Server: http://localhost:3001"
echo "   • Node Debugger: localhost:9229"
echo ""
echo "📦 Extensions will auto-install in the container:"
echo "   • GitHub Copilot & Chat"
echo "   • GitLens"
echo "   • ESLint & Prettier"
echo "   • TypeScript Support"
echo "   • Docker"
echo "   • And more..."
echo ""
echo "💡 Tips:"
echo "   • GitHub credentials auto-configured from ~/.ssh and ~/.git-credentials"
echo "   • npm install optimized for fast container builds"
echo "   • Format on save enabled for all supported formats"
echo "   • Hot reload enabled for Next.js"
echo ""
echo "🔧 To stop: docker compose -f docker-compose.dev.yml down"
echo "📊 To view logs: docker compose -f docker-compose.dev.yml logs -f"
