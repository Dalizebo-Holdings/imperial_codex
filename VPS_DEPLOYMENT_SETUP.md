# Complete VPS Deployment Setup

## Overview

This guide walks you through deploying Imperial Codex to a VPS using Docker and either **Coolify** (managed) or **self-hosted server** (full control).

---

## Prerequisites

- **VPS** (DigitalOcean, Linode, AWS EC2, Vultr, etc.) with:
  - Ubuntu 20.04+ or similar Linux distro
  - 2GB RAM minimum (4GB+ recommended)
  - 20GB disk space minimum
  - SSH access
- **Domain name** (optional but recommended for production)
- **Local machine** with: git, docker, bash

---

## Step 1: Prepare Your Local Environment

### 1.1 Create Production Secrets

Before deploying, generate secure secrets:

```bash
# Generate SESSION_SECRET (32+ chars)
openssl rand -base64 32

# Generate VAULT_ENCRYPTION_KEY (32+ chars)
openssl rand -base64 32

# Generate CRON_SECRET (32+ chars)
openssl rand -base64 32
```

Save these somewhere safe - you'll need them in `.env.production.local`.

### 1.2 Update Environment File

Edit `.env.production.local`:

```bash
# Edit with your actual values
nano .env.production.local

# CRITICAL: Add your API keys:
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - SESSION_SECRET (from step 1.1)
# - VAULT_ENCRYPTION_KEY (from step 1.1)
# - NEXT_PUBLIC_APP_URL (your domain)

# Set secure permissions
chmod 600 .env.production.local
```

### 1.3 Verify Local Build Works

```bash
# Build locally to catch errors early
./build.sh

# Verify image exists
docker images | grep imperial-codex
```

---

## Step 2: Set Up Your VPS

### 2.1 Connect to VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Or with specific user
ssh ubuntu@your-vps-ip
```

### 2.2 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose --version
```

### 2.3 Create Deployment Directory

```bash
# Create directory
mkdir -p /opt/imperial-codex
cd /opt/imperial-codex

# Or use sudo if you don't have permission
sudo mkdir -p /opt/imperial-codex
sudo chown $USER:$USER /opt/imperial-codex
cd /opt/imperial-codex
```

---

## Step 3: Deploy to VPS

### Option A: Automated Deployment (Recommended)

#### 3A.1 Run Remote Setup Script

From your **local machine**:

```bash
# Deploy to Coolify
./ssh-deploy.sh root@your-vps-ip coolify

# OR deploy to self-hosted server with Nginx
./ssh-deploy.sh root@your-vps-ip server /opt/imperial-codex
```

This script:
- Tests SSH connection
- Copies all files to VPS
- Runs the setup script
- Builds Docker image
- Starts containers
- Verifies health

#### 3A.2 Monitor Deployment

```bash
# Watch deployment progress via SSH
ssh root@your-vps-ip "docker compose -f /opt/imperial-codex/docker-compose.coolify.yml logs -f"
```

---

### Option B: Manual Deployment

#### 3B.1 Copy Files to VPS

From your **local machine**:

```bash
# Copy entire project
scp -r . root@your-vps-ip:/opt/imperial-codex/

# Or use rsync for faster sync
rsync -avz --exclude='.git' --exclude='node_modules' \
  ./ root@your-vps-ip:/opt/imperial-codex/
```

#### 3B.2 Run Setup on VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to deploy directory
cd /opt/imperial-codex

# Run setup script
bash vps-setup.sh . coolify
# OR for self-hosted with Nginx:
bash vps-setup.sh . server
```

---

## Step 4: Verify Deployment

### 4.1 Check Container Status

```bash
# SSH into VPS
ssh root@your-vps-ip

# View running containers
docker ps

# Check app logs
docker logs imperial-codex

# Or with compose
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml ps
```

### 4.2 Test Health Endpoint

```bash
# From VPS
curl http://localhost:3000/health

# Or from local machine
curl http://your-vps-ip:3000/health
```

### 4.3 Access Application

- **Direct**: `http://your-vps-ip:3000`
- **With domain** (after DNS setup): `http://your-domain.com:3000`
- **With Nginx/HTTPS** (server mode): `https://your-domain.com`

---

## Step 5: Configure for Production (Optional)

### 5.1 Set Up SSL/TLS (For Server Mode)

```bash
# SSH into VPS
ssh root@your-vps-ip

cd /opt/imperial-codex

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get Let's Encrypt certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to app directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem

# Fix permissions
sudo chown $USER:$USER certs/*

# Restart Nginx
docker compose -f docker-compose.server.yml restart nginx
```

