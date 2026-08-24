#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_URL="${1:-.}"
DEPLOY_DIR="/opt/imperial-codex"
ENVIRONMENT="${2:-production}"
COMPOSE_FILE="docker-compose.coolify.yml"

if [ "$ENVIRONMENT" = "server" ]; then
    COMPOSE_FILE="docker-compose.server.yml"
fi

print_banner() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     IMPERIAL CODEX - VPS DEPLOYMENT SCRIPT                 ║${NC}"
    echo -e "${BLUE}║     Environment: ${ENVIRONMENT}                                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

check_dependencies() {
    echo -e "\n${YELLOW}▶ Checking dependencies...${NC}"
    
    local missing=0
    
    for cmd in docker docker-compose git curl; do
        if command -v $cmd &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} $cmd"
        else
            echo -e "  ${RED}✗${NC} $cmd (missing)"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -gt 0 ]; then
        echo -e "\n${RED}Error: Missing $missing dependency(ies)${NC}"
        echo -e "${YELLOW}Install Docker: https://docs.docker.com/engine/install/${NC}"
        exit 1
    fi
}

create_directory_structure() {
    echo -e "\n${YELLOW}▶ Creating directory structure...${NC}"
    
    if [ ! -d "$DEPLOY_DIR" ]; then
        sudo mkdir -p "$DEPLOY_DIR"
        sudo chown $USER:$USER "$DEPLOY_DIR"
        echo -e "  ${GREEN}✓${NC} Created $DEPLOY_DIR"
    else
        echo -e "  ${GREEN}✓${NC} Directory exists: $DEPLOY_DIR"
    fi
    
    # Create subdirectories
    mkdir -p "$DEPLOY_DIR"/{certs,logs,data}
    chmod 700 "$DEPLOY_DIR/certs"
    echo -e "  ${GREEN}✓${NC} Created subdirectories"
}

clone_or_update_repo() {
    echo -e "\n${YELLOW}▶ Setting up application files...${NC}"
    
    if [ "$REPO_URL" = "." ]; then
        echo -e "  ${YELLOW}→ Using local files (not cloning)${NC}"
        echo -e "  ${YELLOW}→ Copy your files to $DEPLOY_DIR manually${NC}"
        return 0
    fi
    
    if [ -d "$DEPLOY_DIR/.git" ]; then
        echo -e "  ${YELLOW}→ Updating existing repository${NC}"
        cd "$DEPLOY_DIR"
        git pull origin main
    else
        echo -e "  ${YELLOW}→ Cloning repository${NC}"
        git clone "$REPO_URL" "$DEPLOY_DIR" || {
            echo -e "  ${RED}✗ Failed to clone repository${NC}"
            echo -e "  ${YELLOW}→ You can manually copy files to $DEPLOY_DIR${NC}"
        }
    fi
    
    echo -e "  ${GREEN}✓${NC} Application files ready"
}

setup_environment() {
    echo -e "\n${YELLOW}▶ Setting up environment variables...${NC}"
    
    cd "$DEPLOY_DIR"
    
    if [ ! -f ".env.production.local" ]; then
        echo -e "  ${YELLOW}→ Creating .env.production.local${NC}"
        
        # Check if template exists
        if [ -f ".env.production.local.template" ]; then
            cp ".env.production.local.template" ".env.production.local"
        elif [ -f ".env.example" ]; then
            cp ".env.example" ".env.production.local"
            sed -i 's/NODE_ENV=development/NODE_ENV=production/g' ".env.production.local"
        else
            cat > ".env.production.local" << 'EOF'
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
OPENAI_API_KEY=REPLACE_WITH_YOUR_KEY
ANTHROPIC_API_KEY=REPLACE_WITH_YOUR_KEY
SESSION_SECRET=REPLACE_WITH_GENERATED_VALUE
VAULT_ENCRYPTION_KEY=REPLACE_WITH_GENERATED_VALUE
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF
        fi
        
        chmod 600 ".env.production.local"
        echo -e "  ${GREEN}✓${NC} Created .env.production.local (chmod 600)"
    else
        echo -e "  ${GREEN}✓${NC} .env.production.local exists"
    fi
    
    echo -e "  ${YELLOW}→ ⚠️  IMPORTANT: Edit .env.production.local with your actual secrets${NC}"
    echo -e "     nano .env.production.local"
}

setup_ssl_certificates() {
    if [ "$ENVIRONMENT" != "server" ]; then
        return 0
    fi
    
    echo -e "\n${YELLOW}▶ Setting up SSL certificates...${NC}"
    
    if [ ! -f "$DEPLOY_DIR/certs/cert.pem" ] || [ ! -f "$DEPLOY_DIR/certs/key.pem" ]; then
        echo -e "  ${YELLOW}→ Generating self-signed certificate (for testing)${NC}"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$DEPLOY_DIR/certs/key.pem" \
            -out "$DEPLOY_DIR/certs/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        echo -e "  ${GREEN}✓${NC} Self-signed certificate created"
        echo -e "  ${YELLOW}→ For production, use Let's Encrypt:${NC}"
        echo -e "     sudo certbot certonly --standalone -d your-domain.com"
    else
        echo -e "  ${GREEN}✓${NC} SSL certificates exist"
    fi
}

