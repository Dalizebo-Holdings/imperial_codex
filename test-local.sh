#!/bin/bash
set -e

# Local deployment test - verify everything works before pushing to VPS

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     LOCAL DEPLOYMENT TEST                                  ║${NC}"
echo -e "${BLUE}║     Verify everything works before VPS deployment         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Configuration
ENVIRONMENT="${1:-coolify}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}▶ Step 1: Checking prerequisites...${NC}"

for cmd in docker docker-compose curl; do
    if command -v $cmd &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $cmd installed"
    else
        echo -e "  ${RED}✗${NC} $cmd not found"
        exit 1
    fi
done

# Step 2: Check environment file
echo -e "\n${YELLOW}▶ Step 2: Checking environment file...${NC}"

if [ -f ".env.production.local" ]; then
    echo -e "  ${GREEN}✓${NC} .env.production.local exists"
    
    # Check for placeholder values
    if grep -q "REPLACE_WITH" ".env.production.local"; then
        echo -e "  ${YELLOW}⚠${NC} Warning: Contains REPLACE_WITH placeholders"
        echo -e "  ${YELLOW}→ Update with real values before production deployment${NC}"
    fi
else
    echo -e "  ${RED}✗${NC} .env.production.local not found"
    exit 1
fi

# Step 3: Check Docker files
echo -e "\n${YELLOW}▶ Step 3: Checking Docker files...${NC}"

FILES=("Dockerfile" "$COMPOSE_FILE" ".dockerignore")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file not found"
        exit 1
    fi
done

# Step 4: Build Docker image
echo -e "\n${YELLOW}▶ Step 4: Building Docker image...${NC}"
echo -e "  ${YELLOW}→ This may take 2-5 minutes...${NC}"

if ./build.sh; then
    echo -e "  ${GREEN}✓${NC} Build successful"
else
    echo -e "  ${RED}✗${NC} Build failed"
    exit 1
fi

# Step 5: Check image
echo -e "\n${YELLOW}▶ Step 5: Verifying image...${NC}"

SIZE=$(docker images --format "{{.Size}}" imperial-codex:latest)
LAYERS=$(docker inspect imperial-codex:latest --format='{{len .RootFS.Layers}}')

echo -e "  ${GREEN}✓${NC} Image size: ${SIZE}"
echo -e "  ${GREEN}✓${NC} Layers: ${LAYERS}"

# Step 6: Stop any existing containers
echo -e "\n${YELLOW}▶ Step 6: Cleaning up existing containers...${NC}"

docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Ready to start fresh"

# Step 7: Start containers
echo -e "\n${YELLOW}▶ Step 7: Starting containers...${NC}"

if docker compose -f "$COMPOSE_FILE" up -d; then
    echo -e "  ${GREEN}✓${NC} Containers started"
else
    echo -e "  ${RED}✗${NC} Failed to start containers"
    docker compose -f "$COMPOSE_FILE" logs
    exit 1
fi

# Step 8: Wait for health
echo -e "\n${YELLOW}▶ Step 8: Waiting for application to be healthy...${NC}"

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Application is healthy"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -ne "  ${YELLOW}...${NC} Waiting ($ATTEMPT/$MAX_ATTEMPTS)\r"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "  ${YELLOW}⚠${NC} Application didn't respond to health check"
    echo -e "  ${YELLOW}→ Containers may still be starting${NC}"
    echo -e "  ${YELLOW}→ Check logs: docker compose -f $COMPOSE_FILE logs -f${NC}"
fi

# Step 9: Show status
echo -e "\n${YELLOW}▶ Step 9: Container Status${NC}"

docker compose -f "$COMPOSE_FILE" ps

# Step 10: Test endpoints
echo -e "\n${YELLOW}▶ Step 10: Testing endpoints...${NC}"

TESTS=(
    "http://localhost:3000/health" "Health"
    "http://localhost:3000/" "Home"
)

for ((i=0; i<${#TESTS[@]}; i+=2)); do
    URL="${TESTS[$i]}"
    NAME="${TESTS[$((i+1))]}"
    
    if curl -sf "$URL" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $NAME ($URL)"
    else
        echo -e "  ${YELLOW}⚠${NC} $NAME ($URL) - not responding"
    fi
done

# Step 11: Show logs
echo -e "\n${YELLOW}▶ Step 11: Recent Logs${NC}"

docker compose -f "$COMPOSE_FILE" logs --tail=10

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ ✓ LOCAL TEST COMPLETE                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Ready for VPS deployment!${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Verify application works locally: http://localhost:3000"
echo -e "  2. Check logs for any errors: docker compose -f $COMPOSE_FILE logs -f"
echo -e "  3. When ready, deploy to VPS:"
echo -e "     ./ssh-deploy.sh root@your-vps-ip $ENVIRONMENT"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo -e "  • View logs:   docker compose -f $COMPOSE_FILE logs -f"
echo -e "  • Stop:        docker compose -f $COMPOSE_FILE down"
echo -e "  • Restart:     docker compose -f $COMPOSE_FILE restart"
echo -e "  • Shell:       docker exec -it imperial-codex sh"

echo -e "\n"
