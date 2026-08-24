#!/bin/bash
# Imperial Codex Dual-Model Stack - Status & Next Steps

echo "════════════════════════════════════════════════════════════════"
echo "  DUAL-MODEL STACK STATUS - OpenHands Fixed"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "✅ FIXED:"
echo "   - Updated OpenHands image (was ghcr.io/all-hands-ai/openhands:0.40)"
echo "   - Now using: ghcr.io/openhands/agent-canvas:1"
echo "   - Port mapping corrected: 3000:8000 (Agent Canvas internal port)"
echo "   - Volume paths updated for new image structure"
echo ""

echo "📦 PULLING IMAGES (in progress):"
echo "   - ollama/ollama:0.9.2 (Qwen + Phi runtime)"
echo "   - ghcr.io/openhands/agent-canvas:1"
echo ""

echo "⏳ WAITING FOR:"
echo "   1. Images to finish downloading (~5-10 minutes)"
echo "   2. Containers to start and health-check pass (qwen36, phi4mini, router)"
echo "   3. Model initialization (pulling qwen2.5:7b-instruct + phi4-mini)"
echo "   4. Agent Canvas UI to come online"
echo ""

echo "📋 MONITOR PROGRESS:"
echo "   docker compose -f OpenHands/docker-compose.yml ps"
echo "   docker compose -f OpenHands/docker-compose.yml logs -f"
echo ""

echo "🎯 ENDPOINTS (when ready):"
echo "   Agent Canvas UI:       http://localhost:3000"
echo "   FastAPI Router:        http://localhost:8000"
echo "   Qwen (8001):           http://localhost:8001"
echo "   Phi (8002):            http://localhost:8002"
echo ""

echo "✅ VERIFICATION COMMANDS:"
echo "   curl http://localhost:3000          # Agent Canvas"
echo "   curl http://localhost:8000/health   # Router health"
echo "   curl -X POST http://localhost:8001/api/generate \\"
echo "     -d '{\"model\":\"qwen2.5:7b-instruct\",\"prompt\":\"Hello\"}'"
echo ""

echo "📝 CONFIGURATION:"
echo "   - Qwen 2.5 (7B): 6GB RAM, 4 CPU cores (primary)"
echo "   - Phi-4 mini:    4GB RAM, 2 CPU cores (fallback)"
echo "   - Total:         10GB RAM (2GB headroom on 12GB system)"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "ETA for full startup: 15-20 minutes from now"
echo "════════════════════════════════════════════════════════════════"
