# 🚀 IMPERIAL CODEX - COMPLETE DEPLOYMENT SETUP

## Executive Summary

You now have a **production-ready Docker deployment system** for Imperial Codex supporting both:

1. **Coolify** (Managed Docker UI) - Easiest option
2. **Self-Hosted Server** (Full control with Nginx) - Best for production

All files are ready to deploy immediately.

---

## 📦 What Was Created

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.production.local` | Environment variables (secrets, API keys) |
| `docker-compose.coolify.yml` | Coolify-optimized compose setup |
| `docker-compose.server.yml` | Full stack with Nginx reverse proxy |
| `nginx.conf` | Production-grade reverse proxy config |
| `Dockerfile` | Multi-stage build (already optimized) |
| `.dockerignore` | Build context optimization |

### Scripts

| Script | Purpose |
|--------|---------|
| `build.sh` | Build Docker image locally |
| `deploy.sh` | One-command automated deployment |
| `vps-setup.sh` | Complete VPS setup script |
| `ssh-deploy.sh` | SSH-based remote deployment |
| `test-local.sh` | Verify everything works locally first |

### Documentation

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT_GUIDE.md` | Detailed step-by-step guide |
| `QUICKSTART.md` | Quick reference and common commands |
| `VPS_DEPLOYMENT_SETUP.md` | Complete VPS setup walkthrough |
| `DEPLOYMENT_SUMMARY.md` | This file |

---

## 🎯 Quick Start Guide

### For Testing Locally (Recommended First Step)

```bash
# 1. Edit environment file with your API keys
nano .env.production.local

# 2. Run local test
./test-local.sh coolify

# 3. Access at http://localhost:3000
# 4. Check logs with: docker compose -f docker-compose.coolify.yml logs -f
```

### For Deploying to VPS

#### Prerequisites

- VPS with Docker installed (Ubuntu 20.04+)
- SSH access to VPS
- Domain name (optional but recommended)

#### Auto Deploy (Recommended)

```bash
# 1. Edit environment file
nano .env.production.local

# 2. One-command deployment to VPS
./ssh-deploy.sh root@your-vps-ip coolify
# OR for self-hosted with Nginx:
./ssh-deploy.sh root@your-vps-ip server /opt/imperial-codex

# 3. Wait for completion (2-5 minutes)
# 4. Access your app
```

#### Manual Deploy

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Copy files
mkdir -p /opt/imperial-codex
cd /opt/imperial-codex

# 3. From local machine:
scp -r . root@your-vps-ip:/opt/imperial-codex/

# 4. Back on VPS:
ssh root@your-vps-ip
cd /opt/imperial-codex
bash vps-setup.sh . coolify
```

---

## 🔧 Configuration

### Essential Setup

Before deploying to production, you MUST:

#### 1. Generate Secrets

```bash
# Run these commands locally
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For VAULT_ENCRYPTION_KEY
openssl rand -base64 32  # For CRON_SECRET
```

#### 2. Update `.env.production.local`

Replace all `REPLACE_WITH_*` placeholders:

```bash
# Edit the file
nano .env.production.local

# Key values to update:
OPENAI_API_KEY=sk-proj-your-actual-key
ANTHROPIC_API_KEY=sk-ant-your-actual-key
SESSION_SECRET=your-generated-secret-from-step-1
VAULT_ENCRYPTION_KEY=your-generated-key-from-step-1
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 3. Secure the File

```bash
chmod 600 .env.production.local
```

### Optional but Recommended

- **SSL/TLS Certificates**: For `server` mode (auto-setup in vps-setup.sh)
- **Domain Setup**: Point DNS to your VPS IP
- **Backups**: Configure volume backups
- **Monitoring**: Set up alerts (Docker events, etc.)

---

## 🚀 Deployment Scenarios

### Scenario 1: Coolify (Easiest)

**Best for**: Small teams, new to DevOps

```bash
# Local test
./test-local.sh coolify

# Deploy to VPS
./ssh-deploy.sh root@your-vps-ip coolify

# Access via Coolify dashboard at https://your-vps-ip:3001
# Access app at http://your-vps-ip:3000
```

