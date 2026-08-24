#!/bin/sh
# Imperial Codex — Verify dual-model stack health

echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Qwen 3.6 (port 8001) — loaded models ==="
curl -sf http://localhost:8001/api/tags | python3 -m json.tool 2>/dev/null || echo "  Not responding"

echo ""
echo "=== Phi-4 mini (port 8002) — loaded models ==="
curl -sf http://localhost:8002/api/tags | python3 -m json.tool 2>/dev/null || echo "  Not responding"

echo ""
echo "=== Router (port 8000) — routing table ==="
curl -sf http://localhost:8000/models | python3 -m json.tool 2>/dev/null || echo "  Not responding"

echo ""
echo "=== Quick Qwen inference test ==="
curl -sf http://localhost:8001/api/generate \
  -d '{"model":"qwen2.5:7b-instruct","prompt":"say ok","stream":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Response:', d.get('response','')[:80])" \
  2>/dev/null || echo "  Inference not ready yet"

echo ""
echo "=== Quick Phi inference test ==="
curl -sf http://localhost:8002/api/generate \
  -d '{"model":"phi4-mini","prompt":"say ok","stream":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Response:', d.get('response','')[:80])" \
  2>/dev/null || echo "  Inference not ready yet"

echo ""
echo "=== OpenHands (port 3000) ==="
curl -sf -o /dev/null -w "  HTTP status: %{http_code}\n" http://localhost:3000 || echo "  Not responding"

echo ""
echo "=== Done ==="
