# 🎯 DEPLOYMENT SYSTEM QUICK START

## 📋 Files Ready for Deployment

### Compose Files
- ✓ `docker-compose.coolify.yml` - For Coolify deployment
- ✓ `docker-compose.server.yml` - For self-hosted with Nginx

### Scripts
- ✓ `build.sh` - Build Docker image
- ✓ `deploy.sh` - Automated local deployment
- ✓ `vps-setup.sh` - Complete VPS setup script
- ✓ `ssh-deploy.sh` - Remote SSH deployment
- ✓ `test-local.sh` - Test locally before pushing

### Configuration
- ✓ `.env.production.local` - Environment variables (update with real values!)
- ✓ `nginx.conf` - Production Nginx config
- ✓ `Dockerfile` - Already optimized multi-stage build
- ✓ `.dockerignore` - Build optimization

### Documentation
- ✓ `DEPLOYMENT_SUMMARY.md` - This overview
- ✓ `VPS_DEPLOYMENT_SETUP.md` - Complete VPS guide
- ✓ `DEPLOYMENT_GUIDE.md` - Detailed instructions
- ✓ `QUICKSTART.md` - Quick reference

---

## 🚀 START HERE

### Option 1: Test Locally First (RECOMMENDED)

```bash
# 1. Update environment with your API keys
nano .env.production.local

# 2. Run local test
chmod +x test-local.sh
./test-local.sh coolify

# 3. Visit http://localhost:3000
```

Expected output:
```
✓ LOCAL TEST COMPLETE
✓ Ready for VPS deployment!
```

---

### Option 2: Deploy to VPS (After Local Test)

```bash
# Prerequisites:
# - VPS with Docker installed (Ubuntu 20.04+)
# - SSH access to VPS
# - Local test passed (Option 1)

# 1. Make deployment scripts executable
chmod +x ssh-deploy.sh

# 2. Deploy to VPS (one command!)
./ssh-deploy.sh root@your-vps-ip coolify

# 3. Wait for completion (2-5 minutes)
# 4. App will be running at http://your-vps-ip:3000
```

---

## ⚙️ Configuration

### CRITICAL: Update Environment Variables

```bash
nano .env.production.local
```

Replace these values:

```env
OPENAI_API_KEY=sk-proj-REPLACE_WITH_YOUR_ACTUAL_KEY
ANTHROPIC_API_KEY=sk-ant-REPLACE_WITH_YOUR_ACTUAL_KEY
SESSION_SECRET=REPLACE_WITH_GENERATED_VALUE  # Run: openssl rand -base64 32
VAULT_ENCRYPTION_KEY=REPLACE_WITH_GENERATED_VALUE
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Secure the file:
```bash
chmod 600 .env.production.local
```

---

## 📊 Architecture

### Coolify Setup
```
Your VPS
├── Docker Engine
├── Imperial Codex App Container (port 3000)
└── Coolify Dashboard (port 3001)
```

Access: `http://your-vps-ip:3000`

### Self-Hosted Server Setup
```
Your VPS
├── Docker Engine
├── Nginx Container (ports 80, 443)
│   └── Reverse Proxy → Imperial Codex (port 3000)
└── Imperial Codex App Container (internal)
```

Access: `https://your-domain.com`

---

## 🔧 Commands

### Before Deployment

```bash
chmod +x build.sh deploy.sh test-local.sh vps-setup.sh ssh-deploy.sh
./test-local.sh coolify
```

### Deployment

```bash
./ssh-deploy.sh root@192.168.1.100 coolify
# OR
./ssh-deploy.sh ubuntu@example.com server /opt/imperial-codex
```

### After Deployment

```bash
# Check status
ssh root@your-vps-ip "docker ps"

# View logs
ssh root@your-vps-ip "docker logs -f imperial-codex"

# Restart
ssh root@your-vps-ip "docker compose -f /opt/imperial-codex/docker-compose.coolify.yml restart"

# Stop
ssh root@your-vps-ip "docker compose -f /opt/imperial-codex/docker-compose.coolify.yml down"
```

---

## ✅ Deployment Checklist

- [ ] Updated `.env.production.local` with real API keys
- [ ] Generated SESSION_SECRET and VAULT_ENCRYPTION_KEY
- [ ] Set file permissions: `chmod 600 .env.production.local`
- [ ] Tested locally: `./test-local.sh coolify` ✓
- [ ] VPS ready with Docker installed
- [ ] SSH access working
- [ ] Scripts executable: `chmod +x *.sh`
- [ ] Run deployment: `./ssh-deploy.sh root@host coolify`
- [ ] Verify: `curl http://your-vps-ip:3000/health`

---

## 🎓 Key Features

✓ **Production-ready**: Multi-stage Docker builds, security hardened
✓ **Automated**: One-command deployment script
✓ **Scalable**: Resource limits, horizontal ready
✓ **Secure**: Non-root user, read-only filesystem, SSL/TLS
✓ **Monitored**: Health checks, logging, auto-restart
✓ **Optimized**: Gzip compression, asset caching, rate limiting

---

## 🆘 Help

| Problem | Solution |
|---------|----------|
| "Port 3000 already in use" | Change port in compose file |
| "Docker not installed" | `curl -fsSL https://get.docker.com \| sudo sh` |
| "SSH connection failed" | Check SSH key and host, verify firewall |
| "Build takes too long" | First build is slow, future builds use cache |
| "Application won't start" | Check logs: `docker logs imperial-codex` |

---

## 📚 Documentation

- **Getting Started**: Start with `QUICKSTART.md`
- **Complete Setup**: See `VPS_DEPLOYMENT_SETUP.md`
- **Troubleshooting**: Check `DEPLOYMENT_GUIDE.md`
- **Overview**: Read `DEPLOYMENT_SUMMARY.md`

---

## 🎯 Next Steps

1. **Now**: `nano .env.production.local` - Update with your API keys
2. **Next**: `./test-local.sh coolify` - Test locally
3. **Then**: `./ssh-deploy.sh root@host coolify` - Deploy to VPS
4. **Finally**: Visit `http://your-vps-ip:3000` - Access your app!

---

**Questions?** Check the documentation files or review the deployment guide.

**Ready?** Let's deploy! 🚀
