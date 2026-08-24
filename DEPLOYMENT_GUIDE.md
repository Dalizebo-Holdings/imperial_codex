# Imperial Codex - Deployment Guide

## Overview
This guide covers deploying Imperial Codex to **Coolify** (self-hosted Docker management) and **self-hosted servers** using Docker Compose.

---

## Prerequisites

### For Both Environments:
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum, 4GB+ recommended
- Port 3000 available (3000:3000 for app)
- Port 80/443 available (if using Nginx reverse proxy)

### Environment Files:
Create `.env.production.local` (Coolify) or `.env.production.local` (self-hosted) with:
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
# Add your API keys, database URLs, etc.
```

---

## Deployment Scenarios

### 1. COOLIFY DEPLOYMENT

Coolify is a lightweight, self-hosted Docker management platform. It provides a UI dashboard for managing containers.

#### Setup Steps:

**1.1 Install Coolify on Your Server**
```bash
# SSH into your VPS
ssh user@your-server.com

# Install Coolify (runs on port 3001)
curl -sSL https://get.coool.ify/docker | sh
```

**1.2 Access Coolify Dashboard**
- Open `https://your-server.com:3001`
- Complete initial setup
- Add your Docker host

**1.3 Deploy via Compose File**

Option A: Upload via Coolify UI
- In Dashboard: **Resources → Docker Compose**
- Paste contents of `docker-compose.coolify.yml`
- Click **Deploy**

Option B: Deploy via CLI
```bash
# On your server
docker compose -f docker-compose.coolify.yml up -d
```

**1.4 Configure Environment Variables**
- In Coolify UI: **Resources → Environment**
- Add variables from `.env.production.local`

**1.5 Verify Deployment**
```bash
docker compose -f docker-compose.coolify.yml ps
docker compose -f docker-compose.coolify.yml logs -f
```

Access: `http://your-server.com:3000`

---

### 2. SELF-HOSTED SERVER DEPLOYMENT

Full control via direct Docker Compose on a VPS. Includes optional Nginx reverse proxy.

#### Setup Steps:

**2.1 Prepare Your Server**
```bash
# SSH into your VPS
ssh user@your-server.com

# Create app directory
mkdir -p /opt/imperial-codex
cd /opt/imperial-codex

# Clone your repository or copy files
git clone <your-repo> .
# OR manually copy:
# - Dockerfile
# - docker-compose.server.yml
# - nginx.conf
# - .env.production.local
```

**2.2 Set Up Environment**
```bash
# Create environment file
cat > .env.production.local << 'EOF'
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
# Add your API keys, database URLs, etc.
EOF

chmod 600 .env.production.local
```

**2.3 Build Docker Image**
```bash
# Make build script executable
chmod +x build.sh

# Build image
./build.sh
```

**2.4a Deploy WITHOUT Nginx (Simple)**
```bash
# Start app only
docker compose -f docker-compose.coolify.yml up -d

# Verify
docker compose -f docker-compose.coolify.yml ps
docker compose -f docker-compose.coolify.yml logs -f
```

Access: `http://your-server.com:3000`

**2.4b Deploy WITH Nginx (Recommended for Production)**

Generate SSL certificates (using Let's Encrypt):
```bash
# Create certs directory
mkdir -p certs

# For self-signed cert (testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem

# OR use Let's Encrypt (production)
sudo certbot certonly --standalone -d your-domain.com
# Copy certs:
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/*
```

Start stack with Nginx:
```bash
docker compose -f docker-compose.server.yml up -d

# Verify both services
docker compose -f docker-compose.server.yml ps

# Check logs
docker compose -f docker-compose.server.yml logs -f
```

Access:
- HTTP (redirects to HTTPS): `http://your-server.com`
- HTTPS: `https://your-server.com`

---

## Deployment Script (Automated)

Use the provided `deploy.sh` for one-command deployment:

```bash
# Make executable
chmod +x deploy.sh

# Deploy to Coolify
./deploy.sh coolify

# Deploy to self-hosted server with nginx
./deploy.sh server
```

The script handles:
1. Building the Docker image
2. Stopping old containers
3. Starting new containers
4. Health checks
5. Displaying logs and status

---

## Monitoring & Maintenance

### View Logs
```bash
# Coolify
docker compose -f docker-compose.coolify.yml logs -f

# Self-hosted
docker compose -f docker-compose.server.yml logs -f

# Specific service
docker compose -f docker-compose.server.yml logs -f imperial-codex
```

### Health Check
```bash
# Direct health endpoint
curl http://localhost:3000/health

# Or via Docker
docker compose -f docker-compose.coolify.yml ps
```

### Restart Application
```bash
# Coolify
docker compose -f docker-compose.coolify.yml restart imperial-codex

# Self-hosted
docker compose -f docker-compose.server.yml restart imperial-codex
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild image
./build.sh

# Redeploy
docker compose -f docker-compose.coolify.yml up -d
# OR
docker compose -f docker-compose.server.yml up -d
```

### Storage & Volumes

**Data Persistence:**
- `core/` → read-only volume with app data
- `vault/` → read-only volume with secrets/configs
- `rituals/` → read-only volume with workflows
- `app-cache` → named volume for Next.js cache

**Clean Up (⚠️ careful!)**
```bash
# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune

# Full cleanup
docker system prune -a
```

---

## Production Checklist

- [ ] SSL/TLS certificates installed (for Nginx)
- [ ] `.env.production.local` configured with real values
- [ ] Environment variables secured (not in Dockerfile)
- [ ] Health checks passing
- [ ] Logs accessible and monitored
- [ ] Resource limits set (CPU/memory)
- [ ] Restart policies configured
- [ ] Security: non-root user, read-only root fs, capabilities dropped
- [ ] Backups configured for data volumes
- [ ] Domain DNS pointing to server
- [ ] Firewall rules: 80, 443, 3000 open as needed

---

## Troubleshooting

### Container exits immediately
```bash
docker compose -f docker-compose.server.yml logs imperial-codex
# Check for missing environment variables or build errors
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Or use different port in compose file
# Change ports: ["8000:3000"]
```

### Out of memory
```bash
# Check current usage
docker stats

# Increase memory limit in compose file:
# deploy:
#   resources:
#     limits:
#       memory: 4G
```

### Nginx not proxying correctly
```bash
# Check Nginx config
docker compose -f docker-compose.server.yml exec nginx nginx -t

# View Nginx logs
docker compose -f docker-compose.server.yml logs nginx
```

---

## Performance Tips

1. **Use multi-stage builds** → Smaller images
2. **Enable gzip in Nginx** → Faster delivery
3. **Set proper cache headers** → Reduce bandwidth
4. **Use named volumes** → Better I/O performance
5. **Monitor resource usage** → Adjust limits as needed
6. **Enable log rotation** → Prevent disk fill
7. **Regular updates** → Security patches

---

## Support

- Coolify Docs: https://coolify.io/docs
- Docker Docs: https://docs.docker.com
- Next.js Docker: https://docs.docker.com/guides/nextjs/
