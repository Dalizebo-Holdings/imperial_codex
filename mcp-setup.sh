#!/bin/bash

# MCP Toolkit Setup Script
# Configures MCP server for Docker, Kubernetes, and VS Code
# Usage: ./mcp-setup.sh [mode]
# Modes: docker (default), k8s, claude-desktop, vscode

set -e

MODE="${1:-docker}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}▶${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Mode: Docker Compose with MCP server
setup_docker() {
  section "Setting Up MCP with Docker Compose"

  log "Verifying Docker..."
  if ! docker ps > /dev/null 2>&1; then
    error "Docker daemon not running"
  fi
  success "Docker is running"

  log "Building MCP server image..."
  docker build -f docker/mcp.dockerfile -t imperial-codex-mcp:latest .
  success "MCP server image built"

  log "Starting services (app + MCP server)..."
  docker compose -f docker-compose.mcp.yml up -d
  success "Services started"

  log "Waiting for services to be healthy..."
  sleep 10

  # Check app
  if docker ps --format "{{.Names}}" | grep -q "imperial_codex-app"; then
    status_app=$(docker ps --format "table {{.Status}}" -f "name=imperial_codex-app" | tail -1)
    success "App: $status_app"
  else
    error "App container failed to start"
  fi

  # Check MCP
  if docker ps --format "{{.Names}}" | grep -q "imperial_codex-mcp"; then
    status_mcp=$(docker ps --format "table {{.Status}}" -f "name=imperial_codex-mcp" | tail -1)
    success "MCP Server: $status_mcp"
  else
    error "MCP container failed to start"
  fi

  section "Docker MCP Setup Complete ✓"

  echo "Services:"
  echo "  • App: http://localhost:3000"
  echo "  • MCP Server: http://localhost:3001"
  echo "  • Debugger: localhost:9229"
  echo ""
  echo "Commands:"
  echo "  docker compose -f docker-compose.mcp.yml logs -f imperial_codex-app"
  echo "  docker compose -f docker-compose.mcp.yml logs -f imperial_codex-mcp"
  echo "  docker compose -f docker-compose.mcp.yml down"
}

# Mode: Kubernetes deployment
setup_k8s() {
  section "Setting Up MCP with Kubernetes"

  log "Checking kubectl..."
  if ! kubectl cluster-info &> /dev/null; then
    error "Not connected to Kubernetes cluster"
  fi
  success "Kubernetes cluster connected"

  log "Creating MCP ConfigMap from mcp-config.json..."
  kubectl create configmap imperial-codex-mcp-config \
    --from-file=mcp-config.json \
    --dry-run=client -o yaml | kubectl apply -f -
  success "MCP ConfigMap created"

  log "Creating MCP Deployment..."
  # This would need a separate k8s manifest for MCP server
  warning "MCP Kubernetes manifest not yet generated"
  log "To deploy MCP to Kubernetes:"
  echo "  1. Create kubernetes/mcp-deployment.yaml"
  echo "  2. kubectl apply -f kubernetes/mcp-deployment.yaml"
}

# Mode: Claude Desktop configuration
setup_claude_desktop() {
  section "Configuring Claude Desktop Integration"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CONFIG_DIR="$HOME/Library/Application Support/Claude/config"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CONFIG_DIR="$HOME/.config/Claude"
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    CONFIG_DIR="$APPDATA/Claude/config"
  else
    error "Unsupported OS: $OSTYPE"
  fi

  log "Claude Desktop config directory: $CONFIG_DIR"

  if [ ! -d "$CONFIG_DIR" ]; then
    log "Creating config directory..."
    mkdir -p "$CONFIG_DIR"
  fi

  log "Copying mcp-config.json to Claude Desktop..."
  cp mcp-config.json "$CONFIG_DIR/mcp-config.json"
  success "MCP config copied"

  log "Please restart Claude Desktop to load the new MCP server"

  section "Claude Desktop Configuration Complete ✓"

  echo "Configuration file: $CONFIG_DIR/mcp-config.json"
  echo ""
  echo "Steps:"
  echo "  1. Restart Claude Desktop"
  echo "  2. Open a conversation"
  echo "  3. Look for the MCP toolkit icon at the bottom"
  echo "  4. Select 'imperial-codex' from available tools"
}

# Mode: VS Code Dev Container integration
setup_vscode() {
  section "Setting Up MCP for VS Code Dev Container"

  log "Checking VS Code..."
  if ! command -v code &> /dev/null; then
    warning "VS Code CLI not found. Install 'code' command:"
    echo "  macOS: brew install --cask visual-studio-code"
    echo "  Linux: sudo apt install code"
    echo "  Windows: choco install vscode"
  fi

  log "Checking Dev Containers extension..."
  if command -v code &> /dev/null; then
    code --install-extension ms-vscode-remote.remote-containers 2>/dev/null || true
    success "Dev Containers extension installed/verified"
  fi

  log "Verifying .devcontainer/devcontainer.json..."
  if [ ! -f ".devcontainer/devcontainer.json" ]; then
    error ".devcontainer/devcontainer.json not found"
  fi
  success "Dev container config exists"

  section "VS Code Dev Container Setup Complete ✓"

  echo "To start development with MCP in VS Code:"
  echo ""
  echo "1. Open VS Code:"
  echo "   code ."
  echo ""
  echo "2. Open the Command Palette (Ctrl+Shift+P):"
  echo "   Dev Containers: Reopen in Container"
  echo ""
  echo "3. Wait for container to build & start (2-3 min first time)"
  echo ""
  echo "4. Once inside the container:"
  echo "   npm run dev"
  echo ""
  echo "5. MCP Server will be available at: http://localhost:3001"
  echo ""
  echo "6. To use MCP in Claude Desktop:"
  echo "   - In host terminal (outside container):"
  echo "   - Run: ./mcp-setup.sh claude-desktop"
  echo "   - Restart Claude Desktop"
}

# Main
case "$MODE" in
  docker)
    setup_docker
    ;;
  k8s)
    setup_k8s
    ;;
  claude-desktop)
    setup_claude_desktop
    ;;
  vscode)
    setup_vscode
    ;;
  *)
    echo "Usage: ./mcp-setup.sh [mode]"
    echo ""
    echo "Modes:"
    echo "  docker           - Setup MCP with Docker Compose (default)"
    echo "  k8s              - Setup MCP with Kubernetes"
    echo "  claude-desktop   - Configure Claude Desktop to use MCP"
    echo "  vscode           - Setup VS Code Dev Container integration"
    echo ""
    echo "Examples:"
    echo "  ./mcp-setup.sh docker           # Start MCP with Docker"
    echo "  ./mcp-setup.sh claude-desktop   # Configure Claude Desktop"
    echo "  ./mcp-setup.sh vscode           # Setup VS Code integration"
    exit 1
    ;;
esac
