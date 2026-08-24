#!/bin/bash

# Open-Source MCP Servers Setup
# Configures all available MCP servers locally or in Docker
# Usage: ./mcp-servers-setup.sh [mode]
# Modes: docker (default), local, install-only

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

# Mode: Docker Compose (All servers)
setup_docker() {
  section "Starting Open-Source MCP Servers (Docker Compose)"

  log "Verifying Docker..."
  if ! docker ps > /dev/null 2>&1; then
    error "Docker daemon not running"
  fi
  success "Docker is running"

  log "Starting all MCP servers..."
  log "Services starting:"
  echo "  • imperial-codex (port 3001)"
  echo "  • filesystem (port 3002)"
  echo "  • git (port 3003)"
  echo "  • postgres (port 5432)"
  echo "  • postgres-mcp (port 3004)"
  echo "  • sqlite (port 3005)"
  echo "  • web-search (port 3006)"
  echo "  • memory (port 3007)"
  echo "  • github (port 3008)"
  echo "  • slack (port 3009)"
  echo "  • docker (port 3010)"
  echo "  • http (port 3011)"
  echo ""

  docker compose -f docker-compose.mcp-servers.yml up -d

  log "Waiting for services to be healthy (15s)..."
  sleep 15

  section "Service Status"

  docker compose -f docker-compose.mcp-servers.yml ps

  # Test endpoints
  section "Testing MCP Server Endpoints"

  SERVERS=(
    "3001:imperial-codex"
    "3002:filesystem"
    "3003:git"
    "3004:postgres"
    "3005:sqlite"
    "3006:web-search"
    "3007:memory"
    "3008:github"
    "3009:slack"
    "3010:docker"
    "3011:http"
  )

  for server in "${SERVERS[@]}"; do
    IFS=':' read -r port name <<< "$server"
    
    if curl -sf http://localhost:$port > /dev/null 2>&1; then
      success "$name (port $port) responding"
    else
      warning "$name (port $port) not responding yet"
    fi
  done

  section "Docker MCP Setup Complete ✓"

  echo "All MCP servers are running!"
  echo ""
  echo "API Endpoints:"
  echo "  Imperial Codex:  http://localhost:3001"
  echo "  Filesystem:      http://localhost:3002"
  echo "  Git:             http://localhost:3003"
  echo "  PostgreSQL:      localhost:5432"
  echo "  PostgreSQL MCP:  http://localhost:3004"
  echo "  SQLite:          http://localhost:3005"
  echo "  Web Search:      http://localhost:3006"
  echo "  Memory:          http://localhost:3007"
  echo "  GitHub:          http://localhost:3008"
  echo "  Slack:           http://localhost:3009"
  echo "  Docker:          http://localhost:3010"
  echo "  HTTP:            http://localhost:3011"
  echo ""
  echo "Commands:"
  echo "  View logs: docker compose -f docker-compose.mcp-servers.yml logs -f"
  echo "  Stop:      docker compose -f docker-compose.mcp-servers.yml down"
  echo "  Restart:   docker compose -f docker-compose.mcp-servers.yml restart"
}

# Mode: Local Installation
setup_local() {
  section "Installing Open-Source MCP Servers Locally"

  log "Checking npm..."
  if ! command -v npm &> /dev/null; then
    error "npm is not installed"
  fi
  success "npm installed"

  SERVERS=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-git"
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-sqlite"
    "@modelcontextprotocol/server-web-search"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-slack"
    "@modelcontextprotocol/server-docker"
    "@modelcontextprotocol/server-http"
  )

  log "Installing MCP server packages..."
  for server in "${SERVERS[@]}"; do
    log "Installing $server..."
    npm install -g "$server" 2>/dev/null || warning "Failed to install $server"
  done

  success "All MCP servers installed globally"

  section "Local MCP Setup Complete ✓"

  echo "Start individual servers with:"
  echo ""
  echo "  @modelcontextprotocol/server-filesystem ."
  echo "  @modelcontextprotocol/server-git"
  echo "  @modelcontextprotocol/server-postgres"
  echo "  @modelcontextprotocol/server-sqlite"
  echo "  @modelcontextprotocol/server-web-search"
  echo "  @modelcontextprotocol/server-memory"
  echo "  @modelcontextprotocol/server-github"
  echo "  @modelcontextprotocol/server-slack"
  echo "  @modelcontextprotocol/server-docker"
  echo "  @modelcontextprotocol/server-http"
}

# Mode: Install only (no start)
setup_install_only() {
  section "Downloading MCP Server Packages"

  log "Using npx to pre-cache packages..."
  
  SERVERS=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-git"
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-sqlite"
    "@modelcontextprotocol/server-web-search"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-slack"
    "@modelcontextprotocol/server-docker"
    "@modelcontextprotocol/server-http"
  )

  for server in "${SERVERS[@]}"; do
    log "Pre-caching $server..."
    npx -y "$server" --help > /dev/null 2>&1 || true
  done

  success "All packages pre-cached"

  echo ""
  echo "Start Docker mode with: ./mcp-servers-setup.sh docker"
}

# Main
case "$MODE" in
  docker)
    setup_docker
    ;;
  local)
    setup_local
    ;;
  install-only)
    setup_install_only
    ;;
  *)
    section "Open-Source MCP Servers Setup"
    echo "Usage: ./mcp-servers-setup.sh [mode]"
    echo ""
    echo "Modes:"
    echo "  docker          Start all MCP servers in Docker Compose (recommended)"
    echo "  local           Install MCP servers globally on host"
    echo "  install-only    Pre-cache packages without starting"
    echo ""
    echo "Examples:"
    echo "  ./mcp-servers-setup.sh docker       # Start all servers in Docker"
    echo "  ./mcp-servers-setup.sh local        # Install on host machine"
    echo ""
    echo "Available Servers (11 total):"
    echo "  • filesystem    - File read/write/create/delete operations"
    echo "  • git           - Repository log, diff, branches, commits"
    echo "  • postgres      - SQL queries to PostgreSQL database"
    echo "  • sqlite        - SQL queries to SQLite database"
    echo "  • web-search    - Internet search (Brave/Google)"
    echo "  • memory        - Persistent context storage"
    echo "  • github        - GitHub API (issues, PRs, repos)"
    echo "  • slack         - Slack messaging and operations"
    echo "  • docker        - Docker container and image management"
    echo "  • http          - HTTP client for web requests"
    echo "  • imperial-codex - Your custom MCP server (13 tools)"
    echo ""
    exit 1
    ;;
esac
