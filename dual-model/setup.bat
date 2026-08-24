@echo off
REM Dual-Model OpenHands Setup Script
echo ════════════════════════════════════════════════════
echo   OpenHands Dual-Model Setup
echo ════════════════════════════════════════════════════
echo.

echo Step 1: Starting Qwen container...
docker run -d --name qwen36 -p 8001:11434 ollama/ollama:latest

echo Step 2: Starting Phi container...
docker run -d --name phi4mini -p 8002:11434 ollama/ollama:latest

echo Step 3: Waiting for containers to be ready...
timeout /t 30 /nobreak

echo Step 4: Pulling Qwen model...
docker exec qwen36 ollama pull qwen:7b-instruct

echo Step 5: Pulling Phi model...
docker exec phi4mini ollama pull phi:latest

echo.
echo ✅ Setup complete!
echo.
echo Models ready at:
echo   Qwen:  http://localhost:8001
echo   Phi:   http://localhost:8002
echo.
