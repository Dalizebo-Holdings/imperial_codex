#!/bin/bash
set -e

ENV_FILE="/workspace/dalizebo-stack/.env"
echo "🔐 Generating secure .env file for Dalizebo 10 Pillars Stack..."

# Extract existing secrets from running containers
echo "📥 Extracting existing secrets from running containers..."

# Get Vaultwarden key if exists
VAULT_KEY=""
if docker ps --format '{{.Names}}' | grep -q "vaultwarden"; then
    VAULT_KEY=$(docker exec vaultwarden printenv ADMIN_TOKEN 2>/dev/null || echo "")
fi

# Get n8n encryption key if exists
N8N_KEY=""
if docker ps --format '{{.Names}}' | grep -q "n8n"; then
    N8N_KEY=$(docker exec n8n printenv N8N_ENCRYPTION_KEY 2>/dev/null || echo "")
fi

# Get Cosmos DB passwords
COSMOS_PG_PASS=""
COSMOS_MONGO_PASS=""
if docker ps --format '{{.Names}}' | grep -q "cosmos-mongo-pg"; then
    COSMOS_PG_PASS=$(docker exec cosmos-mongo-pg printenv POSTGRES_PASSWORD 2>/dev/null || echo "")
    COSMOS_MONGO_PASS=$(docker exec cosmos-mongo-pg printenv MONGO_PASSWORD 2>/dev/null || echo "")
fi

# Generate function for secure random strings
generate_password() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

generate_secret() {
    openssl rand -hex 32
}

echo "🎲 Generating new secure passwords..."

# Create the .env file
cat > "$ENV_FILE" << EOF
# ==========================================
# DALIZEBO 10 PILLARS STACK - ENVIRONMENT
# Generated: $(date)
# ==========================================

# --- EXISTING SECRETS (Preserved) ---
VAULTWARDEN_ADMIN_TOKEN=${VAULT_KEY:-$(generate_secret)}
N8N_ENCRYPTION_KEY=${N8N_KEY:-$(generate_secret)}
COSMOS_POSTGRES_PASSWORD=${COSMOS_PG_PASS:-$(generate_password)}
COSMOS_MONGO_PASSWORD=${COSMOS_MONGO_PASS:-$(generate_password)}

# --- TRAEFIK DASHBOARD ---
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD=$(openssl passwd -apr1 $(generate_password))

# --- GRAFANA ---
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=$(generate_password)

# --- PROMETHEUS ---
PROMETHEUS_BASIC_AUTH_PASSWORD=$(generate_password)

# --- NEXTCLOUD ---
NEXTCLOUD_ADMIN_USER=admin
NEXTCLOUD_ADMIN_PASSWORD=$(generate_password)
NEXTCLOUD_TRUSTED_DOMAINS="office.dalizebo.co.za dalizebo.co.za"

# --- VAULTWARDEN ---
VAULTWARDEN_DOMAIN="https://vault.dalizebo.co.za"
VAULTWARDEN_SMTP_HOST=smtp.gmail.com
VAULTWARDEN_SMTP_PORT=587
VAULTWARDEN_SMTP_FROM=admin@dalizebo.co.za
VAULTWARDEN_SMTP_USERNAME=
VAULTWARDEN_SMTP_PASSWORD=

# --- CHATWOOT ---
CHATWOOT_SECRET_KEY=$(generate_secret)
CHATWOOT_FRONTEND_URL="https://chat.dalizebo.co.za"
CHATWOOT_BACKEND_URL="https://chat.dalizebo.co.za"

# --- ERPNext ---
ERP_NEXT_DB_PASSWORD=$(generate_password)
ERP_NEXT_ADMIN_PASSWORD=$(generate_password)
ERP_NEXT_SITE_NAME="erp.dalizebo.co.za"

# --- SUPABASE ---
SUPABASE_ANON_KEY=$(generate_secret)
SUPABASE_SERVICE_ROLE_KEY=$(generate_secret)
SUPABASE_JWT_SECRET=$(generate_secret)
SUPABASE_DB_PASSWORD=$(generate_password)
SUPABASE_GOTRUE_JWT_SECRET=$(generate_secret)

# --- DATABASES ---
POSTGRES_USER=dalizebo
POSTGRES_PASSWORD=$(generate_password)
POSTGRES_DB=dalizebo_main

MYSQL_ROOT_PASSWORD=$(generate_password)
MYSQL_DATABASE=erpnext
MYSQL_USER=erpnext
MYSQL_PASSWORD=$(generate_password)

REDIS_PASSWORD=$(generate_password)

# --- MONGODB ---
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=$(generate_password)

# --- AI AGENT ---
OLLAMA_MODELS="/ollama/models"
AGENT_API_KEY=$(generate_secret)

# --- GITEA ---
GITEA_ADMIN_USER=admin
GITEA_ADMIN_PASSWORD=$(generate_password)
GITEA_SECRET=$(generate_secret)

# --- N8N ---
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(generate_password)
N8N_HOST="n8n.dalizebo.co.za"
N8N_PROTOCOL=https
N8N_PORT=5678
N8N_WEBHOOK_URL="https://n8n.dalizebo.co.za/"

# --- CLOUDFLARE (PLACEHOLDERS) ---
CLOUDFLARE_API_TOKEN=PENDING_MANUAL_ENTRY
CLOUDFLARE_ACCOUNT_ID=PENDING_MANUAL_ENTRY
CLOUDFLARE_TUNNEL_SECRET=PENDING_MANUAL_ENTRY

# --- PAYMENT GATEWAYS (PLACEHOLDERS) ---
STRIPE_SECRET_KEY=PENDING_MANUAL_ENTRY
STRIPE_WEBHOOK_SECRET=PENDING_MANUAL_ENTRY
STRIPE_PUBLISHABLE_KEY=PENDING_MANUAL_ENTRY
OZOW_PRIVATE_KEY=PENDING_MANUAL_ENTRY
OZOW_SITE_CODE=PENDING_MANUAL_ENTRY
CAPITEC_API_KEY=PENDING_MANUAL_ENTRY
CAPITEC_MERCHANT_ID=PENDING_MANUAL_ENTRY

# --- S3 STORAGE (PLACEHOLDERS) ---
S3_ACCESS_KEY=PENDING_MANUAL_ENTRY
S3_SECRET_KEY=PENDING_MANUAL_ENTRY
S3_BUCKET_NAME=dalizebo-backups
S3_ENDPOINT_URL=https://fra1.digitaloceanspaces.com
S3_REGION=fra1

# --- BACKUP ---
BACKUP_ENCRYPTION_KEY=$(generate_secret)
BACKUP_RETENTION_DAYS=30

# --- GENERAL ---
TZ=Africa/Johannesburg
DOMAIN=dalizebo.co.za
SERVER_IP=2.28.6.68
EOF

chmod 600 "$ENV_FILE"
echo "✅ .env file created securely at $ENV_FILE"
echo "🔒 Permissions set to 600 (Owner Read/Write only)"
echo ""
echo "⚠️  IMPORTANT: You must manually update the following fields before production:"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - STRIPE_SECRET_KEY"
echo "   - OZOW_PRIVATE_KEY"
echo "   - CAPITEC_API_KEY"
echo "   - S3_ACCESS_KEY / S3_SECRET_KEY"
echo ""
echo "Run 'nano $ENV_FILE' to edit these values."
