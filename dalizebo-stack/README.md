# Dalizebo 10 Pillars Full Stack Deployment

## 📋 Overview
Complete deployment package for dalizebo.co.za implementing all 10 Engineering Pillars with storage governance and security.

## 🚀 Quick Start (On VPS 2.28.6.68)

```bash
# 1. Navigate to stack directory
cd /workspace/dalizebo-stack

# 2. Review and update .env with your secrets
nano .env

# 3. Run deployment
./deploy.sh
```

## 📁 Files Included

| File | Purpose |
|------|---------|
| `docker-compose.yml` | All 25+ services across 10 pillars |
| `.env` | Environment variables (generate with `./generate-env.sh`) |
| `deploy.sh` | Automated deployment script |
| `generate-env.sh` | Secure password generation |
| `dns-records.txt` | Required DNS configuration |
| `configs/` | Service configurations |
| `scripts/` | Maintenance utilities |

## 🌐 Required DNS Records

Add these to Cloudflare for dalizebo.co.za (all pointing to 2.28.6.68):

- `@` (root domain)
- `www`
- `cockpit` - Executive Dashboard (Grafana + Prometheus)
- `status` - Uptime Monitoring
- `office` - Nextcloud
- `vault` - Password Manager
- `chat` - Customer Support (Chatwoot)
- `erp` - ERPNext
- `n8n` - Automation
- `git` - Gitea Repository
- `ai` - Ollama AI Models

## 🔑 Default Credentials (CHANGE IMMEDIATELY)

After deployment, check `.env` file for passwords:
- Grafana: `admin` / `[GRAFANA_ADMIN_PASSWORD]`
- Nextcloud: `admin` / `[NEXTCLOUD_ADMIN_PASSWORD]`
- n8n: `admin` / `[N8N_BASIC_AUTH_PASSWORD]`
- Gitea: `admin` / `[GITEA_ADMIN_PASSWORD]`

## 💾 Data Persistence

All data stored in `/workspace/dalizebo-stack/data/`:
- PostgreSQL databases
- MariaDB databases
- Redis cache
- Nextcloud files
- Vaultwarden vault
- Chatwoot conversations
- n8n workflows
- Gitea repositories

## 🔒 Security Features

1. **Traefik v3** - Reverse proxy with automatic SSL via Let's Encrypt
2. **CrowdSec** - Intrusion detection and IP blocking
3. **Log Rotation** - Max 10MB per log file, 3 files retained
4. **Storage Monitor** - Auto-prune at 85% disk usage
5. **Network Segmentation** - Internal network for databases

## 📊 Storage Governance

Built-in safeguards prevent disk full scenarios:
- Automatic Docker prune when disk > 85%
- Log rotation (10MB max, 3 files)
- Prometheus retention: 15 days
- Backup retention: 30 days

## 🛠️ Maintenance Commands

```bash
# View service status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Clean up unused resources
docker system prune -af

# Backup all data
./scripts/backup.sh

# Check disk usage
df -h
```

## ⚠️ Important Notes

1. **Payment Gateway Keys**: You MUST update these in `.env` before processing transactions:
   - `STRIPE_SECRET_KEY`
   - `OZOW_PRIVATE_KEY`
   - `CAPITEC_API_KEY`

2. **Cloudflare Setup**: Enable Cloudflare proxy (orange cloud) for automatic SSL

3. **First Login**: Change all default passwords immediately after first login

4. **Backups**: Configure S3 credentials for off-site backups

## 🆘 Troubleshooting

### SSL Certificates Not Issuing
- Ensure DNS records are propagated
- Check Cloudflare SSL mode is set to "Full" or "Full (strict)"
- View Traefik logs: `docker compose logs traefik`

### Services Not Starting
- Check disk space: `df -h`
- Check memory: `free -m`
- View logs: `docker compose logs [service-name]`

### Database Connection Errors
- Wait 30 seconds for databases to initialize
- Check database logs: `docker compose logs postgres`

## 📞 Support

For issues related to:
- Payment gateways: Contact Stripe/Ozow/Capitec support
- DNS: Check Cloudflare dashboard
- Docker issues: `docker compose logs`

---
Generated for dalizebo.co.za | 10 Pillars Architecture