**Pros**:
- UI dashboard for management
- Easy container management
- Built-in monitoring

**Cons**:
- No Nginx reverse proxy
- Less control over infrastructure

---

### Scenario 2: Self-Hosted Server (Full Control)

**Best for**: Production environments, need SSL/TLS, advanced control

```bash
# Local test
./test-local.sh server

# Deploy to VPS
./ssh-deploy.sh root@your-vps-ip server /opt/imperial-codex

# Access app with Nginx at https://your-vps-ip
```

**Pros**:
- Nginx reverse proxy (SSL/TLS, caching, compression)
- Full control over infrastructure
- Better performance (edge caching)
- Rate limiting, security headers

**Cons**:
- More configuration needed
- Requires SSL certificate setup

---

## 📊 What's Included

### Docker Image Optimization

✓ **Multi-stage build** - Smaller image (~250MB instead of 500MB+)
✓ **Alpine base** - Lightweight Node.js runtime
✓ **Layer caching** - Faster rebuilds
✓ **Non-root user** - Security best practice
✓ **Health checks** - Automatic container restart

### Container Security

✓ **Read-only filesystem** - Prevents accidental modifications
✓ **Dropped capabilities** - Only NET_BIND_SERVICE
✓ **Resource limits** - CPU and memory constraints
✓ **No privileged mode** - Security hardened

### Nginx Features (Server Mode)

✓ **SSL/TLS** - HTTPS support
✓ **HTTP→HTTPS redirect** - Force secure connections
✓ **Gzip compression** - Reduce bandwidth
✓ **Asset caching** - 1-year cache for static files
✓ **Rate limiting** - DDoS protection
✓ **Security headers** - X-Frame-Options, CSP, etc.
✓ **Reverse proxy** - Hide app server, load balancing ready

---

## 🔍 Verification Checklist

After deployment, verify:

```bash
# On VPS or local
docker ps                          # Containers running?
docker compose logs -f             # Any errors?
curl http://localhost:3000/health  # Health endpoint OK?
curl http://localhost:3000         # App loads?
```

### Expected Status

```
CONTAINER ID   IMAGE              STATUS      PORTS
abc123...      imperial-codex     Up 2 mins   0.0.0.0:3000->3000/tcp
def456...      nginx              Up 2 mins   0.0.0.0:80->80/tcp, 443->443/tcp
```

---

## 🆘 Troubleshooting

### Build Failed

```bash
# View full build output
docker build --target runner -t imperial-codex:latest .

# Check Docker logs
docker logs imperial-codex
```

### Container Won't Start

```bash
# View logs
docker compose logs -f imperial-codex

# Check if port is already in use
sudo lsof -i :3000

# Check resources
docker stats
```

### Health Check Failing

```bash
# Test directly
curl -v http://localhost:3000/health

# Check app is listening
netstat -tlnp | grep 3000

# View detailed logs
docker logs --follow imperial-codex
```

### Nginx Issues (Server Mode)

```bash
# Test Nginx config
docker exec nginx nginx -t

# View Nginx logs
docker logs nginx

# Check if backend is reachable
docker exec nginx curl http://imperial-codex:3000
```

See `DEPLOYMENT_GUIDE.md` for more troubleshooting tips.

---

## 📋 Deployment Checklist

Before going to production:

- [ ] Generate secure secrets (SESSION_SECRET, VAULT_ENCRYPTION_KEY, CRON_SECRET)
- [ ] Update `.env.production.local` with real API keys
- [ ] Set file permissions: `chmod 600 .env.production.local`
- [ ] Test locally: `./test-local.sh coolify` or `./test-local.sh server`
- [ ] Verify health endpoint: `curl http://localhost:3000/health`
- [ ] VPS has Docker installed: `ssh user@host 'docker --version'`
- [ ] Run deployment: `./ssh-deploy.sh user@host coolify`
- [ ] Verify on VPS: `ssh user@host 'docker ps'`
- [ ] Configure SSL/TLS if using server mode
- [ ] Point domain DNS to VPS IP
- [ ] Update `NEXT_PUBLIC_APP_URL` in `.env.production.local`
- [ ] Set up firewall rules
- [ ] Configure backups
- [ ] Enable monitoring

