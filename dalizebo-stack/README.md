# Dalizebo.co.za - 10 Pillars Full Stack Documentation

## 🏛️ Architecture Overview

This stack implements all **10 Engineering Pillars** for a modern, secure, self-healing infrastructure hosting dalizebo.co.za.

### Key Changes from Previous Setup
- **Replaced Nginx Proxy Manager** with **Traefik v3** for automatic SSL and better container integration
- **Consolidated databases** into shared PostgreSQL/Redis instances with proper isolation
- **Added comprehensive monitoring** with Prometheus + Grafana + Uptime Kuma
- **Implemented storage governance** with auto-prune at 85% usage
- **Enhanced security** with CrowdSec WAF and tokenized payment compliance

---

## 📋 The 10 Pillars Implementation

### PILLAR 1: Executive Cockpit & Real-Time Performance Monitor
- **Grafana** (`cockpit.dalizebo.co.za`) - Executive dashboards
- **Prometheus** - Metrics collection (15-day retention)
- **Node Exporter** - System resource monitoring
- **Uptime Kuma** (`status.dalizebo.co.za`) - Service health monitoring
- **Live Financial Telemetry** - Webhook pipelines from Stripe/Ozow/Capitec

### PILLAR 2: Manager's Office & Operational Suite
- **Nextcloud** (`office.dalizebo.co.za`) - Files, calendars, contacts
- **Vaultwarden** (`vault.dalizebo.co.za`) - Secure password management
- **Chatwoot** (`chat.dalizebo.co.za`) - Customer success engine

### PILLAR 3: Fintech, Banking, Accounting & Taxation
- **ERPNext** (`erp.dalizebo.co.za`) - Full ERP with POS, inventory, taxation
- **Payment Reconciliation** - Auto-sync from all gateways to ERP ledger
- **SARS Compliance** - VAT and corporate tax reporting modules

### PILLAR 4: Digital & Retail Revenue Machines
- **Supabase** (`studio.dalizebo.co.za`) - Backend for storefront
- **Multi-Currency Storefront** - Ready for Next.js integration
- **Supplier/Vendor Repos** - `/opt/suppliers` and `/opt/vendors` directories
- **Affiliate Engine** - Supabase module for referral tracking

### PILLAR 5: The AI Digital Twin (24/7 Sleep Monetizer)
- **Ollama** - Local LLM runtime (Llama-3, Mistral, Qwen-Coder)
- **Agent Workspace** - `/home/agentdev/agents-workspace`
- **Autonomous Execution** - Nightly financial reconciliation at 06:00 SAST

### PILLAR 6: Global Omnichannel Supply & Dropship Integration
- **Automated Sync Scripts** - Takealot, global dropshippers
- **B2B Settlement** - Virtual card payouts on fund clearance
- **Physical-Digital Sync** - Jane Furse store + online unified inventory

### PILLAR 7: Advanced Marketing & Traffic Engine
- **n8n** (`n8n.dalizebo.co.za`) - Automation workflows
- **SEO Content Generation** - Ollama-powered blog posts
- **ROAS Tracking** - Ad spend correlation with payment events
- **Zoho Mail Integration** - Email broadcast sequences

### PILLAR 8: Cybersecurity, Backup & Disaster Recovery
- **Traefik** - Automatic SSL with Let's Encrypt
- **CrowdSec** - WAF and intrusion prevention
- **PCI-DSS Compliance** - Tokenized payment fields only
- **Encrypted Backups** - Nightly snapshots with 30-day retention
- **ZRAM + EarlyOOM** - Memory protection

### PILLAR 9: Autonomous R&D & Self-Coding CI/CD
- **Gitea** (`git.dalizebo.co.za`) - Git server with SSH access
- **Isolated Agent Workspace** - Unprivileged Docker access
- **Webhook Sandbox** - Test Stripe/Ozow/Capitec webhooks safely
- **Imperial Codex** - `/opt/imperial-codex` ruleset verification

### PILLAR 10: Customer Success, Loyalty & Conversational Commerce
- **Chatwoot** - Omnichannel CRM and ticketing
- **WhatsApp Bot** - n8n + Ollama integration ready
- **Loyalty Rewards** - Supabase point-scoring system

---

## 🚀 Deployment Instructions

### Prerequisites
1. VPS with Docker & Docker Compose v2+ installed
2. DNS records configured for all subdomains (see DNS section)
3. Ports 80, 443, 2222 open on firewall

### Step 1: Configure Environment
```bash
cd /workspace/dalizebo-stack
cp .env.example .env
nano .env  # Edit ALL passwords and API keys
```

**Critical values to set:**
- `GRAFANA_ADMIN_PASSWORD`
- `NEXTCLOUD_ADMIN_PASSWORD`
- `ADMIN_TOKEN` (Vaultwarden)
- `DB_PASSWORD` (shared database password)
- `STRIPE_SECRET_KEY`, `OZOW_*`, `CAPITEC_*` keys
- `JWT_SECRET`, `SUPABASE_*` keys

