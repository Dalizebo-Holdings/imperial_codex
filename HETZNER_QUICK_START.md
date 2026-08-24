# ⚡ Hetzner Quick Start - 5 Minutes to Live

## 🎯 TL;DR - Fastest Path

### 1. Get Server ($2.50/month)
```
1. Go to https://www.hetzner.cloud
2. Sign up
3. Create server: Ubuntu 22.04, CPX11
4. Add your SSH key
5. Note the IP: 192.0.2.123 (example)
```

### 2. Connect & Setup (2 minutes)
```bash
ssh root@192.0.2.123

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Clone your project
git clone https://github.com/YOUR_USERNAME/imperial-codex.git
cd imperial-codex
```

### 3. Configure (1 minute)
```bash
# Edit environment
nano .env.production.local

# Add your API keys:
# OPENAI_API_KEY=sk-proj-...
# ANTHROPIC_API_KEY=sk-ant-...
# SESSION_SECRET=(generate: openssl rand -base64 32)
# VAULT_ENCRYPTION_KEY=(generate: openssl rand -base64 32)

# Save: Ctrl+X, Y, Enter
chmod 600 .env.production.local
```

### 4. Deploy (1 minute)
```bash
# From your local machine:
chmod +x ssh-deploy.sh
./ssh-deploy.sh root@192.0.2.123 coolify

# Wait 3-5 minutes for build...
```

### 5. Access ✅
```
http://192.0.2.123:3000
```

**Done! Your app is live.** 🚀

---

## 📋 Step-by-Step Checklist

### Phase 1: Hetzner Account (5 min)
- [ ] Go to https://www.hetzner.cloud
- [ ] Click "Sign Up"
- [ ] Enter email, password, verify
- [ ] Add payment method
- [ ] Create project: "Imperial Codex"

### Phase 2: Create Server (2 min)
- [ ] Click "Add Server"
- [ ] Select Ubuntu 22.04
- [ ] Select CPX11 ($2.50/month)
- [ ] Choose location (closest to you)
- [ ] Add your SSH public key
- [ ] Name: imperial-codex
- [ ] Click "Create & Buy Now"
- [ ] **Copy the IP address**

### Phase 3: First Connection (1 min)
```bash
# On your local machine:
ssh root@YOUR_IP_HERE

# You should see: root@imperial-codex:~#
```

### Phase 4: Install Docker (2 min)
```bash
curl -fsSL https://get.docker.com | sudo sh
docker --version  # Verify
```

### Phase 5: Copy Your Project (2 min)
```bash
# From local machine:
ssh deploy@YOUR_IP "git clone https://github.com/YOUR_USER/imperial-codex.git"

# Or use rsync if you haven't committed:
rsync -avz ./ root@YOUR_IP:/root/imperial-codex/
```

### Phase 6: Configure Environment (2 min)
```bash
# SSH to Hetzner
ssh root@YOUR_IP
cd ~/imperial-codex

# Generate secrets first:
openssl rand -base64 32  # Copy this
openssl rand -base64 32  # Copy this
openssl rand -base64 32  # Copy this

# Edit environment
nano .env.production.local

# Replace:
# OPENAI_API_KEY=your-actual-key
# ANTHROPIC_API_KEY=your-actual-key
# SESSION_SECRET=first-generated-value
# VAULT_ENCRYPTION_KEY=second-generated-value
# NEXT_PUBLIC_APP_URL=http://YOUR_IP

# Exit: Ctrl+X, Y, Enter
chmod 600 .env.production.local
```

### Phase 7: Deploy (5 min)
```bash
# From local machine
chmod +x ssh-deploy.sh
./ssh-deploy.sh root@YOUR_IP coolify

# Watch it build... (this takes 2-5 minutes first time)
```

### Phase 8: Verify (1 min)
```bash
# SSH to Hetzner
ssh root@YOUR_IP

# Check status
docker ps

# Test health
curl http://localhost:3000/health
```

### Phase 9: Access App ✅
```
Open browser: http://YOUR_IP:3000
```

---

## 🔑 Important Notes

