#!/bin/bash
# Docker & Git Setup for imperial_codex

echo "=== Setting up Docker for VS Code ==="

# Configure Docker daemon socket (if on Linux/Mac)
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    export DOCKER_HOST=unix:///var/run/docker.sock
    echo "Docker socket configured for Unix systems"
fi

echo ""
echo "=== Installing VS Code Extensions ==="
code --install-extension ms-vscode.docker
code --install-extension ms-vscode-remote.remote-containers
code --install-extension eamodio.gitlens
code --install-extension esbenp.prettier-vscode

echo ""
echo "=== Configuring Git ==="
git config user.name "Lucas"
git config user.email "your-email@example.com"

echo ""
echo "=== Docker + Git Setup Complete ==="
echo "✓ VS Code extensions installed"
echo "✓ Docker configured"
echo "✓ Git user configured"
echo ""
echo "Next steps:"
echo "1. Open imperial_codex.code-workspace in VS Code"
echo "2. Run: docker compose up --pull always"
echo "3. Use VS Code's Remote - Containers extension to attach to the running container"