### Step 2: Deploy Stack
```bash
./deploy.sh
```

### Step 3: Verify Deployment
```bash
docker compose ps
docker compose logs -f traefik  # Check proxy logs
```

---

## 🌐 DNS Configuration

Create these DNS records for `dalizebo.co.za`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 2.28.6.68 | 3600 |
| A | www | 2.28.6.68 | 3600 |
| A | cockpit | 2.28.6.68 | 3600 |
| A | office | 2.28.6.68 | 3600 |
| A | vault | 2.28.6.68 | 3600 |
| A | chat | 2.28.6.68 | 3600 |
| A | erp | 2.28.6.68 | 3600 |
| A | studio | 2.28.6.68 | 3600 |
| A | git | 2.28.6.68 | 3600 |
| A | n8n | 2.28.6.68 | 3600 |
| A | status | 2.28.6.68 | 3600 |
| CNAME | docs | office.dalizebo.co.za | 3600 |

**Recommended:** Enable Cloudflare Proxy (orange cloud) for SSL and DDoS protection.

---

## 🔒 Security Hardening

### Firewall Rules (UFW)
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (SSL redirect)
ufw allow 443/tcp   # HTTPS
ufw allow 2222/tcp  # Git SSH
ufw enable
```

### Post-Deployment Checklist
1. ✅ Change ALL default passwords in `.env`
2. ✅ Generate new `ADMIN_TOKEN` for Vaultwarden
3. ✅ Configure Cloudflare DNS-01 challenge if using Cloudflare
4. ✅ Set up 2FA on Nextcloud, Gitea, Grafana
5. ✅ Restrict Vaultwarden signup (`SIGNUP_ALLOWED=false`)
6. ✅ Configure backup encryption key

---

## 💾 Storage Management

### Automatic Safeguards (Built-in)
- **Log Rotation**: 10MB max per file, 3 files retained
- **Auto-Prune**: Runs hourly when disk > 85% full
- **Backup Retention**: 30 days (configurable)
- **Database Limits**: Prometheus 15-day retention

### Manual Maintenance Commands
```bash
# Check disk usage
df -h

# View container storage
docker system df

# Manual prune (dry-run)
docker system prune --volumes --filter "until=24h"

# Check specific volume size
du -sh /workspace/dalizebo-stack/data/*
```

---

## 📊 Monitoring & Alerts

### Access Dashboards
- **Grafana**: https://cockpit.dalizebo.co.za
- **Uptime Kuma**: https://status.dalizebo.co.za

### Configure Telegram Alerts (Pillar 1)
1. Create Telegram bot via @BotFather
2. Add webhook URL to Grafana notification channels
3. Set alert rules for:
   - CPU > 80% for 5min
   - Memory > 85%
   - Disk > 80%
   - Container restarts > 3/hour

---

## 🔄 Updates & Maintenance

### Update All Services
```bash
cd /workspace/dalizebo-stack
docker compose pull
docker compose up -d --force-recreate
```

### Update Single Service
```bash
docker compose pull [service-name]
docker compose up -d [service-name]
```

### Backup Now
```bash
docker exec dalizebo-backup-runner /scripts/backup.sh
```

### Restore from Backup
```bash
# Stop services
docker compose down

# Restore volumes
tar -xzf backups/latest-backup.tar.gz -C /workspace/dalizebo-stack/data/

# Restart
docker compose up -d
```

---

## 🆘 Troubleshooting

### SSL Certificates Not Issuing
```bash
# Check Traefik logs
docker compose logs traefik

# Force certificate renewal
docker exec dalizebo-traefik traefik sendmetrics --logLevel=DEBUG
```

### Database Connection Errors
```bash
# Check DB health
docker compose ps postgres

# View DB logs
docker compose logs postgres

# Restart DB
docker compose restart postgres
```

### High Disk Usage
```bash
# Run immediate prune
docker system prune -af --volumes

# Find large files
find /workspace/dalizebo-stack -type f -size +100M -exec ls -lh {} \;
```

### Service Won't Start
```bash
# Check logs
docker compose logs [service-name]

# Validate config
docker compose config

# Check resource limits
docker stats
```

---

## 📞 Support & Resources

- **Documentation**: https://docs.dalizebo.co.za (Outline)
- **Status Page**: https://status.dalizebo.co.za
- **Git Repository**: https://git.dalizebo.co.za
- **Emergency Contacts**: Stored in Vaultwarden

---

## 🎯 Next Steps After Deployment

1. **Day 1**: Change all passwords, configure DNS, enable Cloudflare
2. **Day 2**: Set up ERPNext company profile, import products
3. **Day 3**: Configure payment gateways (Stripe, Ozow, Capitec)
4. **Week 1**: Deploy Next.js storefront, test checkout flows
5. **Week 2**: Train AI agent on product catalog, enable auto-publishing
6. **Month 1**: Review analytics, optimize ROAS, scale infrastructure

---

*Generated for Dalizebo.co.za - 10 Pillars Full Stack v1.0*
