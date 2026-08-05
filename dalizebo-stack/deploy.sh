#!/bin/bash
# =============================================================================
# DALIZEBO.CO.ZA - 10 PILLARS DEPLOYMENT SCRIPT
# Modern, Secure, Self-Healing Infrastructure
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dalizebo 10 Pillars Stack Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}🔒 IMPORTANT: Edit .env and set all secure passwords before proceeding!${NC}"
    echo -e "${YELLOW}Run this script again after configuring .env${NC}"
    exit 1
fi

# Load environment variables
source .env

# Create required directories
echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p configs/{traefik,crowdsec,grafana/provisioning,dashboards,prometheus,redis,postgres,ollama}
mkdir -p data/{uptime-kuma,n8n,supabase/db,gitea/postgres,chatwoot/postgres,nextcloud/{apps,config,data}}
mkdir -p logs backups scripts

# Set permissions
chmod 600 .env
chown root:root .env 2>/dev/null || true

# Check Docker installation
echo -e "${BLUE}🐳 Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose v2+.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker $(docker --version) detected${NC}"
echo -e "${GREEN}✅ Docker Compose $(docker compose version --short) detected${NC}"

# Create external proxy network if it doesn't exist
echo -e "${BLUE}🌐 Setting up networks...${NC}"
if ! docker network ls | grep -q "dalizebo-proxy"; then
    docker network create dalizebo-proxy
    echo -e "${GREEN}✅ Created dalizebo-proxy network${NC}"
else
    echo -e "${GREEN}✅ dalizebo-proxy network already exists${NC}"
fi

# Create internal network if it doesn't exist
if ! docker network ls | grep -q "dalizebo-internal"; then
    docker network create dalizebo-internal
    echo -e "${GREEN}✅ Created dalizebo-internal network${NC}"
else
    echo -e "${GREEN}✅ dalizebo-internal network already exists${NC}"
fi

# Stop and remove existing containers (graceful migration)
echo -e "${YELLOW}🔄 Checking for existing containers...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^dalizebo-"; then
    echo -e "${YELLOW}⚠️  Existing Dalizebo containers found. Stopping gracefully...${NC}"
    docker compose down --remove-orphans 2>/dev/null || true
fi

# Pull latest images
echo -e "${BLUE}⬇️  Pulling latest container images...${NC}"
docker compose pull

# Deploy Traefik first (reverse proxy)
echo -e "${BLUE}🚀 Deploying Traefik Reverse Proxy...${NC}"
docker compose up -d traefik

# Wait for Traefik to be ready
sleep 5

# Deploy core infrastructure (databases, redis)
echo -e "${BLUE}🚀 Deploying Core Infrastructure (PostgreSQL, Redis)...${NC}"
docker compose up -d postgres redis meilisearch

# Wait for databases to initialize
echo -e "${YELLOW}⏳ Waiting for databases to initialize (30s)...${NC}"
sleep 30

# Deploy all services
echo -e "${BLUE}🚀 Deploying All 10 Pillars Services...${NC}"
docker compose up -d

# Show status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "  Executive Cockpit:   https://cockpit.${DOMAIN}"
echo -e "  Office (Nextcloud):  https://office.${DOMAIN}"
echo -e "  Documentation:       https://docs.${DOMAIN}"
echo -e "  Vault (Passwords):   https://vault.${DOMAIN}"
echo -e "  Chat (Support):      https://chat.${DOMAIN}"
echo -e "  ERP (Accounting):    https://erp.${DOMAIN}"
echo -e "  Supabase Studio:     https://studio.${DOMAIN}"
echo -e "  Git (Gitea):         https://git.${DOMAIN}"
echo -e "  n8n (Automation):    https://n8n.${DOMAIN}"
echo -e "  Status Monitor:      https://status.${DOMAIN}"

echo ""
echo -e "${YELLOW}⚠️  SECURITY REMINDERS:${NC}"
echo -e "  1. Change ALL default passwords in .env immediately"
echo -e "  2. Configure DNS records for all subdomains"
echo -e "  3. Enable Cloudflare proxy for SSL certificates"
echo -e "  4. Run: docker exec dalizebo-vaultwarden /vaultwarden-admin"

echo ""
echo -e "${YELLOW}📦 Storage Management:${NC}"
echo -e "  Auto-prune enabled at 85% disk usage"
echo -e "  Log rotation: 10MB max, 3 files per service"
echo -e "  Backup retention: ${BACKUP_RETENTION_DAYS:-30} days"

echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "  View logs:        docker compose logs -f [service]"
echo -e "  Restart service:  docker compose restart [service]"
echo -e "  Stop all:         docker compose down"
echo -e "  Update all:       docker compose pull && docker compose up -d"
echo -e "  Backup now:       docker exec dalizebo-backup-runner /scripts/backup.sh"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Welcome to the Dalizebo 10 Pillars Stack!${NC}"
echo -e "${GREEN}========================================${NC}"
