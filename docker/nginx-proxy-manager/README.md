# Modern Full Stack for dalizebo.co.za

Complete enterprise-grade Docker stack with reverse proxy, monitoring, security, databases, and DevOps tools for VPS 2.28.6.68.

## 🏗️ Architecture Overview

This modern full-stack deployment includes **30+ services** organized by function:

### Core Infrastructure
- **Nginx Proxy Manager** - Primary reverse proxy with SSL management
- **Traefik v3** (optional) - Alternative modern reverse proxy
- **Watchtower** - Automatic container updates

### Monitoring & Observability (Profile: `monitoring`)
- **Uptime Kuma** - Service monitoring & status pages
- **Grafana** - Advanced metrics visualization
- **Prometheus** - Metrics collection & alerting
- **Node Exporter** - System metrics
- **Loki** - Log aggregation
- **Promtail** - Log shipper
- **Dozzle** - Real-time container log viewer

### Security (Profile: `security`)
- **Fail2Ban** - Intrusion prevention
- **CrowdSec** - Modern IPS/IDS
- **Vaultwarden** - Self-hosted password manager (Bitwarden-compatible)

### Databases (Profile: `databases`)
- **PostgreSQL 16** - Primary relational database
- **MariaDB 11** - Alternative MySQL-compatible database
- **MongoDB 7** - NoSQL document database
- **Redis 7** - In-memory cache & message broker
- **PgAdmin** - PostgreSQL administration UI
- **Adminer** - Universal database manager
- **Redis Commander** - Redis GUI
- **Mongo Express** - MongoDB web interface

### DevOps Tools (Profile: `devops`)
- **Portainer** - Docker management UI
- **VS Code Server** - Web-based IDE
- **Gitea** - Self-hosted Git service
- **Drone CI** - Continuous Integration platform

### Networking (Profile: `networking`)
- **WireGuard** - VPN server
- **Cloudflared** - Cloudflare Tunnel

### Backup (Profile: `backup`)
- **BorgBackup** - Deduplicating backup system

### Utilities
- **File Browser** - Web-based file manager

## 🚀 Quick Start

### 1. Navigate to Directory
```bash
cd /workspace/docker/nginx-proxy-manager
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
nano .env  # Edit with secure passwords
```

**⚠️ CRITICAL**: Replace ALL `CHANGE_ME_*` values with strong, unique passwords!

### 3. Deploy Core Services
```bash
./deploy.sh
```

Or manually:
```bash
docker compose up -d
```

### 4. Deploy Additional Profiles (Optional)

**Monitoring Stack:**
```bash
docker compose --profile monitoring up -d
```

**Security Services:**
```bash
docker compose --profile security up -d
```

**Database GUIs:**
```bash
docker compose --profile databases up -d
```

**DevOps Tools:**
```bash
docker compose --profile devops up -d
```

**All Services:**
```bash
docker compose --profile monitoring --profile security --profile databases --profile devops up -d
```

## 📊 Service Access Matrix

| Service | Port | Profile | URL | Default Credentials |
|---------|------|---------|-----|---------------------|
| Nginx Proxy Manager | 81 | core | http://2.28.6.68:81 | admin@example.com / changeme |
| Portainer | 9000 | core | http://2.28.6.68:9000 | Set on first login |
| Uptime Kuma | 3001 | core | http://2.28.6.68:3001 | Set on first login |
| File Browser | 8080 | core | http://2.28.6.68:8080 | admin / admin |
| Dozzle | 8082 | monitoring | http://2.28.6.68:8082 | None (open) |
| Grafana | 3000 | monitoring | http://2.28.6.68:3000 | admin / changeme_grafana |
| PgAdmin | 5050 | databases | http://2.28.6.68:5050 | admin@dalizebo.co.za / changeme_pgadmin |
| Adminer | 8083 | databases | http://2.28.6.68:8083 | See DB credentials |
| Mongo Express | 8084 | databases | http://2.28.6.68:8084 | admin / changeme_mongo_ui |
| Redis Commander | 8085 | databases | http://2.28.6.68:8085 | admin / changeme_redis_ui |
| VS Code Server | 8086 | devops | http://2.28.6.68:8086 | Password from .env |
| Gitea | 3002 | devops | http://2.28.6.68:3002 | Set on first login |
| Drone CI | 8087 | devops | http://2.28.6.68:8087 | GitHub OAuth required |
| Vaultwarden | 8088 | security | http://2.28.6.68:8088 | Set on first login |
| Traefik Dashboard | 8080 | advanced | http://2.28.6.68:8080 | None (configure host) |

## 🔐 Security Checklist

1. **Immediately After Deployment:**
   - [ ] Edit `.env` with strong passwords (32+ chars for DBs, 64+ for tokens)
   - [ ] Change all default service passwords
   - [ ] Enable 2FA on all services that support it
   - [ ] Configure firewall (see below)

2. **Firewall Configuration:**
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 81/tcp    # NPM Admin
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Uptime Kuma (optional)
sudo ufw allow 9000/tcp  # Portainer (optional, internal only recommended)
sudo ufw enable

