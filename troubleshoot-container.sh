#!/bin/bash
# Quick troubleshooting for VS Code Remote Container attachment

echo "=== Docker Status Check ==="
docker --version
docker ps -a

echo ""
echo "=== Checking imperial_codex container ==="
docker ps -a | grep -i imperial || echo "No running imperial_codex container found"

echo ""
echo "=== Troubleshooting Steps ==="
echo "1. Ensure Docker Desktop is running"
echo "2. Verify container is running: docker compose up --pull always"
echo "3. Check container logs: docker logs imperial_codex_app_1"
echo "4. Restart container: docker compose down && docker compose up"
echo "5. In VS Code:"
echo "   - Cmd+Shift+P -> Remote-Containers: Open Folder in Container"
echo "   - Select the imperial_codex folder"
echo ""
echo "6. If still failing, try the attach method:"
echo "   - Cmd+Shift+P -> Remote-Containers: Attach to Running Container"
echo "   - Ensure container name appears in list"
echo ""
echo "=== VS Code Extension Check ==="
code --list-extensions | grep -E "ms-vscode.docker|remote-containers" || echo "Required extensions may not be installed"
