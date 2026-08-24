@echo off
REM Troubleshooting for VS Code Remote Container attachment on Windows

echo === Docker Status Check ===
docker --version
docker ps -a

echo.
echo === Checking imperial_codex container ===
docker ps -a | findstr /i "imperial" || echo No running imperial_codex container found

echo.
echo === Troubleshooting Steps ===
echo 1. Ensure Docker Desktop is running
echo 2. Verify container is running: docker compose up --pull always
echo 3. Check container logs: docker logs imperial_codex-app-1
echo 4. Restart container: docker compose down ^&^& docker compose up
echo.
echo 5. In VS Code:
echo    - Ctrl+Shift+P -^> Remote-Containers: Open Folder in Container
echo    - Select the imperial_codex folder
echo.
echo 6. If still failing, try the attach method:
echo    - Ctrl+Shift+P -^> Remote-Containers: Attach to Running Container
echo    - Ensure container name appears in list
echo.
echo === VS Code Extension Check ===
code --list-extensions | findstr /i "docker" || echo Required extensions may not be installed

echo.
echo === Alternative: Direct Compose with VS Code ===
echo - Install "Dev Containers" extension (ms-vscode-remote.remote-containers)
echo - Make sure docker-compose.yml has service named 'app'
echo - Cmd+Shift+P -^> Remote-Containers: Reopen in Container
