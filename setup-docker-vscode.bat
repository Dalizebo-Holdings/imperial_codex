@echo off
REM Docker & Git Setup for imperial_codex (Windows PowerShell)

echo === Installing VS Code Extensions ===
code --install-extension ms-vscode.docker
code --install-extension ms-vscode-remote.remote-containers
code --install-extension eamodio.gitlens
code --install-extension esbenp.prettier-vscode

echo.
echo === Configuring Git ===
git config user.name "Lucas"
git config user.email "your-email@example.com"

echo.
echo === Docker + Git Setup Complete ===
echo * VS Code extensions installed
echo * Git user configured
echo.
echo Next steps:
echo 1. Open imperial_codex.code-workspace in VS Code
echo 2. Run: docker compose up --pull always
echo 3. Use VS Code Docker extension to manage containers
echo 4. Use Remote - Containers to develop inside the container
