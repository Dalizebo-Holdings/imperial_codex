#!/bin/bash
set -e

STACK_DIR="/workspace/dalizebo-stack"
cd "$STACK_DIR"

echo "🚀 Dalizebo 10 Pillars Stack Deployment"
echo "======================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Run generate-env.sh first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/{postgres,mariadb,redis,uptime-kuma,nextcloud/apps,crowdsec/db}
mkdir -p logs/traefik
mkdir -p configs/{prometheus,grafana/provisioning,crowdsec}
mkdir -p models
mkdir -p /home/agentdev/agents-workspace 2>/dev/null || true

# Create Traefik acme.json with correct permissions
touch logs/traefik/acme.json
chmod 600 logs/traefik/acme.json

# Create Prometheus config if not exists
if [ ! -f "configs/prometheus/prometheus.yml" ]; then
    cat > configs/prometheus/prometheus.yml << 'PROM'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['host.docker.internal:9100']
PROM
fi

# Stop existing Nginx Proxy Manager to free ports 80/443
echo "🛑 Stopping existing Nginx Proxy Manager..."
docker stop nginx-proxy-manager 2>/dev/null || true
docker stop npm-db 2>/dev/null || true

# Create Traefik network
echo "🌐 Creating Traefik proxy network..."
docker network create traefik-proxy 2>/dev/null || true

# Pull images
echo "⬇️  Pulling latest images..."
docker compose pull

# Start services
echo "🎬 Starting all services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Show status
echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""
echo "🌐 Access URLs (once DNS is configured):"
echo "   - Executive Cockpit: https://cockpit.dalizebo.co.za"
echo "   - Grafana: https://cockpit.dalizebo.co.za (same domain, different path)"
echo "   - Uptime Kuma: https://status.dalizebo.co.za"
echo "   - Nextcloud: https://office.dalizebo.co.za"
echo "   - Vaultwarden: https://vault.dalizebo.co.za"
echo "   - Chatwoot: https://chat.dalizebo.co.za"
echo "   - ERPNext: https://erp.dalizebo.co.za"
echo "   - n8n: https://n8n.dalizebo.co.za"
echo "   - Gitea: https://git.dalizebo.co.za"
echo "   - AI/Ollama: https://ai.dalizebo.co.za"
echo ""
echo "🔑 Default Credentials (CHANGE IMMEDIATELY):"
echo "   - Grafana: admin / (check .env file)"
echo "   - Nextcloud: admin / (check .env file)"
echo "   - Vaultwarden: Check your email for invite"
echo "   - n8n: admin / (check .env file)"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Configure DNS records (see dns-records.txt)"
echo "   2. Update payment gateway keys in .env"
echo "   3. Change all default passwords"
echo "   4. Enable Cloudflare proxy for SSL"
echo ""
