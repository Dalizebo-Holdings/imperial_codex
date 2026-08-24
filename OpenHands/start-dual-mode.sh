#!/bin/sh
# Imperial Codex — Start full dual-model + OpenHands stack
# Run from: OpenHands/ directory

set -e

COMPOSE_DIR="$(dirname "$0")"
cd "$COMPOSE_DIR"

echo "================================================"
echo " Imperial Codex — Dual-Model Agent Stack"
echo " Qwen 3.6 (port 8001) + Phi-4 mini (port 8002)"
echo " Router (port 8000) + OpenHands (port 3000)"
echo "================================================"

# Validate .env exists
if [ ! -f ".env" ]; then
  echo "ERROR: .env not found. Copy .env.example and set HF_TOKEN."
  exit 1
fi

# Pull images
echo ""
echo ">>> Pulling images..."
docker compose pull qwen36 phi4mini

# Start Ollama services first
echo ""
echo ">>> Starting Ollama model servers..."
docker compose up -d qwen36 phi4mini

# Wait for healthchecks
echo ">>> Waiting for Ollama healthchecks (up to 90s)..."
sleep 15

# Pull models into volumes
echo ""
echo ">>> Initializing models (this may take several minutes on first run)..."
docker compose run --rm model-init

# Start router and OpenHands
echo ""
echo ">>> Starting router and OpenHands..."
docker compose up -d router openhands

echo ""
echo "================================================"
echo " Stack is up!"
echo ""
echo "  Qwen 3.6   → http://localhost:8001/api/tags"
echo "  Phi-4 mini → http://localhost:8002/api/tags"
echo "  Router     → http://localhost:8000/models"
echo "  OpenHands  → http://localhost:3000"
echo "================================================"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"