build_docker_image() {
    echo -e "\n${YELLOW}▶ Building Docker image (this may take 2-5 minutes)...${NC}"
    
    cd "$DEPLOY_DIR"
    
    if [ ! -f "Dockerfile" ]; then
        echo -e "  ${RED}✗ Dockerfile not found in $DEPLOY_DIR${NC}"
        echo -e "  ${YELLOW}→ Please ensure Dockerfile is present${NC}"
        return 1
    fi
    
    docker build \
        --target runner \
        --tag imperial-codex:latest \
        --tag "imperial-codex:$(date +%Y%m%d-%H%M%S)" \
        --cache-from imperial-codex:latest \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Docker image built successfully"
        
        SIZE=$(docker images --format "{{.Size}}" imperial-codex:latest)
        echo -e "  ${GREEN}✓${NC} Image size: ${SIZE}"
    else
        echo -e "  ${RED}✗ Docker build failed${NC}"
        return 1
    fi
}

start_containers() {
    echo -e "\n${YELLOW}▶ Starting containers with ${COMPOSE_FILE}...${NC}"
    
    cd "$DEPLOY_DIR"
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "  ${RED}✗ $COMPOSE_FILE not found${NC}"
        return 1
    fi
    
    # Stop existing containers
    echo -e "  ${YELLOW}→ Stopping existing containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    
    # Start new containers
    echo -e "  ${YELLOW}→ Starting new containers...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Containers started"
    else
        echo -e "  ${RED}✗ Failed to start containers${NC}"
        docker compose -f "$COMPOSE_FILE" logs
        return 1
    fi
}

wait_for_health() {
    echo -e "\n${YELLOW}▶ Waiting for application to be ready (up to 60 seconds)...${NC}"
    
    for i in {1..60}; do
        if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Application is healthy"
            return 0
        fi
        
        if [ $((i % 10)) -eq 0 ]; then
            echo -ne "  ${YELLOW}...${NC} Still waiting ($i/60s)\r"
        fi
        
        sleep 1
    done
    
    echo -e "  ${YELLOW}⚠${NC} Application didn't respond to health check"
    echo -e "  ${YELLOW}→ Containers may still be starting. Check logs:${NC}"
    echo -e "     docker compose -f $COMPOSE_FILE logs -f"
    return 1
}

show_status() {
    echo -e "\n${YELLOW}▶ Container Status${NC}"
    docker compose -f "$DEPLOY_DIR/$COMPOSE_FILE" ps
    
    echo -e "\n${YELLOW}▶ Recent Logs${NC}"
    docker compose -f "$DEPLOY_DIR/$COMPOSE_FILE" logs --tail=15
}

show_summary() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ ✓ DEPLOYMENT COMPLETE                                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${GREEN}📋 Next Steps:${NC}"
    echo -e "  1. ${YELLOW}Edit environment variables:${NC}"
    echo -e "     nano $DEPLOY_DIR/.env.production.local"
    
    echo -e "\n  2. ${YELLOW}Check application status:${NC}"
    echo -e "     docker compose -f $DEPLOY_DIR/$COMPOSE_FILE ps"
    
    echo -e "\n  3. ${YELLOW}View logs:${NC}"
    echo -e "     docker compose -f $DEPLOY_DIR/$COMPOSE_FILE logs -f"
    
    echo -e "\n${GREEN}📡 Access Points:${NC}"
    
    if [ "$ENVIRONMENT" = "server" ]; then
        echo -e "  • HTTPS (Nginx):  https://localhost (or your domain)"
        echo -e "  • HTTP redirect:  http://localhost → https"
        echo -e "  • Direct app:     http://localhost:3000"
    else
        echo -e "  • Application:    http://localhost:3000"
    fi
    
    echo -e "\n${GREEN}🔧 Useful Commands:${NC}"
    echo -e "  • Restart:   docker compose -f $DEPLOY_DIR/$COMPOSE_FILE restart"
    echo -e "  • Stop:      docker compose -f $DEPLOY_DIR/$COMPOSE_FILE down"
    echo -e "  • Update:    cd $DEPLOY_DIR && git pull && ./build.sh"
    
    echo -e "\n${GREEN}📚 Documentation:${NC}"
    echo -e "  • Deployment: $DEPLOY_DIR/DEPLOYMENT_GUIDE.md"
    echo -e "  • Quick Start: $DEPLOY_DIR/QUICKSTART.md"
    
    echo -e "\n${YELLOW}⚠️  Important Reminders:${NC}"
    echo -e "  • Update .env.production.local with real API keys"
    echo -e "  • Set proper file permissions: chmod 600 .env.production.local"
    echo -e "  • For production SSL, use Let's Encrypt"
    echo -e "  • Configure backups for data volumes"
    echo -e "  • Set up monitoring and alerting"
    
    echo -e "\n"
}

# Main execution
main() {
    print_banner
    
    check_dependencies
    create_directory_structure
    clone_or_update_repo
    setup_environment
    setup_ssl_certificates
    
    echo -e "\n${YELLOW}▶ Building application...${NC}"
    build_docker_image || exit 1
    
    start_containers || exit 1
    wait_for_health
    
    show_status
    show_summary
}

# Run main function
main "$@"
