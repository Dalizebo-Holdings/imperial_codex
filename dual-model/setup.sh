#!/bin/bash
# Dual-Model OpenHands Setup Script

echo "════════════════════════════════════════════════════"
echo "  OpenHands Dual-Model Setup"
echo "════════════════════════════════════════════════════"
echo ""

echo "Step 1: Stopping any existing containers..."
docker stop qwen36 phi4mini 2>/dev/null || true
docker rm qwen36 phi4mini 2>/dev/null || true
echo ""

echo "Step 2: Starting Qwen container..."
docker run -d --name qwen36 -p 8001:11434 ollama/ollama:latest
echo "✓ Qwen started on port 8001"
echo ""

echo "Step 3: Starting Phi container..."
docker run -d --name phi4mini -p 8002:11434 ollama/ollama:latest
echo "✓ Phi started on port 8002"
echo ""

echo "Step 4: Waiting for containers to be ready (30s)..."
sleep 30
echo ""

echo "Step 5: Pulling Qwen model..."
docker exec qwen36 ollama pull qwen:7b-instruct
echo ""

echo "Step 6: Pulling Phi model..."
docker exec phi4mini ollama pull phi:latest
echo ""

echo "════════════════════════════════════════════════════"
echo "✅ Setup complete!"
echo ""
echo "Models ready at:"
echo "  Qwen:  http://localhost:8001"
echo "  Phi:   http://localhost:8002"
echo ""
echo "Test with:"
echo "  curl -X POST http://localhost:8001/api/generate \\"
echo "    -d '{\"model\":\"qwen:7b-instruct\",\"prompt\":\"Hello\"}'"
echo ""
