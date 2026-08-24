#!/bin/bash
set -e

echo "🚀 Imperial Codex Dev Container Initialization"

# GitHub SSH Key Setup
if [ -d "/root/.ssh" ] && [ -f "/root/.ssh/id_rsa" ]; then
    echo "✓ SSH key detected"
    chmod 600 /root/.ssh/id_rsa
    chmod 644 /root/.ssh/id_rsa.pub 2>/dev/null || true
    eval "$(ssh-agent -s)" > /dev/null
    ssh-add /root/.ssh/id_rsa 2>/dev/null || true
    ssh-keyscan -t rsa github.com >> /root/.ssh/known_hosts 2>/dev/null || true
fi

# Git Credentials
if [ -f "/root/.git-credentials" ]; then
    echo "✓ Git credentials configured"
    git config --global credential.helper store
fi

# GitHub Token for API calls
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✓ GitHub token available"
    git config --global credential.https://github.com.helper '!f() { echo "username=token"; echo "password=$GITHUB_TOKEN"; }; f'
fi

# Configure git user (use GitHub defaults if available)
git config --global user.email "$(git config --global user.email || echo 'dev@imperialcodex.local')"
git config --global user.name "$(git config --global user.name || echo 'Imperial Codex Dev')"

# NPM Configuration for fast installs
echo "📦 Configuring NPM for optimal performance..."
npm config set maxsockets 50
npm config set fetch-timeout 120000
npm cache verify 2>/dev/null || true

# Install dependencies
if [ -f "package-lock.json" ]; then
    echo "📥 Installing dependencies from package-lock.json..."
    npm ci --prefer-offline --no-audit --legacy-peer-deps
else
    echo "📥 Installing dependencies from package.json..."
    npm install --prefer-offline --no-audit --legacy-peer-deps
fi

# Build project
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "🔨 Building project..."
    npm run build || true
fi

echo "✅ Dev container ready!"
echo "🌐 Services will start on:"
echo "   - Next.js: http://localhost:3000"
echo "   - MCP Server: http://localhost:3001"
echo "   - Debugger: localhost:9229"
