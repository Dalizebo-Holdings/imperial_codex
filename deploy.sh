#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_HUB_USER=${DOCKER_HUB_USER:-}
REGISTRY=${DOCKER_HUB_USER:+docker.io/$DOCKER_HUB_USER}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  IMPERIAL CODEX - DEPLOYMENT SCRIPT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Environment: ${ENVIRONMENT}${NC}"

# Verify environment file exists
if [ ! -f ".env.${ENVIRONMENT}.local" ]; then
    echo -e "${RED}✗ .env.${ENVIRONMENT}.local not found${NC}"
    echo -e "${YELLOW}Create this file with your environment variables${NC}"
    exit 1
fi

# Select compose file based on environment
if [ "$ENVIRONMENT" = "coolify" ]; then
    COMPOSE_FILE="docker-compose.coolify.yml"
    CONTAINER_NAME="imperial-codex-app"
elif [ "$ENVIRONMENT" = "server" ]; then
    COMPOSE_FILE="docker-compose.server.yml"
    CONTAINER_NAME="imperial-codex-app"
else
    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    CONTAINER_NAME="imperial-codex-app"
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}✗ ${COMPOSE_FILE} not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using compose file: ${COMPOSE_FILE}${NC}"

# Build image
echo -e "\n${YELLOW}Step 1: Building Docker image...${NC}"
bash build.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Stop existing containers
echo -e "\n${YELLOW}Step 2: Stopping existing containers...${NC}"
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}"

# Start new containers
echo -e "\n${YELLOW}Step 3: Starting containers with ${COMPOSE_FILE}...${NC}"
docker compose -f "$COMPOSE_FILE" up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Container startup failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Containers started${NC}"

# Wait for container to be ready
echo -e "\n${YELLOW}Step 4: Waiting for app to be ready...${NC}"
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Application failed to start${NC}"
        docker compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Show container status
echo -e "\n${YELLOW}Step 5: Container Status${NC}"
docker compose -f "$COMPOSE_FILE" ps

# Show logs
echo -e "\n${YELLOW}Step 6: Recent Logs${NC}"
docker compose -f "$COMPOSE_FILE" logs --tail=20

# Push to registry if specified
if [ -n "$DOCKER_HUB_USER" ]; then
    echo -e "\n${YELLOW}Step 7: Pushing to Docker Hub...${NC}"
    docker login
    docker tag imperial-codex:latest $REGISTRY/imperial-codex:latest
    docker push $REGISTRY/imperial-codex:latest
    echo -e "${GREEN}✓ Pushed to ${REGISTRY}${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Access your app:${NC}"
echo -e "  HTTP:  http://localhost:3000"
echo -e "  Logs:  docker compose -f ${COMPOSE_FILE} logs -f"
echo -e "  Stop:  docker compose -f ${COMPOSE_FILE} down"
echo -e "\n"
