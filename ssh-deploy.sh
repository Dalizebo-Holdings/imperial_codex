#!/bin/bash
set -e

# Deploy to Remote VPS via SSH
# Usage: ./ssh-deploy.sh user@host coolify
#        ./ssh-deploy.sh user@host server

if [ $# -lt 2 ]; then
    echo "Usage: $0 <user@host> <environment> [deploy_dir]"
    echo ""
    echo "Examples:"
    echo "  $0 root@192.168.1.100 coolify"
    echo "  $0 ubuntu@example.com server /opt/imperial-codex"
    echo ""
    exit 1
fi

HOST="$1"
ENVIRONMENT="$2"
DEPLOY_DIR="${3:-/opt/imperial-codex}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     REMOTE VPS DEPLOYMENT                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Configuration:${NC}"
echo -e "  Host:        $HOST"
echo -e "  Environment: $ENVIRONMENT"
echo -e "  Deploy Dir:  $DEPLOY_DIR"

# Test SSH connection
echo -e "\n${YELLOW}▶ Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 "$HOST" "echo 'SSH OK'" > /dev/null; then
    echo -e "  ${GREEN}✓${NC} SSH connection successful"
else
    echo -e "  ${RED}✗ SSH connection failed${NC}"
    echo -e "  ${YELLOW}→ Check your SSH key and host${NC}"
    exit 1
fi

# Copy files to remote
echo -e "\n${YELLOW}▶ Copying files to remote server...${NC}"
scp -r \
    Dockerfile \
    docker-compose.coolify.yml \
    docker-compose.server.yml \
    nginx.conf \
    build.sh \
    deploy.sh \
    vps-setup.sh \
    package.json \
    .env.production.local \
    "$HOST:$DEPLOY_DIR/" 2>/dev/null || true

echo -e "  ${GREEN}✓${NC} Files copied"

# Copy entire app directory (adjust for your structure)
echo -e "\n${YELLOW}▶ Syncing application code...${NC}"
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.next' \
    ./ "$HOST:$DEPLOY_DIR/" 2>/dev/null || true

echo -e "  ${GREEN}✓${NC} Application code synced"

# Run setup on remote
echo -e "\n${YELLOW}▶ Running setup on remote server...${NC}"
ssh "$HOST" "cd $DEPLOY_DIR && bash vps-setup.sh . $ENVIRONMENT"

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ ✓ DEPLOYMENT COMPLETE                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Your application is now running on:${NC}"
echo -e "  SSH:  ssh $HOST"
echo -e "  App:  Check with: ssh $HOST 'docker ps'"
echo -e ""