---

## 🎓 Key Concepts

### Docker Compose

Defines all services and their configuration:
- Imperial Codex app container
- Nginx reverse proxy (server mode)
- Networks and volumes
- Resource limits
- Restart policies
- Health checks

### Environment Variables

Configuration passed to containers:
- **Secrets**: Never commit to git
- **Development**: Use `.env.local`
- **Production**: Use `.env.production.local`
- **Sensitive data**: Store in vault service (vault/ directory)

### Volumes

Persistent storage:
- `core/` - Read-only app data
- `vault/` - Read-only secrets
- `rituals/` - Read-only workflows
- `app-cache` - Named volume for Next.js cache

### Health Checks

Docker monitors container health:
- Tests HTTP endpoint every 30 seconds
- Retries 3 times with 5-second timeout
- Auto-restarts if unhealthy
- 10-second startup grace period

---

## 📚 Next Steps

1. **Read** `VPS_DEPLOYMENT_SETUP.md` for complete step-by-step guide
2. **Test Locally**: Run `./test-local.sh coolify` first
3. **Deploy to VPS**: Run `./ssh-deploy.sh user@host coolify`
4. **Configure Domain**: Point DNS to your VPS
5. **Set Up Monitoring**: Use Docker events or external monitoring
6. **Automate Updates**: Use CI/CD (GitHub Actions, GitLab CI)
7. **Schedule Backups**: Backup volumes regularly

---

## 🔗 Useful Commands

### Local Development

```bash
./build.sh                                    # Build image
./test-local.sh coolify                       # Test locally
docker compose -f docker-compose.coolify.yml logs -f
docker compose -f docker-compose.coolify.yml ps
```

### VPS Management (via SSH)

```bash
ssh root@your-vps-ip
docker ps                                     # View containers
docker compose logs -f                        # View logs
docker compose restart imperial-codex         # Restart app
docker stats                                  # View resource usage
```

### Updates

```bash
cd /opt/imperial-codex
git pull origin main
./build.sh
docker compose -f docker-compose.coolify.yml up -d
```

---

## 🔐 Security Best Practices

1. **Secrets Management**
   - Generate unique secrets for each environment
   - Use 32+ character random strings
   - Rotate every 90 days
   - Never commit to git

2. **File Permissions**
   - `chmod 600 .env.production.local`
   - Restricts access to owner only

3. **Network Security**
   - Enable firewall (UFW)
   - Allow only necessary ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Use VPS security groups

4. **Docker Security**
   - Non-root user in container
   - Read-only root filesystem
   - Dropped capabilities
   - Health checks enabled

5. **HTTPS/TLS**
   - Use Let's Encrypt for free certificates
   - Auto-redirect HTTP to HTTPS
   - Keep certificates updated

---

## 📞 Support & Resources

- **Docker Docs**: https://docs.docker.com
- **Next.js Deployment**: https://docs.docker.com/guides/nextjs/
- **Coolify**: https://coolify.io/docs
- **Let's Encrypt**: https://letsencrypt.org
- **VPS Providers**:
  - DigitalOcean: https://www.digitalocean.com
  - Linode: https://www.linode.com
  - AWS EC2: https://aws.amazon.com/ec2/
  - Vultr: https://www.vultr.com

---

## 📝 Notes

- **Build time**: First build takes 2-5 minutes. Subsequent builds use caching (30-60 seconds).
- **Disk space**: Image is ~250MB, containers use additional space for cache/logs.
- **Memory**: Allocate 2GB minimum, 4GB+ recommended for production.
- **SSL certificates**: Get free certificates from Let's Encrypt or use self-signed for testing.

---

**Status**: ✓ Ready for deployment

**Last Updated**: $(date)

**Version**: 1.0.0
