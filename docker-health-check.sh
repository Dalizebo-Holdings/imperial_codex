#!/bin/bash

# Docker Health Check Inspector
# Shows detailed health status of a container
# Usage: ./docker-health-check.sh [container_name]

set -e

CONTAINER="${1:-imperial_codex-app}"
FORMAT="table"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}$1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  error "Container '$CONTAINER' not found"
  exit 1
fi

log "═════════════════════════════════════════════════════════════"
log "Health Check Report: $CONTAINER"
log "═════════════════════════════════════════════════════════════"
echo ""

# Container status
STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER")
log "Container Status: $STATUS"

if [[ "$STATUS" != "running" ]]; then
  warning "Container is not running!"
  exit 1
fi

# Uptime
STARTED=$(docker inspect --format='{{.State.StartedAt}}' "$CONTAINER")
START_EPOCH=$(date -d "$STARTED" +%s 2>/dev/null || date -jf "%Y-%m-%dT%H:%M:%S" "$STARTED" +%s)
NOW_EPOCH=$(date +%s)
UPTIME_SECS=$((NOW_EPOCH - START_EPOCH))
UPTIME_MINS=$((UPTIME_SECS / 60))
UPTIME_HOURS=$((UPTIME_MINS / 60))
UPTIME_DAYS=$((UPTIME_HOURS / 24))

if [[ $UPTIME_DAYS -gt 0 ]]; then
  log "Uptime: ${UPTIME_DAYS}d ${UPTIME_HOURS}h ${UPTIME_MINS}m"
else
  log "Uptime: ${UPTIME_HOURS}h ${UPTIME_MINS}m"
fi

echo ""
log "─────────────────────────────────────────────────────────────"
log "Health Check Status:"
log "─────────────────────────────────────────────────────────────"

HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "none")

case "$HEALTH" in
  "healthy")
    success "Container is HEALTHY"
    ;;
  "unhealthy")
    error "Container is UNHEALTHY"
    ;;
  "starting")
    warning "Container is still STARTING"
    ;;
  "none")
    warning "No health check configured"
    ;;
esac

# Health check details
if [[ "$HEALTH" != "none" ]]; then
  echo ""
  log "Health Check Configuration:"
  docker inspect "$CONTAINER" --format='
  Test: {{.Config.Healthcheck.Test}}
  Interval: {{.Config.Healthcheck.Interval}}
  Timeout: {{.Config.Healthcheck.Timeout}}
  Retries: {{.Config.Healthcheck.Retries}}
  Start Period: {{.Config.Healthcheck.StartPeriod}}'

  echo ""
  log "Health Check History (last 5):"
  docker inspect "$CONTAINER" --format='{{range last 5 .State.Health.Log}}
  • {{.Start}}: {{.ExitCode}} - {{.Output}}{{end}}'
fi

echo ""
log "─────────────────────────────────────────────────────────────"
log "Resource Usage:"
log "─────────────────────────────────────────────────────────────"

docker stats --no-stream "$CONTAINER" --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || \
  warning "Could not retrieve resource stats"

echo ""
log "─────────────────────────────────────────────────────────────"
log "Port Bindings:"
log "─────────────────────────────────────────────────────────────"

docker inspect "$CONTAINER" --format='{{range $p, $conf := .NetworkSettings.Ports}}
  {{$p}} → {{range $conf}}{{.HostIp}}:{{.HostPort}}{{end}}{{end}}'

echo ""
log "─────────────────────────────────────────────────────────────"
log "Network:"
log "─────────────────────────────────────────────────────────────"

docker inspect "$CONTAINER" --format='
  Connected Networks:{{range .NetworkSettings.Networks}}
  • {{.Name}} (IP: {{.IPAddress}}){{end}}'

echo ""
log "─────────────────────────────────────────────────────────────"
log "Recent Logs (last 10 lines):"
log "─────────────────────────────────────────────────────────────"
docker logs --tail 10 "$CONTAINER" 2>&1 | sed 's/^/  /'

echo ""
log "═════════════════════════════════════════════════════════════"

# Quick diagnostics
echo ""
log "Diagnostics:"

# Test HTTP endpoint
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  success "HTTP endpoint responding"
else
  error "HTTP endpoint not responding"
fi

# Check memory
MEMORY_LIMIT=$(docker inspect "$CONTAINER" --format='{{.HostConfig.Memory}}')
if [[ $MEMORY_LIMIT -gt 0 ]]; then
  success "Memory limit set: $((MEMORY_LIMIT / 1024 / 1024))MB"
else
  warning "No memory limit configured"
fi

echo ""
log "═════════════════════════════════════════════════════════════"