### SSH Keys vs Password

**Recommended: SSH Key**
- Safer and easier
- Add during server creation
- Then: `ssh root@YOUR_IP` (no password)

**Alternative: Password**
- Check Hetzner email for temporary password
- Then: `ssh root@YOUR_IP` (enter password)

### First Build Takes Time

- First Docker build: 2-5 minutes (npm ci, build)
- Subsequent deploys: 30 seconds (cached layers)
- This is normal!

### Free SSL/TLS (Optional Later)

After domain setup:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
# Copy certs to ~/imperial-codex/certs/
```

---

## 📊 What You'll See

### After `ssh-deploy.sh` completes:

```
✓ Build successful
✓ Containers started
✓ Application is healthy
✓ Status: Running

Access Points:
  • HTTP:  http://192.0.2.123:3000
  • Logs:  docker compose logs -f

Done! 🎉
```

---

## 🆘 Common Issues

### "Connection refused" on http://ip:3000

```bash
# Check if container is running
ssh root@YOUR_IP
docker ps

# Check logs
docker logs imperial-codex

# Restart if needed
docker compose -f docker-compose.coolify.yml restart
```

### "Permission denied" on SSH

```bash
# Make sure SSH key is correct
ssh -v root@YOUR_IP  # Shows debug info

# Or use root password from email
```

### Docker build fails

```bash
# Usually just network timeout, try again:
ssh root@YOUR_IP
cd ~/imperial-codex
./build.sh
```

### Port already in use

```bash
# Change port in docker-compose.coolify.yml:
# ports:
#   - "8000:3000"  # Use 8000 instead

docker compose -f docker-compose.coolify.yml up -d
```

---

## 💾 Useful Commands After Deploy

```bash
# SSH to server
ssh root@YOUR_IP

# View logs (live)
docker logs -f imperial-codex

# Check container status
docker ps

# Check resource usage
docker stats

# Restart app
docker compose -f docker-compose.coolify.yml restart

# Stop app
docker compose -f docker-compose.coolify.yml down

# Update app
cd ~/imperial-codex
git pull
./build.sh
docker compose -f docker-compose.coolify.yml up -d
```

---

## 📈 Upgrade Later (If Needed)

As your traffic grows:

| CPU | RAM | Storage | Price/mo |
|-----|-----|---------|----------|
| CPX11 | 1 | 2GB | 25GB | $2.50 |
| CPX21 | 2 | 4GB | 40GB | $6.00 |
| CPX31 | 2 | 8GB | 80GB | $12.00 |
| CPX41 | 4 | 16GB | 160GB | $24.00 |

In Hetzner dashboard: Stop server → Resize → Larger type → Start

---

## ✅ Final Checklist Before Going Live

- [ ] Hetzner server created and running
- [ ] SSH access working
- [ ] Docker installed
- [ ] Project copied to server
- [ ] `.env.production.local` configured with real API keys
- [ ] Deployment script ran successfully
- [ ] App is accessible at http://YOUR_IP:3000
- [ ] Health check passing: `curl http://ip:3000/health`
- [ ] Logs look clean: `docker logs imperial-codex`
- [ ] Domain configured (optional)
- [ ] SSL set up (optional)

---

## 🎉 You're Done!

Your Imperial Codex is now **LIVE on Hetzner Cloud** for **$2.50/month**!

### What you have:
- ✅ Running production server
- ✅ Docker containerized app
- ✅ Auto-restarting on failure
- ✅ Health checks enabled
- ✅ Secure non-root user
- ✅ Resource limits set
- ✅ Monitoring enabled

### Next (Optional):
- Add domain name ($10-15/year)
- Enable HTTPS (Let's Encrypt, free)
- Set up automated backups
- Configure monitoring alerts
- Scale to multiple servers (Docker Swarm)

**Questions?** Check `HETZNER_DEPLOYMENT.md` for detailed guide.

---

**Total time**: ~15 minutes first time

**Cost**: $2.50/month

**Status**: ✅ Production Ready

🚀 **Welcome to the cloud!**
