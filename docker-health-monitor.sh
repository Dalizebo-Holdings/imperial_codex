#!/bin/bash

# Health Check Monitor for Imperial Codex
# Watches container health and sends notifications on failure
# Usage: ./docker-health-monitor.sh [container_name] [slack_webhook_url] [check_interval_seconds]

set -e

CONTAINER="${1:-imperial_codex-app}"
SLACK_WEBHOOK="${2:-}"
CHECK_INTERVAL="${3:-30}"
RETRY_COUNT=0
MAX_RETRIES=3
ALERT_SENT=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

send_slack_alert() {
  local status=$1
  local message=$2
  local color=$3

  if [[ -z "$SLACK_WEBHOOK" ]]; then
    return
  fi

  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d @- <<EOF 2>/dev/null || true
{
  "attachments": [
    {
      "color": "$color",
      "title": "🚨 Imperial Codex Health Alert",
      "text": "$message",
      "fields": [
        {
          "title": "Container",
          "value": "$CONTAINER",
          "short": true
        },
        {
          "title": "Status",
          "value": "$status",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$(date -u +'%Y-%m-%d %H:%M:%S UTC')",
          "short": false
        }
      ],
      "footer": "Docker Health Monitor"
    }
  ]
}
EOF
}

check_container_exists() {
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    error "Container '$CONTAINER' not found"
    send_slack_alert "ERROR" "Container $CONTAINER not found on $(hostname)" "danger"
    exit 1
  fi
}

get_health_status() {
  docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "none"
}

get_container_status() {
  docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "unknown"
}

restart_container() {
  log "Restarting container $CONTAINER..."
  docker restart "$CONTAINER"
  sleep 10

  local new_status=$(get_container_status)
  if [[ "$new_status" == "running" ]]; then
    success "Container restarted successfully"
    send_slack_alert "RESTARTED" "Container $CONTAINER was restarted and is now running" "warning"
    RETRY_COUNT=0
    ALERT_SENT=false
  else
    error "Container failed to restart (status: $new_status)"
    send_slack_alert "FAILED" "Container $CONTAINER failed to restart. Status: $new_status" "danger"
  fi
}

monitor_health() {
  check_container_exists

  log "Starting health monitor for container: $CONTAINER"
  log "Check interval: ${CHECK_INTERVAL}s"
  [[ -n "$SLACK_WEBHOOK" ]] && log "Slack notifications: ENABLED" || log "Slack notifications: DISABLED"
  echo ""

  while true; do
    local health_status=$(get_health_status)
    local container_status=$(get_container_status)

    log "Container status: $container_status | Health: $health_status"

    case "$health_status" in
      "healthy")
        if [[ "$ALERT_SENT" == true ]]; then
          success "Container returned to healthy state"
          send_slack_alert "RECOVERED" "Container $CONTAINER is healthy again" "good"
          ALERT_SENT=false
          RETRY_COUNT=0
        else
          success "Container is healthy"
        fi
        ;;
      "unhealthy")
        RETRY_COUNT=$((RETRY_COUNT + 1))
        warning "Container is unhealthy (attempt $RETRY_COUNT/$MAX_RETRIES)"

        if [[ $RETRY_COUNT -ge $MAX_RETRIES ]]; then
          error "Container failed $MAX_RETRIES consecutive health checks"
          if [[ "$ALERT_SENT" == false ]]; then
            send_slack_alert "UNHEALTHY" "Container $CONTAINER failed $MAX_RETRIES health checks. Attempting restart..." "danger"
            ALERT_SENT=true
          fi
          restart_container
        fi
        ;;
      "starting")
        log "Container is still starting up..."
        ;;
      "none")
        if [[ "$container_status" == "running" ]]; then
          warning "No health check configured for this container"
        else
          error "Container is not running (status: $container_status)"
          if [[ "$container_status" == "exited" ]]; then
            send_slack_alert "EXITED" "Container $CONTAINER exited unexpectedly" "danger"
            restart_container
          fi
        fi
        ;;
    esac

    sleep "$CHECK_INTERVAL"
  done
}

# Cleanup on exit
trap 'log "Health monitor stopped"; exit 0' SIGINT SIGTERM

# Start monitoring
monitor_health