### 5.2 Configure Domain DNS

Point your domain to your VPS IP:

- **A Record**: `your-domain.com` → `your-vps-ip`
- **CNAME Record**: `www.your-domain.com` → `your-domain.com`

Then update `.env.production.local`:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Restart app:

```bash
docker compose -f docker-compose.coolify.yml restart imperial-codex
```

### 5.3 Set Up Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 5.4 Configure Backup (Optional)

```bash
# SSH into VPS
ssh root@your-vps-ip

# Create backup script
cat > /opt/imperial-codex/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/imperial-codex/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz \
  -C /opt/imperial-codex core vault rituals
echo "Backup complete: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
EOF

# Make executable
chmod +x /opt/imperial-codex/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add line: 0 2 * * * /opt/imperial-codex/backup.sh
```

---

## Ongoing Management

### View Logs

```bash
# Real-time logs
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml logs -f

# Last 50 lines
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml logs --tail=50
```

### Restart Application

```bash
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml restart imperial-codex

# Or full restart
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml down
docker compose -f /opt/imperial-codex/docker-compose.coolify.yml up -d
```

### Update Application

```bash
cd /opt/imperial-codex

# Pull latest code
git pull origin main

# Rebuild image
./build.sh

# Restart
docker compose -f docker-compose.coolify.yml up -d
```

### Monitor Resources

```bash
# View resource usage
docker stats

# Check disk usage
du -sh /opt/imperial-codex
docker system df
```

### Clean Up

```bash
# Remove unused containers/images
docker system prune -a

# Remove unused volumes
docker volume prune

# View volume usage
docker volume ls
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker logs imperial-codex

# Check container status
docker ps -a

# Restart container
docker restart imperial-codex
```

### Port 3000 already in use

```bash
# Find process using port
sudo lsof -i :3000

# Or change port in compose file
# ports:
#   - "8000:3000"
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase memory limit in compose file
# deploy:
#   resources:
#     limits:
#       memory: 4G
```

### Nginx 502 error (server mode)

```bash
# Check if app container is running
docker ps | grep imperial-codex

# Check app logs
docker logs imperial-codex

# Verify Nginx config
docker exec nginx nginx -t
```

### SSL certificate issues

```bash
# Check certificate expiration
sudo certbot renew --dry-run

# Check Nginx SSL config
docker exec nginx cat /etc/nginx/nginx.conf | grep ssl
```

---

## Security Best Practices

- ✓ Use strong, unique secrets (32+ characters)
- ✓ Never commit `.env.production.local` to git
- ✓ Use HTTPS/TLS in production
- ✓ Keep Docker and system updated
- ✓ Use non-root user in containers
- ✓ Enable firewall rules
- ✓ Regular backups
- ✓ Monitor logs and errors
- ✓ Rotate API keys periodically
- ✓ Use environment-specific configs

---

## Performance Optimization

- **Enable gzip**: Already in nginx.conf
- **Asset caching**: 1-year cache for static files
- **Rate limiting**: DDoS protection enabled
- **Multi-stage builds**: Smaller images
- **Named volumes**: Better I/O performance
- **Log rotation**: Prevents disk fill
- **Resource limits**: CPU and memory constraints

---

## Support & Resources

- **Docker Docs**: https://docs.docker.com
- **Next.js Deployment**: https://docs.docker.com/guides/nextjs/
- **Coolify Docs**: https://coolify.io/docs
- **VPS Providers**:
  - DigitalOcean: https://www.digitalocean.com
  - Linode: https://www.linode.com
  - AWS EC2: https://aws.amazon.com/ec2
  - Vultr: https://www.vultr.com

---

## Deployment Checklist

- [ ] Generate secure secrets (SESSION_SECRET, VAULT_ENCRYPTION_KEY, CRON_SECRET)
- [ ] Update .env.production.local with real values
- [ ] Test build locally (`./build.sh`)
- [ ] VPS has Docker installed
- [ ] SSH access to VPS works
- [ ] Files copied to VPS `/opt/imperial-codex`
- [ ] Setup script ran successfully
- [ ] Containers are running (`docker ps`)
- [ ] Health check passes (`curl http://localhost:3000/health`)
- [ ] Application accessible via browser
- [ ] SSL certificates installed (if using server mode)
- [ ] Domain DNS configured (if using domain)
- [ ] Firewall rules set
- [ ] Backups configured
- [ ] Monitoring/alerting enabled
- [ ] Documentation reviewed
