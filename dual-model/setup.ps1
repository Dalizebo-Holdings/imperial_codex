# Dual-Model OpenHands Setup Script (PowerShell)

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  OpenHands Dual-Model Setup" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up existing containers
Write-Host "Step 1: Cleaning up existing containers..." -ForegroundColor Yellow
docker stop qwen36 phi4mini -ErrorAction SilentlyContinue | Out-Null
docker rm qwen36 phi4mini -ErrorAction SilentlyContinue | Out-Null
Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Start Qwen
Write-Host "Step 2: Starting Qwen container..." -ForegroundColor Yellow
$qwenId = docker run -d --name qwen36 -p 8001:11434 ollama/ollama:latest
Write-Host "✓ Qwen started: $qwenId" -ForegroundColor Green
Write-Host ""

# Step 3: Start Phi
Write-Host "Step 3: Starting Phi container..." -ForegroundColor Yellow
$phiId = docker run -d --name phi4mini -p 8002:11434 ollama/ollama:latest
Write-Host "✓ Phi started: $phiId" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for containers
Write-Host "Step 4: Waiting for containers (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "✓ Ready" -ForegroundColor Green
Write-Host ""

# Step 5: Pull models
Write-Host "Step 5: Pulling Qwen model..." -ForegroundColor Yellow
docker exec qwen36 ollama pull qwen:7b-instruct
Write-Host ""

Write-Host "Step 6: Pulling Phi model..." -ForegroundColor Yellow
docker exec phi4mini ollama pull phi:latest
Write-Host ""

# Summary
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Models ready at:" -ForegroundColor Cyan
Write-Host "  Qwen:  http://localhost:8001" -ForegroundColor White
Write-Host "  Phi:   http://localhost:8002" -ForegroundColor White
Write-Host ""
Write-Host "Test with:" -ForegroundColor Cyan
Write-Host '  curl -X POST http://localhost:8001/api/generate `' -ForegroundColor White
Write-Host '    -d ''{"model":"qwen:7b-instruct","prompt":"Hello"}''' -ForegroundColor White
Write-Host ""
