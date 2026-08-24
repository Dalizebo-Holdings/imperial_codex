#!/bin/bash
# Dual-model launch & verification script

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

echo "╔════════════════════════════════════════════════════╗"
echo "║     OpenHands Dual-Model Setup (Qwen + Phi)       ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Create model directories
echo "📁 Creating model directories..."
mkdir -p "$PROJECT_DIR/models/qwen36"
mkdir -p "$PROJECT_DIR/models/phi4mini"
echo "✓ Directories ready"
echo ""

# Check for .env file
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing .env file"
  exit 1
fi

# Start services
echo "🚀 Starting dual-model services..."
docker compose --file "$PROJECT_DIR/docker-compose.yml" --env-file "$ENV_FILE" up -d
echo "✓ Services started"
echo ""

# Wait for services
echo "⏳ Waiting for services to be healthy (90s)..."
sleep 90
echo ""

# Check services
echo "📊 Service Status:"
docker compose --file "$PROJECT_DIR/docker-compose.yml" ps
echo ""

# Health checks
echo "🧪 Running health checks..."
echo ""

# Check Qwen
echo "Qwen 3.6 (Port 8001):"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
  echo "  ✓ Service responding"
  echo "  📝 Endpoints:"
  echo "     - API: http://localhost:8001"
  echo "     - Router: http://localhost:8000/api/qwen"
else
  echo "  ⏳ Still initializing..."
  echo "  📋 Check logs: docker logs qwen36"
fi
echo ""

# Check Phi
echo "Phi-4 mini (Port 8002):"
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
  echo "  ✓ Service responding"
  echo "  📝 Endpoints:"
  echo "     - API: http://localhost:8002"
  echo "     - Router: http://localhost:8000/api/phi"
else
  echo "  ⏳ Still initializing..."
  echo "  📋 Check logs: docker logs phi4mini"
fi
echo ""

# Check Router
echo "Nginx Router (Port 8000):"
if curl -s http://localhost:8000/status > /dev/null 2>&1; then
  echo "  ✓ Router operational"
  ROUTER_STATUS=$(curl -s http://localhost:8000/status)
  echo "  📊 Status: $ROUTER_STATUS"
else
  echo "  ⏳ Still starting..."
fi
echo ""

# Resource usage
echo "📈 Memory & CPU Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"
echo ""

echo "✅ Dual-model setup complete!"
echo ""
echo "🎯 Access Points:"
echo "   Primary (Qwen 3.6):     http://localhost:8001"
echo "   Fallback (Phi-4 mini):  http://localhost:8002"
echo "   API Router:             http://localhost:8000"
echo "     ├─ /api/qwen          → Route to Qwen"
echo "     ├─ /api/phi           → Route to Phi"
echo "     ├─ /status            → Check router"
echo "     └─ /health            → Health check"
echo ""
echo "📝 Quick Commands:"
echo "   docker compose logs qwen36      # Qwen logs"
echo "   docker compose logs phi4mini    # Phi logs"
echo "   docker compose down             # Stop all"
echo "   docker compose restart          # Restart all"
echo ""
