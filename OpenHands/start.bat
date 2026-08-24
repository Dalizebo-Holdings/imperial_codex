@echo off
:: Imperial Codex — Start dual-model stack (Windows CMD)
:: Run from the OpenHands/ directory

cd /d "%~dp0"

echo ================================================
echo  Imperial Codex — Dual-Model Agent Stack
echo  Qwen 2.5 7B (port 8001) + Phi-4 mini (port 8002)
echo  Router (port 8000) + OpenHands (port 3000)
echo ================================================

:: Check .env exists
if not exist ".env" (
  echo ERROR: .env not found. Edit .env and set HF_TOKEN first.
  pause
  exit /b 1
)

:: Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Desktop is not running. Start Docker Desktop first.
  pause
  exit /b 1
)

echo.
echo ^>^>^> Pulling images...
docker compose pull qwen36 phi4mini

echo.
echo ^>^>^> Starting Ollama model servers...
docker compose up -d qwen36 phi4mini

echo.
echo ^>^>^> Waiting 30s for Ollama to initialize...
timeout /t 30 /nobreak >nul

echo.
echo ^>^>^> Pulling models into volumes (first run takes 5-10 min)...
docker compose run --rm model-init

echo.
echo ^>^>^> Starting router and OpenHands UI...
docker compose up -d router openhands

echo.
echo ================================================
echo  Stack is up!
echo.
echo   Qwen 3.6   -^> http://localhost:8001/api/tags
echo   Phi-4 mini -^> http://localhost:8002/api/tags
echo   Router     -^> http://localhost:8000/models
echo   OpenHands  -^> http://localhost:3000
echo.
echo  Continue.dev already configured -^> http://localhost:8000/v1
echo ================================================
echo.
echo Logs:  docker compose logs -f
echo Stop:  docker compose down
echo.
pause
