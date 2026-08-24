# Imperial Codex — Start dual-model stack (PowerShell)
# Run from the OpenHands/ directory or double-click

Set-Location $PSScriptRoot
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Imperial Codex — Dual-Model Agent Stack" -ForegroundColor Cyan
Write-Host "  Qwen 2.5 7B (port 8001) + Phi-4 mini (port 8002)" -ForegroundColor Cyan
Write-Host "  Router (port 8000)  |  OpenHands UI (port 3000)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── Preflight checks ──────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env not found." -ForegroundColor Red
    Write-Host "  Copy .env.dual-mode to .env and fill in HF_TOKEN." -ForegroundColor Yellow
    exit 1
}

try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Write-Host "  Start Docker Desktop, wait for it to finish loading, then retry." -ForegroundColor Yellow
    exit 1
}

# ── Pull images ────────────────────────────────────────────────
Write-Host ">>> Pulling images..." -ForegroundColor Green
docker compose pull qwen36 phi4mini

# ── Start Ollama containers ────────────────────────────────────
Write-Host ""
Write-Host ">>> Starting Ollama model servers..." -ForegroundColor Green
docker compose up -d qwen36 phi4mini

# ── Wait for healthchecks ──────────────────────────────────────
Write-Host ""
Write-Host ">>> Waiting for Ollama healthchecks (up to 90s)..." -ForegroundColor Yellow
$maxWait = 90
$waited  = 0
$ready   = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 10
    $waited += 10
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8001/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  ...still waiting ($waited`s elapsed)" -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "WARNING: Qwen didn't respond in time. Continuing anyway..." -ForegroundColor Yellow
}

# ── Pull model weights (first run only) ───────────────────────
Write-Host ""
Write-Host ">>> Pulling model weights (first run ~7 GB, takes several minutes)..." -ForegroundColor Green
docker compose run --rm model-init

# ── Start router + OpenHands ──────────────────────────────────
Write-Host ""
Write-Host ">>> Starting router and OpenHands UI..." -ForegroundColor Green
docker compose up -d router openhands

# ── Final health check ────────────────────────────────────────
Write-Host ""
Write-Host ">>> Verifying stack..." -ForegroundColor Green
Start-Sleep -Seconds 10

$services = @(
    @{ name="Qwen 3.6";    url="http://localhost:8001/api/tags" },
    @{ name="Phi-4 mini";  url="http://localhost:8002/api/tags" },
    @{ name="Router";      url="http://localhost:8000/health"   },
    @{ name="OpenHands";   url="http://localhost:3000"          }
)

foreach ($svc in $services) {
    try {
        $r = Invoke-WebRequest -Uri $svc.url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($r.StatusCode -lt 400) {
            Write-Host "  [OK]  $($svc.name)" -ForegroundColor Green
        } else {
            Write-Host "  [??]  $($svc.name) — HTTP $($r.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [--]  $($svc.name) — not ready yet (still starting)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Stack is up!" -ForegroundColor Green
Write-Host ""
Write-Host "  Qwen 3.6   -> http://localhost:8001/api/tags" -ForegroundColor White
Write-Host "  Phi-4 mini -> http://localhost:8002/api/tags" -ForegroundColor White
Write-Host "  Router     -> http://localhost:8000/models"   -ForegroundColor White
Write-Host "  OpenHands  -> http://localhost:3000"          -ForegroundColor White
Write-Host ""
Write-Host "  Continue.dev is configured -> http://localhost:8000/v1" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs:  docker compose logs -f" -ForegroundColor DarkGray
Write-Host "Stop:  docker compose down"    -ForegroundColor DarkGray
Write-Host ""
