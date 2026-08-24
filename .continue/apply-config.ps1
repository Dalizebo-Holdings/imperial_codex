# ============================================================
# Continue.dev Configuration Refresh Script
# Run this to apply the new configuration and reload Continue
# ============================================================

Write-Host "`n=== Continue.dev Configuration Refresh ===" -ForegroundColor Cyan

# Step 1: Check if .env.local exists and has keys filled in
Write-Host "`n[1/5] Checking .env.local file..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".." ".env.local"

if (Test-Path $envPath) {
    Write-Host "✓ .env.local found at: $envPath" -ForegroundColor Green
    
    # Check if keys are filled in (not empty)
    $envContent = Get-Content $envPath -Raw
    $emptyKeys = @()
    
    if ($envContent -match "OPENAI_API_KEY=\s*$") { $emptyKeys += "OPENAI_API_KEY" }
    if ($envContent -match "ANTHROPIC_API_KEY=\s*$") { $emptyKeys += "ANTHROPIC_API_KEY" }
    if ($envContent -match "BRAVE_API_KEY=\s*$") { $emptyKeys += "BRAVE_API_KEY" }
    if ($envContent -match "GITHUB_TOKEN=\s*$") { $emptyKeys += "GITHUB_TOKEN" }
    
    if ($emptyKeys.Count -gt 0) {
        Write-Host "⚠ Warning: The following keys are empty:" -ForegroundColor Yellow
        $emptyKeys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host "`nContinue will use local models only until you fill these in." -ForegroundColor Yellow
    } else {
        Write-Host "✓ All required API keys are filled in" -ForegroundColor Green
    }
} else {
    Write-Host "✗ .env.local not found. Creating template..." -ForegroundColor Red
    Copy-Item (Join-Path $PSScriptRoot ".." ".env.example") $envPath
    Write-Host "✓ Created .env.local. Please fill in your API keys." -ForegroundColor Yellow
}

# Step 2: Verify config files exist
Write-Host "`n[2/5] Verifying configuration files..." -ForegroundColor Yellow

$configYaml = Join-Path $PSScriptRoot "config.yaml"
$configJson = Join-Path $PSScriptRoot "config.json"
$continueRules = Join-Path $PSScriptRoot ".." ".continuerules"

$allPresent = $true

if (Test-Path $configYaml) {
    Write-Host "✓ config.yaml found" -ForegroundColor Green
} else {
    Write-Host "✗ config.yaml missing" -ForegroundColor Red
    $allPresent = $false
}

if (Test-Path $configJson) {
    Write-Host "✓ config.json found" -ForegroundColor Green
} else {
    Write-Host "✗ config.json missing" -ForegroundColor Red
    $allPresent = $false
}

if (Test-Path $continueRules) {
    Write-Host "✓ .continuerules found" -ForegroundColor Green
} else {
    Write-Host "✗ .continuerules missing" -ForegroundColor Red
    $allPresent = $false
}

if (-not $allPresent) {
    Write-Host "`n✗ Some configuration files are missing. Cannot proceed." -ForegroundColor Red
    exit 1
}

# Step 3: Check if dual-model router is running
Write-Host "`n[3/5] Checking dual-model router status..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/v1/models" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Dual-model router is running on :8000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Dual-model router is not responding on :8000" -ForegroundColor Yellow
    Write-Host "  Local models (Qwen/Phi4) will not be available." -ForegroundColor Yellow
    Write-Host "  To start it: cd dual-model && docker compose up -d" -ForegroundColor Yellow
}

# Step 4: Set environment variables (optional, for this session only)
Write-Host "`n[4/5] Loading environment variables for this session..." -ForegroundColor Yellow

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([A-Z_]+)=(.+)$') {
            $key = $matches[1]
            $value = $matches[2]
            if ($value -ne "") {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "  Set $key" -ForegroundColor Gray
            }
        }
    }
    Write-Host "✓ Environment variables loaded for this PowerShell session" -ForegroundColor Green
    Write-Host "  (VS Code will need to be launched from this shell to inherit them)" -ForegroundColor Yellow
}

# Step 5: Instructions to reload VS Code
Write-Host "`n[5/5] Final steps to apply configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option A — Reload VS Code Window (Quick):" -ForegroundColor Cyan
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type: 'Developer: Reload Window'" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White
Write-Host ""
Write-Host "Option B — Restart VS Code Entirely (Recommended):" -ForegroundColor Cyan
Write-Host "  1. Close all VS Code windows" -ForegroundColor White
Write-Host "  2. Open a new PowerShell terminal" -ForegroundColor White
Write-Host "  3. Run: code 'c:\Users\lucas\OneDrive\Dalizebo Holdings\imperial_codex'" -ForegroundColor White
Write-Host ""
Write-Host "After reload, check Continue.dev sidebar to verify:" -ForegroundColor Yellow
Write-Host "  • Models list shows all 6 models (2 local + 4 cloud)" -ForegroundColor White
Write-Host "  • MCP servers are connected (check the MCP tab)" -ForegroundColor White
Write-Host "  • Slash commands include /edit, /test, /review, etc." -ForegroundColor White
Write-Host ""
Write-Host "=== Configuration Refresh Complete ===" -ForegroundColor Cyan
Write-Host ""
