#!/bin/bash
# Server Setup Script for imperial-codex Deployment
# Run as root on 2.28.6.68

set -e

echo "🔧 Setting up deployment infrastructure..."

# ============================================================
# 1. Update system and install dependencies
# ============================================================
echo "📦 Installing Docker and dependencies..."
apt-get update
apt-get install -y \
  curl \
  wget \
  git \
  docker.io \
  docker-compose-plugin \
  jq

# Enable Docker daemon
systemctl enable docker
systemctl start docker

# ============================================================
# 2. Create deploy user
# ============================================================
echo "👤 Creating deploy user..."
if ! id -u deploy > /dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
else
  echo "Deploy user already exists"
fi

# Add deploy to docker group (no sudo needed for docker commands)
usermod -aG docker deploy

# ============================================================
# 3. Setup SSH for deploy user
# ============================================================
echo "🔐 Setting up SSH for deploy user..."
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh

# Create SSH config for GitHub access
sudo -u deploy cat > /home/deploy/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_key
    StrictHostKeyChecking no
EOF
sudo -u deploy chmod 600 /home/deploy/.ssh/config

# ============================================================
# 4. Create deployment directory
# ============================================================
echo "📁 Creating deployment directories..."
mkdir -p /home/deploy/imperial-codex
chown -R deploy:deploy /home/deploy/imperial-codex
chmod 755 /home/deploy/imperial-codex

# ============================================================
# 5. Create directory structure
# ============================================================
echo "📂 Setting up directory structure..."
sudo -u deploy mkdir -p /home/deploy/imperial-codex/{logs,backups}
sudo -u deploy touch /home/deploy/imperial-codex/.env
sudo -u deploy chmod 600 /home/deploy/imperial-codex/.env

# ============================================================
# 6. Configure Docker for registry authentication
# ============================================================
echo "🐋 Configuring Docker registry access..."
sudo -u deploy mkdir -p /home/deploy/.docker
cat > /home/deploy/.docker/config.json << 'EOF'
{
  "auths": {
    "docker.io": {},
    "ghcr.io": {}
  }
}
EOF
chown -R deploy:deploy /home/deploy/.docker
chmod 600 /home/deploy/.docker/config.json

# ============================================================
# 7. Create health check script
# ============================================================
echo "❤️ Creating health check script..."
cat > /home/deploy/imperial-codex/health-check.sh << 'EOF'
#!/bin/bash
# Health check and monitoring script

APP_URL="http://localhost:3000"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "🔍 Health check at $(date)"

# Check if container is running
if ! docker compose ps app 2>/dev/null | grep -q "Up"; then
  echo "❌ Container is not running"
  exit 1
fi

# Poll health endpoint
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf ${APP_URL}/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed at $(date)"
    exit 0
  fi
  echo "Attempt $i/$MAX_RETRIES... $(date)"
  sleep $RETRY_INTERVAL
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
EOF
chmod +x /home/deploy/imperial-codex/health-check.sh
chown deploy:deploy /home/deploy/imperial-codex/health-check.sh

# ============================================================
# 8. Create deployment helper script
# ============================================================
echo "🚀 Creating deployment helper script..."
cat > /home/deploy/imperial-codex/deploy.sh << 'EOF'
#!/bin/bash
# Deployment helper script

set -e

DEPLOY_DIR="/home/deploy/imperial-codex"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
BACKUP_DIR="${DEPLOY_DIR}/backups"

echo "🚀 Deployment script started at $(date)"

# Verify compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ docker-compose.prod.yml not found at $COMPOSE_FILE"
  exit 1
fi

# Verify .env exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env not found at $ENV_FILE"
  echo "ℹ️  Create $ENV_FILE with your environment variables"
  exit 1
fi

# Backup current state
echo "💾 Backing up current state..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/$BACKUP_NAME-ps.txt" 2>&1 || true
docker compose -f "$COMPOSE_FILE" logs app > "$BACKUP_DIR/$BACKUP_NAME-logs.txt" 2>&1 || true

# Pull latest image
echo "📥 Pulling latest image..."
docker compose -f "$COMPOSE_FILE" pull

# Bring up services
echo "🔧 Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for healthy state
echo "⏳ Waiting for container to be healthy..."
if "$DEPLOY_DIR/health-check.sh"; then
  echo "✅ Deployment successful"
else
  echo "❌ Deployment failed - health check did not pass"
  echo "📋 Recent logs:"
  docker compose -f "$COMPOSE_FILE" logs --tail=50 app
  exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=72h" 2>/dev/null || true

echo "✅ Deployment completed at $(date)"
EOF
chmod +x /home/deploy/imperial-codex/deploy.sh
chown deploy:deploy /home/deploy/imperial-codex/deploy.sh

# ============================================================
# 9. Create systemd service for auto-restart
# ============================================================
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/imperial-codex.service << EOF
[Unit]
Description=Imperial Codex Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=deploy
WorkingDirectory=/home/deploy/imperial-codex
ExecStart=/bin/bash -c 'docker compose -f docker-compose.prod.yml up -d'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload

# ============================================================
# 10. Create logrotate config
# ============================================================
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/imperial-codex << EOF
/home/deploy/imperial-codex/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
}
EOF

# ============================================================
# 11. Verify setup
# ============================================================
echo ""
echo "✅ Server setup complete!"
echo ""
echo "📋 Verification:"
echo "  Docker version: $(docker --version)"
echo "  Docker compose version: $(docker compose version)"
echo "  Deploy user: $(id deploy 2>/dev/null || echo 'NOT FOUND')"
echo "  Deployment directory: $(ls -ld /home/deploy/imperial-codex 2>/dev/null || echo 'NOT FOUND')"
echo ""
echo "📝 Next steps:"
echo "  1. Copy your docker-compose.prod.yml to /home/deploy/imperial-codex/"
echo "  2. Create /home/deploy/imperial-codex/.env with your secrets"
echo "  3. Test deployment: sudo -u deploy /home/deploy/imperial-codex/deploy.sh"
echo "  4. Generate SSH key for GitHub Actions"
echo ""
