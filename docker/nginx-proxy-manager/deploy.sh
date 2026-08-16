#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Modern Full Stack Deploy                ${NC}"
echo -e "${BLUE}  dalizebo.co.za | 2.28.6.68               ${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}Note: You may need sudo privileges for some operations${NC}"
fi

# Create necessary directories
echo -e "${GREEN}[1/6] Creating directories...${NC}"
mkdir -p data/npm-data
mkdir -p data/portainer-data
mkdir -p data/uptime-kuma-data
mkdir -p data/filebrowser-data
mkdir -p data/filebrowser-db
mkdir -p data/filebrowser-config
mkdir -p data/redis-data
mkdir -p data/postgres-data
mkdir -p data/postgres-backups
mkdir -p data/postgres-init
mkdir -p data/mariadb-data
mkdir -p data/mariadb-backups
mkdir -p data/mariadb-init
mkdir -p data/mongodb-data
mkdir -p data/mongodb-backups
mkdir -p data/grafana-data
mkdir -p data/grafana-provisioning
mkdir -p data/prometheus-data
mkdir -p data/prometheus-config
mkdir -p data/loki-data
mkdir -p data/loki-config
mkdir -p data/promtail-config
mkdir -p data/fail2ban-data
mkdir -p data/fail2ban-config
mkdir -p data/crowdsec-data
mkdir -p data/crowdsec-config
mkdir -p data/vaultwarden-data
mkdir -p data/pgadmin-data
mkdir -p data/code-server-data
mkdir -p data/gitea-data
mkdir -p data/drone-data
mkdir -p data/borg-backup
mkdir -p data/borg-config
mkdir -p data/backup-source
mkdir -p data/wireguard-data
mkdir -p data/traefik
mkdir -p logs
mkdir -p letsencrypt
mkdir -p letsencrypt-traefik
mkdir -p workspace

# Set proper permissions
chmod -R 755 data letsencrypt logs workspace
chown -R 1000:1000 data/filebrowser-data 2>/dev/null || true
chown -R 472:472 data/grafana-data 2>/dev/null || true

# Check Docker installation
echo -e "${GREEN}[2/6] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}Docker is already installed: $(docker --version)${NC}"
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose plugin not found, trying docker-compose...${NC}"
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}Docker Compose is not installed. Please install it first.${NC}"
        exit 1
    fi
else
    COMPOSE_CMD="docker compose"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[3/6] .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env with secure passwords before production use!${NC}"
else
    echo -e "${GREEN}[3/6] .env file found${NC}"
fi

# Pull latest images
echo -e "${GREEN}[4/6] Pulling latest Docker images...${NC}"
$COMPOSE_CMD pull

# Start the stack (default profile only)
echo -e "${GREEN}[5/6] Starting core services...${NC}"
echo -e "${YELLOW}Note: To start additional profiles, use:${NC}"
echo -e "  - Monitoring: $COMPOSE_CMD --profile monitoring up -d"
echo -e "  - Security: $COMPOSE_CMD --profile security up -d"
echo -e "  - Databases: $COMPOSE_CMD --profile databases up -d"
echo -e "  - DevOps: $COMPOSE_CMD --profile devops up -d"
echo -e "  - All services: $COMPOSE_CMD --profile monitoring --profile security --profile databases --profile devops up -d"
$COMPOSE_CMD up -d

# Wait for services to be ready
echo -e "${GREEN}[6/6] Waiting for services to initialize...${NC}"
sleep 15

# Display status
echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}============================================${NC}"

echo -e "\n${YELLOW}📊 Active Services:${NC}"
$COMPOSE_CMD ps

echo -e "\n${YELLOW}🌐 Core Access URLs:${NC}"
echo -e "  • Nginx Proxy Manager: http://2.28.6.68:81"
echo -e "  • Portainer:           http://2.28.6.68:9000"
echo -e "  • Uptime Kuma:         http://2.28.6.68:3001"
echo -e "  • File Browser:        http://2.28.6.68:8080"
echo -e "  • Dozzle Logs:         http://2.28.6.68:8082"

echo -e "\n${YELLOW}🔐 Default Credentials (CHANGE IMMEDIATELY):${NC}"
echo -e "  • Nginx Proxy Manager:"
echo -e "      Email: admin@example.com"
echo -e "      Password: changeme"
echo -e "  • Portainer: (Set on first login)"
echo -e "  • File Browser:"
echo -e "      Username: admin"
echo -e "      Password: admin"
echo -e "  • PostgreSQL (from .env):"
echo -e "      User: admin (or your custom user)"
echo -e "      Database: dalizebo"
echo -e "  • MariaDB (from .env):"
echo -e "      Root User: root"
echo -e "      User: dalizebo_user"
echo -e "      Database: dalizebo"
echo -e "  • Redis (from .env):"
echo -e "      Password: Set in .env"
echo -e "  • MongoDB (from .env):"
echo -e "      User: admin"
echo -e "      Database: admin"

echo -e "\n${YELLOW}📦 Optional Profiles Available:${NC}"
echo -e "  • Monitoring (Grafana, Prometheus, Loki):"
echo -e "      $COMPOSE_CMD --profile monitoring up -d"
echo -e "  • Security (Fail2Ban, CrowdSec, Vaultwarden):"
echo -e "      $COMPOSE_CMD --profile security up -d"
echo -e "  • Advanced Databases (PgAdmin, Mongo Express, Redis Commander):"
echo -e "      $COMPOSE_CMD --profile databases up -d"
echo -e "  • DevOps (VS Code Server, Gitea, Drone CI):"
echo -e "      $COMPOSE_CMD --profile devops up -d"
echo -e "  • Networking (WireGuard VPN, Cloudflare Tunnel):"
echo -e "      $COMPOSE_CMD --profile networking up -d"
echo -e "  • Backup (BorgBackup):"
echo -e "      $COMPOSE_CMD --profile backup up -d"

echo -e "\n${YELLOW}⚠️  CRITICAL SECURITY STEPS:${NC}"
echo -e "  1. ✏️  Edit .env file with strong, unique passwords"
echo -e "  2. 🔒 Change all default service passwords immediately"
echo -e "  3. 🔥 Configure firewall (UFW/firewalld):"
echo -e "      Required ports: 80, 81, 443"
echo -e "      Optional ports: 3001, 8080, 9000, 8082"
echo -e "  4. 🌐 Set up DNS records for dalizebo.co.za"
echo -e "  5. 🔐 Enable HTTPS/SSL certificates via Nginx Proxy Manager"
echo -e "  6. 🔄 Enable automatic updates (Watchtower is included)"
echo -e "  7. 🛡️ Consider enabling Fail2Ban or CrowdSec"

echo -e "\n${YELLOW}📝 Quick Commands:${NC}"
echo -e "  • View logs: $COMPOSE_CMD logs -f [service-name]"
echo -e "  • Restart all: $COMPOSE_CMD restart"
echo -e "  • Stop all: $COMPOSE_CMD down"
echo -e "  • Update all: $COMPOSE_CMD pull && $COMPOSE_CMD up -d"
echo -e "  • Check health: $COMPOSE_CMD ps"

echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}Happy Hosting! 🚀${NC}"
echo -e "${BLUE}dalizebo.co.za on 2.28.6.68${NC}"
echo -e "${BLUE}============================================${NC}\n"
