#!/bin/bash

# Imperial Codex: Monitoring Setup Script
# Configures health monitoring as a systemd service
# Usage: ./monitoring-setup.sh [container_name] [slack_webhook]

set -e

CONTAINER="${1:-imperial_codex-app}"
SLACK_WEBHOOK="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/docker-health-monitor.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}▶${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Check prerequisites
section "Pre-Setup Checks"

if [ "$EUID" -ne 0 ]; then
  warning "This script must be run as root to create systemd service"
  log "Running with sudo..."
  sudo "$0" "$CONTAINER" "$SLACK_WEBHOOK"
  exit 0
fi

if ! command -v docker &> /dev/null; then
  error "Docker is not installed"
fi
success "Docker installed"

if [ ! -f "$MONITOR_SCRIPT" ]; then
  error "Monitor script not found at $MONITOR_SCRIPT"
fi
success "Monitor script found"

# Make monitor script executable
chmod +x "$MONITOR_SCRIPT"
success "Monitor script is executable"

# Create systemd service
section "Creating Systemd Service"

SERVICE_FILE="/etc/systemd/system/imperial-codex-monitor.service"

if [ -f "$SERVICE_FILE" ]; then
  warning "Service file already exists at $SERVICE_FILE"
  read -p "Overwrite? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Setup cancelled"
  fi
fi

log "Creating service file..."

if [ -z "$SLACK_WEBHOOK" ]; then
  # Without Slack
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Imperial Codex Health Monitor
After=docker.service
Wants=docker.service
Documentation=file://$SCRIPT_DIR/HEALTH_CHECKS_GUIDE.md

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$MONITOR_SCRIPT $CONTAINER
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
StandardOutput=journal-plus-console

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$SCRIPT_DIR

[Install]
WantedBy=multi-user.target
EOF
else
  # With Slack webhook
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Imperial Codex Health Monitor (with Slack Alerts)
After=docker.service
Wants=docker.service
Documentation=file://$SCRIPT_DIR/HEALTH_CHECKS_GUIDE.md

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$MONITOR_SCRIPT $CONTAINER "$SLACK_WEBHOOK"
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$SCRIPT_DIR

[Install]
WantedBy=multi-user.target
EOF
fi

success "Service file created: $SERVICE_FILE"

# Show service file
log "Service configuration:"
echo ""
cat "$SERVICE_FILE" | sed 's/^/  /'
echo ""

# Reload systemd
section "Enabling Service"

log "Reloading systemd daemon..."
systemctl daemon-reload
success "Systemd daemon reloaded"

log "Enabling service (auto-start on boot)..."
systemctl enable imperial-codex-monitor
success "Service enabled"

# Start service
section "Starting Service"

log "Starting imperial-codex-monitor..."
systemctl start imperial-codex-monitor
success "Service started"

# Check status
sleep 2

section "Service Status"

systemctl status imperial-codex-monitor

# Show logs
section "Recent Logs"

log "Last 20 lines:"
journalctl -u imperial-codex-monitor -n 20 --no-pager

# Summary
section "Setup Complete ✓"

echo "Monitoring is now active!"
echo ""
echo "Service Status:"
echo "  Container: $CONTAINER"
if [ -n "$SLACK_WEBHOOK" ]; then
  echo "  Slack Alerts: Enabled"
else
  echo "  Slack Alerts: Disabled"
fi
echo ""

echo "Common commands:"
echo ""
echo "  View service status:"
echo "    systemctl status imperial-codex-monitor"
echo ""
echo "  View live logs:"
echo "    journalctl -u imperial-codex-monitor -f"
echo ""
echo "  View last 100 logs:"
echo "    journalctl -u imperial-codex-monitor -n 100 --no-pager"
echo ""
echo "  Stop monitoring:"
echo "    systemctl stop imperial-codex-monitor"
echo ""
echo "  Restart monitoring:"
echo "    systemctl restart imperial-codex-monitor"
echo ""
echo "  Disable auto-start:"
echo "    systemctl disable imperial-codex-monitor"
echo ""
echo "  Remove service:"
echo "    systemctl stop imperial-codex-monitor"
echo "    systemctl disable imperial-codex-monitor"
echo "    rm $SERVICE_FILE"
echo "    systemctl daemon-reload"
echo ""

success "Monitoring service setup successful! 🚀"
