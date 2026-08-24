@echo off
REM Install AI coding extensions - Windows batch

echo === Installing Agentic AI Extensions ===

REM Cline (agentic coding assistant)
code --install-extension saoudrizwan.claude-dev

REM OpenCode (open-source AI assistant)
code --install-extension ryanohalloran.opencode

echo.
echo ✓ Extensions installed
echo.
echo === Extension Configuration ===
echo.
echo 1. Cline (Claude Dev) - Agentic AI for coding
echo    - Configured to use local Docker Model Runner
echo    - Model: ai/qwen3-coder or ai/devstral-small-2
echo    - Base URL: http://model-runner:12434/engines/v1
echo.
echo 2. OpenCode - Open-source AI assistant
echo    - Also connected to Docker Model Runner
echo    - Free, no API key needed
echo.
echo === Next Steps ===
echo 1. Restart VS Code or reload window (Ctrl+Shift+P ^> Developer: Reload Window)
echo 2. Open Command Palette (Ctrl+Shift+P)
echo 3. Try:
echo    - 'Cline: Open' to start agentic coding
echo    - 'OpenCode: Generate' to use AI completion
echo.
echo === Start Development ===
echo docker compose -f docker-compose.dev.yml up --pull always
