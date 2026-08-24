# Health Checks & Self-Healing: Complete Guide

## Health Check Mechanisms

Imperial Codex uses **three layers** of health checks:

### 1. Docker Compose (Single-Host)

**What it does:**
- Runs HTTP GET to `http://localhost:3000` every 30 seconds
- Declares container "unhealthy" after 3 consecutive failures
- **Does NOT automatically restart** — requires explicit restart policy

**Restart Policy:**
```yaml
restart: on-failure
restart_policy:
  condition: on-failure
  delay: 5s              # Wait 5s before first restart attempt
  max_attempts: 5        # Restart max 5 times
  window: 120s           # Consider 2min as failure window
```

**Behavior:**
- Container crashes → waits 5s → restarts
- After 5 failed restarts within 120s → stops restarting
- Must manually restart: `docker restart imperial_codex-app`

**Monitor status:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
# Shows: "Up 5 minutes (healthy)" or "Up 2 minutes (unhealthy)"
```

### 2. Health Monitor Script (Active Monitoring)

**What it does:**
- Watches container health every N seconds
- Automatically restarts after X consecutive failures
- Sends Slack/webhook notifications
- Tracks recovery

**Usage:**
```bash
chmod +x docker-health-monitor.sh

# Basic monitoring
./docker-health-monitor.sh imperial_codex-app

# With Slack alerts
./docker-health-monitor.sh imperial_codex-app \
  "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" 60
```

**What happens on failure:**
1. Health check fails → logged with timestamp
2. Retries 3 times at 30s intervals
3. After 3 failures → sends Slack alert + restarts container
4. Monitors for recovery → sends "recovered" alert
5. Runs indefinitely (trap SIGINT/SIGTERM for graceful exit)

**Run as systemd service:**
```bash
sudo tee /etc/systemd/system/imperial-codex-monitor.service > /dev/null <<EOF
[Unit]
Description=Imperial Codex Health Monitor
After=docker.service

[Service]
Type=simple
ExecStart=/path/to/docker-health-monitor.sh imperial_codex-app "SLACK_WEBHOOK_URL"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable imperial-codex-monitor
sudo systemctl start imperial-codex-monitor
sudo systemctl status imperial-codex-monitor
```

### 3. Kubernetes (Multi-Node Orchestration)

**Three probe types:**

| Probe | Purpose | Action | Config |
|-------|---------|--------|--------|
| **Liveness** | Restart deadlocked app | Kill + recreate pod | Every 20s, fail after 3 retries |
| **Readiness** | Remove from load balancer | Take off service | Every 10s, fail after 2 retries |
| **Startup** | Wait for app init | Block other probes | Every 5s, fail after 30 retries (150s) |

**Deployment with probes:**
```bash
kubectl apply -f kubernetes/deployment.yaml
```

**Monitor:**
```bash
# Watch pod status
kubectl get pods -w

# View events
kubectl describe pod imperial-codex-xxx

# View logs
kubectl logs -f imperial-codex-xxx

# Check readiness
kubectl get endpoints imperial-codex
```

---

## Health Check Inspector Script

**What it does:**
- Shows detailed health report in one command
- Displays uptime, health history, resource usage, logs, network info
- Tests HTTP endpoint
- Checks memory limits

**Usage:**
```bash
chmod +x docker-health-check.sh
./docker-health-check.sh imperial_codex-app
```

**Output includes:**
- Container status + uptime
- Health check configuration
- Last 5 health check results
- CPU/Memory usage
- Port mappings
- Network configuration
- Last 10 log lines
- HTTP endpoint status
- Memory limit

---

## Troubleshooting

### Container marked "unhealthy" but is actually fine

**Cause:** Health check endpoint failing despite app running

**Debug:**
```bash
# Check if endpoint responds
docker exec imperial_codex-app curl -v http://localhost:3000

# View health check command
docker inspect imperial_codex-app | grep -A 10 Healthcheck

# Check recent logs
docker logs --tail 50 imperial_codex-app

# Verify port is bound
docker port imperial_codex-app
```

**Fix:**
- Verify `NODE_ENV=production` is set
- Check all required env vars are loaded (use `--env-file .env.local`)
- Ensure app starts within `start_period: 10s`
- Increase timeout if app is slow: `timeout: 10s`

### Container keeps restarting

**Check restart policy:**
```bash
docker inspect imperial_codex-app | grep -A 5 RestartPolicy
```

**If `MaxRetryCount: 0` (unlimited):**
- Fix the underlying issue (see logs)
- App won't stay down once fixed

**If `MaxRetryCount: 5`:**
- After 5 restarts, stays down
- Manual restart needed: `docker restart imperial_codex-app`

### No health check at all

**Cause:** Image built without HEALTHCHECK instruction

**Fix:**
```bash
# Rebuild with Dockerfile (includes HEALTHCHECK)
docker build --target runner -t imperial-codex:latest .

# Restart container
docker compose down && docker compose up -d
```

### Monitor script not sending Slack alerts

**Cause:** Invalid webhook URL

**Fix:**
```bash
# Test Slack webhook manually
curl -X POST "WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from Docker"}'

# Re-run monitor with correct URL
./docker-health-monitor.sh imperial_codex-app "https://hooks.slack.com/..." 30
```

### High CPU/Memory during health checks

**Cause:** Health check spawning new Node process each time

**Current:** `node -e "require('http').get(...)"` (lightweight)

**Alternative for high-frequency checks:**
```dockerfile
# Use curl instead (less overhead)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
```

---

## Best Practices

1. **Use all three layers:**
   - Docker health check: baseline
   - Monitor script: immediate restart on single-host
   - Kubernetes probes: production multi-node

2. **Tune probe timings:**
   - `initialDelaySeconds`: increase if app has slow startup
   - `periodSeconds`: balance between responsiveness and overhead
   - `failureThreshold`: higher tolerance = fewer false positives

3. **Monitor the monitors:**
   - Log monitor script output: `docker-health-monitor.sh ... | tee monitor.log`
   - Set up alerting on monitor exit: systemd `OnFailure` units
   - Periodically review health check logs

4. **Test failure scenarios:**
   ```bash
   # Simulate unhealthy state
   docker exec imperial_codex-app bash -c "echo 'bad' > /app/health.lock"
   
   # Watch restart
   docker ps --format "table {{.Names}}\t{{.Status}}" -a
   
   # Clean up
   docker exec imperial_codex-app rm /app/health.lock
   ```

5. **Never remove health checks:**
   - Disabling: `docker update --health-none imperial_codex-app`
   - Verify they're still configured: `docker inspect`

---

## Summary

| Layer | Auto-Restart? | Scope | Alert Capable? |
|-------|---------------|-------|----------------|
| Docker Healthcheck | No (needs restart policy) | Single host | No |
| Monitor Script | Yes (active) | Single host | Yes (Slack/webhook) |
| Kubernetes Probes | Yes (automatic) | Multi-node cluster | Yes (via monitoring stack) |

**Recommended setup:**
- **Development:** Docker Compose + monitor script
- **Single-host production:** Docker Compose + monitor script as systemd service
- **Multi-node production:** Kubernetes with all three probes + Prometheus/Grafana

Next: integrate with Prometheus for metrics collection, or set up log aggregation (ELK, Loki).
