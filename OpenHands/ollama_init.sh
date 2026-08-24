#!/bin/sh
# Imperial Codex — Ollama model initializer
# Usage: ./ollama_init.sh [qwen|phi|all]
# Called automatically by model-init container on first run

set -e

MODEL=${1:-all}
QWEN_HOST="http://localhost:8001"
PHI_HOST="http://localhost:8002"

pull_qwen() {
  echo "=== Pulling Qwen 3.6: qwen2.5:7b-instruct ==="
  OLLAMA_HOST="$QWEN_HOST" ollama pull qwen2.5:7b-instruct
  echo "✓ Qwen 3.6 ready at $QWEN_HOST"
}

pull_phi() {
  echo "=== Pulling Phi-4 mini: phi4-mini ==="
  OLLAMA_HOST="$PHI_HOST" ollama pull phi4-mini
  echo "✓ Phi-4 mini ready at $PHI_HOST"
}

case "$MODEL" in
  qwen) pull_qwen ;;
  phi)  pull_phi  ;;
  all)
    pull_qwen
    pull_phi
    echo ""
    echo "=== Both models initialized ==="
    echo "  Qwen 3.6  → http://localhost:8001/api/generate"
    echo "  Phi-4 mini→ http://localhost:8002/api/generate"
    echo "  Router    → http://localhost:8000/v1/chat/completions"
    echo "  OpenHands → http://localhost:3000"
    ;;
  *)
    echo "Usage: $0 [qwen|phi|all]"
    exit 1
    ;;
esac
