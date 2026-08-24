#!/bin/bash

# Imperial Codex: One-Time Setup Script
# Automates initial project configuration
# Usage: ./setup.sh

set -e

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

# Check prerequisites
section "Checking Prerequisites"

if ! command -v docker &> /dev/null; then
  error "Docker is not installed. Please install Docker Desktop."
fi
success "Docker is installed"

if ! command -v npm &> /dev/null; then
  error "Node.js/npm is not installed. Please install Node.js 20+"
fi
success "npm is installed"

if ! command -v git &> /dev/null; then
  error "Git is not installed. Please install Git."
fi
success "Git is installed"

# Check Docker daemon
if ! docker ps > /dev/null 2>&1; then
  error "Docker daemon is not running. Please start Docker Desktop."
fi
success "Docker daemon is running"

# Setup environment file
section "Setting Up Environment"

if [ -f ".env.local" ]; then
  warning ".env.local already exists. Skipping creation."
else
  cp .env.example .env.local
  success "Created .env.local from .env.example"
  warning "IMPORTANT: Edit .env.local with your API keys:"
  echo ""
  echo "  nano .env.local"
  echo ""
  echo "Required (at minimum):"
  echo "  - OPENAI_API_KEY"
  echo "  - ANTHROPIC_API_KEY"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_ANON_KEY"
  echo "  - SESSION_SECRET (generate: openssl rand -base64 32)"
  echo ""
fi

# Install dependencies
section "Installing Dependencies"

if [ -d "node_modules" ]; then
  warning "node_modules already exists. Skipping npm install."
else
  log "Running: npm ci"
  npm ci
  success "Dependencies installed"
fi

# Make scripts executable
section "Setting Up Scripts"

for script in docker-push.sh docker-health-check.sh docker-health-monitor.sh setup.sh deploy.sh k8s-deploy.sh monitoring-setup.sh; do
  if [ -f "$script" ]; then
    chmod +x "$script"
    success "Made $script executable"
  fi
done

# Setup dev container (optional)
section "Dev Container Setup (Optional)"

if command -v code &> /dev/null; then
  log "VS Code detected"
  
  read -p "Install Dev Container extensions? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    code --install-extension ms-vscode-remote.remote-containers
    code --install-extension ms-vscode.docker
    success "Extensions installed"
  fi
else
  warning "VS Code not found. Install extensions manually:"
  echo "  - ms-vscode-remote.remote-containers"
  echo "  - ms-vscode.docker"
fi

# Build Docker image (optional)
section "Docker Image Build (Optional)"

read -p "Build production Docker image now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log "Building Docker image (this may take 5-10 minutes)..."
  docker build --target runner -t imperial-codex:latest .
  success "Docker image built successfully"
  
  # Show size
  SIZE=$(docker images --format "table {{.Size}}" imperial-codex:latest | tail -1)
  log "Image size: $SIZE"
else
  log "Skipping Docker build. Build later with:"
  echo "  docker build --target runner -t imperial-codex:latest ."
fi

# GitHub Secrets reminder
section "GitHub Actions Setup"

echo "To enable CI/CD, add these secrets to your GitHub repo:"
echo ""
echo "1. Go to: Settings → Secrets and variables → Actions"
echo ""
echo "2. Add DOCKER_HUB_USERNAME:"
echo "   - Name: DOCKER_HUB_USERNAME"
echo "   - Value: your-docker-username"
echo ""
echo "3. Add DOCKER_HUB_TOKEN:"
echo "   - Name: DOCKER_HUB_TOKEN"
echo "   - Value: <PAT from https://hub.docker.com/settings/security>"
echo ""
echo "After adding, the workflow will auto-trigger on:"
echo "   - Push to main/develop"
echo "   - Git tags (v*)"
echo ""

# Summary
section "Setup Complete ✓"

echo "Next steps:"
echo ""
echo "1. Configure environment:"
echo "   nano .env.local"
echo ""
echo "2. Start development:"
echo "   Option A (Dev Container):"
echo "     code ."
echo "     Ctrl+Shift+P → Dev Containers: Reopen in Container"
echo ""
echo "   Option B (Docker Compose):"
echo "     docker compose -f docker-compose.dev.yml up"
echo ""
echo "   Option C (Local):"
echo "     npm run dev"
echo ""
echo "3. Deploy to production:"
echo "   ./deploy.sh"
echo ""
echo "4. Deploy to Kubernetes:"
echo "   ./k8s-deploy.sh"
echo ""
echo "5. Setup health monitoring:"
echo "   ./monitoring-setup.sh"
echo ""
echo "Documentation:"
echo "   - QUICK_START.md"
echo "   - SETUP_CHECKLIST.md"
echo "   - HEALTH_CHECKS_GUIDE.md"
echo "   - DOCKER_REGISTRY_CI_CD.md"
echo ""
success "Happy coding! 🚀"
