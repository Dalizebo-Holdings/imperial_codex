#!/bin/bash
# Setup and start dual-model environment

echo "════════════════════════════════════════════════════"
echo "  OpenHands Dual-Model Setup (Qwen + Phi)"
echo "════════════════════════════════════════════════════"
echo ""

# Pull images
echo "📦 Pulling Ollama images..."
docker pull ollama/ollama:latest

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Starting containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services (30s)..."
sleep 30

echo ""
echo "📊 Status:"
docker compose ps

echo ""
echo "🚀 Quick Start - Pull Models:"
echo ""
echo "Qwen 3.6 (primary):"
echo "  docker exec qwen36 ollama pull qwen:7b-instruct"
echo ""
echo "Phi-4 mini (fallback):"
echo "  docker exec phi4mini ollama pull phi:latest"
echo ""
echo "📝 Test the models:"
echo ""
echo "Qwen:"
echo "  curl -X POST http://localhost:8001/api/generate -d '{\"model\":\"qwen:7b-instruct\",\"prompt\":\"Hello\"}'"
echo ""
echo "Phi:"
echo "  curl -X POST http://localhost:8002/api/generate -d '{\"model\":\"phi\",\"prompt\":\"Hello\"}'"
echo ""
