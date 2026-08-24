#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Building Imperial Codex Docker Image...${NC}"

# Build the image
docker build \
  --target runner \
  --tag imperial-codex:latest \
  --tag imperial-codex:$(date +%Y%m%d-%H%M%S) \
  --cache-from imperial-codex:latest \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image built successfully${NC}"
    
    # Get image size
    SIZE=$(docker images --format "{{.Size}}" imperial-codex:latest)
    echo -e "${GREEN}✓ Image size: ${SIZE}${NC}"
    
    # Show image info
    echo -e "\n${YELLOW}📦 Image Details:${NC}"
    docker images imperial-codex:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
