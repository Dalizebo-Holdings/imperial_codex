#!/bin/bash

# Imperial Codex Docker Registry Push Script
# Pushes the built Docker image to Docker Hub or custom registry
# Usage: ./docker-push.sh [registry] [tag]
# Example: ./docker-push.sh myusername/imperial-codex v1.0.0

set -e

REGISTRY="${1:-docker.io}"
IMAGE_NAME="${2:-imperial-codex}"
TAG="${3:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Docker image push...${NC}"
echo "Registry: $REGISTRY"
echo "Image: $IMAGE_NAME"
echo "Tag: $TAG"
echo "Full image URI: $FULL_IMAGE"
echo ""

# Check if image exists locally
if ! docker image inspect "$IMAGE_NAME:$TAG" > /dev/null 2>&1; then
  echo -e "${RED}Error: Image $IMAGE_NAME:$TAG not found locally${NC}"
  echo "Build the image first with: docker build --target runner -t $IMAGE_NAME:$TAG ."
  exit 1
fi

# Tag image for registry
echo -e "${YELLOW}Tagging image...${NC}"
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE"

# Log in to Docker Hub (if using docker.io)
if [[ "$REGISTRY" == "docker.io" ]] || [[ "$REGISTRY" == "" ]]; then
  echo -e "${YELLOW}Logging in to Docker Hub...${NC}"
  docker login
fi

# Push image
echo -e "${YELLOW}Pushing image to $REGISTRY...${NC}"
docker push "$FULL_IMAGE"

# Push latest tag if not already the latest
if [[ "$TAG" != "latest" ]]; then
  docker tag "$FULL_IMAGE" "$REGISTRY/$IMAGE_NAME:latest"
  docker push "$REGISTRY/$IMAGE_NAME:latest"
fi

echo -e "${GREEN}Push complete!${NC}"
echo -e "${GREEN}Image available at: $FULL_IMAGE${NC}"
echo ""
echo "To pull this image:"
echo "  docker pull $FULL_IMAGE"
echo ""
echo "To run this image:"
echo "  docker run -p 3000:3000 --env-file .env.local $FULL_IMAGE"