# Block unnecessary ports after setup
sudo ufw deny 8080/tcp   # File Browser (use NPM proxy instead)
sudo ufw deny 3000/tcp   # Grafana (use NPM proxy instead)
```

3. **DNS Configuration:**
```
Type | Name                    | Value      | Purpose
-----|-------------------------|------------|------------------
A    | @                       | 2.28.6.68  | Main domain
A    | www                     | 2.28.6.68  | WWW subdomain
A    | *                       | 2.28.6.68  | Wildcard (optional)
A    | proxy                   | 2.28.6.68  | NPM dashboard
A    | status                  | 2.28.6.68  | Uptime Kuma
A    | grafana                 | 2.28.6.68  | Grafana
A    | portainer               | 2.28.6.68  | Portainer
A    | vault                   | 2.28.6.68  | Vaultwarden
A    | git                     | 2.28.6.68  | Gitea
A    | code                    | 2.28.6.68  | VS Code Server
```

## 🛠️ Common Operations

### View Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f nginx-proxy-manager
docker compose logs -f grafana
```

### Restart Services
```bash
# Single service
docker compose restart postgres

# All services
docker compose restart
```

### Update All Containers
```bash
docker compose pull
docker compose up -d
docker image prune -f
```

### Backup Data
```bash
# Create backup archive
tar -czf backup-$(date +%Y%m%d).tar.gz data/ letsencrypt/ .env

# Backup PostgreSQL
docker exec postgres pg_dumpall -U admin > postgres-backup-$(date +%Y%m%d).sql

# Backup MongoDB
docker exec mongodb mongodump --out=/tmp/mongodb-backup
```

### Resource Management
```bash
# View resource usage
docker stats

# Prune unused resources
docker system prune -a --volumes
```

## 📈 Monitoring Setup

### Grafana + Prometheus + Loki Stack

1. Deploy monitoring profile:
```bash
docker compose --profile monitoring up -d
```

2. Access Grafana at http://2.28.6.68:3000
   - Username: `admin`
   - Password: From `.env`

3. Add data sources in Grafana:
   - Prometheus: `http://prometheus:9090`
   - Loki: `http://loki:3100`

4. Import dashboards:
   - Docker containers: ID 11449
   - Node Exporter: ID 1860
   - PostgreSQL: ID 9628

### Uptime Kuma Setup

1. Access http://2.28.6.68:3001
2. Create admin account
3. Add monitors for each service
4. Configure notifications (email, Telegram, Discord, Slack)
5. Create public status page

## 🔒 Security Hardening

### Enable Fail2Ban
```bash
docker compose --profile security up -d fail2ban
```

Configure jails in `data/fail2ban-config/jail.local`:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-proxy-manager]
enabled = true
port = http,https
filter = nginx-proxy-manager
logpath = /var/log/npm/*.log
```

### Enable CrowdSec
```bash
docker compose --profile security up -d crowdsec
```

Register with CrowdSec hub:
```bash
docker exec crowdsec cscli register
```

### Vaultwarden (Password Manager)
```bash
docker compose --profile security up -d vaultwarden
```

Access at http://2.28.6.68:8088 and create your master password.

## 💾 Backup Strategy

### Automated Daily Backups

Create `backup-cron.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
docker exec postgres pg_dumpall -U admin > $BACKUP_DIR/postgres-$DATE.sql

# MongoDB backup
docker exec mongodb mongodump --archive=$BACKUP_DIR/mongodb-$DATE.archive

# Full stack backup
tar -czf $BACKUP_DIR/full-$DATE.tar.gz data/ letsencrypt/

# Keep 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /workspace/docker/nginx-proxy-manager/backup-cron.sh
```

### Restore from Backup

```bash
# Stop services
docker compose down

# Extract backup
tar -xzf backup-YYYYMMDD.tar.gz

# Restore PostgreSQL
docker compose up -d postgres
sleep 10
cat postgres-backup-YYYYMMDD.sql | docker exec -i postgres psql -U admin

# Start all services
docker compose up -d
```

## 🎯 Production Recommendations

### Resource Allocation
Minimum VPS specs for full stack:
- **CPU**: 4-8 cores
- **RAM**: 8-16 GB
- **Storage**: 100GB+ SSD
- **Bandwidth**: Unlimited or high limit

### Performance Tuning

1. **Docker daemon** (`/etc/docker/daemon.json`):
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

2. **PostgreSQL tuning** (in `.env` or custom config):
```
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 16MB
```

3. **Redis optimization**:
Already configured with 256MB max memory and LRU eviction.

### High Availability

For production HA:
1. Set up database replication
2. Use external object storage for backups
3. Configure load balancer
4. Implement health checks
5. Set up monitoring alerts

## 🆘 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker compose logs [service-name]
df -h  # Check disk space
docker stats  # Check resource usage
```

**Port conflicts:**
```bash
sudo netstat -tulpn | grep :[port]
sudo lsof -i :[port]
```

**Database connection refused:**
```bash
docker compose ps  # Verify database is running
docker exec -it postgres psql -U admin  # Test connection
```

**SSL certificate issues:**
1. Verify DNS propagation: `dig dalizebo.co.za`
2. Check NPM logs: `docker compose logs nginx-proxy-manager`
3. Force renewal in NPM UI

**Out of memory:**
```bash
# Identify memory hogs
docker stats --no-stream

# Increase swap (temporary)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 Support Resources

- **Nginx Proxy Manager**: https://nginxproxymanager.com/guide/
- **Docker Compose**: https://docs.docker.com/compose/
- **Grafana Docs**: https://grafana.com/docs/
- **Prometheus Docs**: https://prometheus.io/docs/
- **Vaultwarden Wiki**: https://github.com/dani-garcia/vaultwarden/wiki

---

**Server**: 2.28.6.68  
**Domain**: dalizebo.co.za  
**Timezone**: Africa/Johannesburg  
**Stack Version**: 2024.1  

🚀 Happy Hosting!
