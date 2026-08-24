# 🎯 IMPERIAL CODEX - COMPLETE HETZNER SETUP

## You've Got Everything Ready! 

Your complete production deployment system is ready to go live on **Hetzner Cloud** ($2.50/month).

---

## 📦 What You Have

### Docker & Deployment Files ✅
- `Dockerfile` - Multi-stage production build
- `docker-compose.coolify.yml` - Hetzner-ready setup
- `docker-compose.server.yml` - With Nginx (for later)
- `nginx.conf` - Production proxy config
- `.env.production.local` - Environment template (EDIT THIS!)

### Deployment Automation ✅
- `ssh-deploy.sh` - One-command deployment to Hetzner
- `build.sh` - Build Docker image
- `test-local.sh` - Test before pushing
- `vps-setup.sh` - VPS setup automation

### Documentation ✅
- `HETZNER_DEPLOYMENT.md` - Detailed Hetzner guide
- `HETZNER_QUICK_START.md` - 5-minute fast track
- `START_HERE.md` - Quick start overview
- `QUICKSTART.md` - Command reference
- `DEPLOYMENT_SUMMARY.md` - Full feature overview
- Plus 5 more comprehensive guides

---

## 🚀 Deploy in 15 Minutes

### Step 1: Get Hetzner Server (5 min)
```
1. Visit https://www.hetzner.cloud
2. Sign up (free account)
3. Create server: Ubuntu 22.04, CPX11 ($2.50/month)
4. Add your SSH key
5. Note the IP address: e.g., 192.0.2.123
```

### Step 2: Update Configuration (2 min)
```bash
# On your local machine:
nano .env.production.local

# Update these:
OPENAI_API_KEY=sk-proj-your-actual-key
ANTHROPIC_API_KEY=sk-ant-your-actual-key
SESSION_SECRET=generate-with: openssl rand -base64 32
VAULT_ENCRYPTION_KEY=generate-with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://192.0.2.123

# Save: Ctrl+X, Y, Enter
chmod 600 .env.production.local
```

### Step 3: Deploy (1 min)
```bash
# From your local machine:
chmod +x ssh-deploy.sh
./ssh-deploy.sh root@192.0.2.123 coolify

# Wait 3-5 minutes for Docker build...
```

### Step 4: Access App ✅
```
Open browser: http://192.0.2.123:3000
```

**That's it! You're live!** 🎉

---

## 🎓 What Happens Behind the Scenes

When you run `./ssh-deploy.sh root@192.0.2.123 coolify`:

1. **Copies files** to Hetzner via rsync
2. **Builds Docker image** (npm install, next build)
3. **Stops old containers** (if any)
4. **Starts new containers** with docker-compose
5. **Waits for health check** (30 second timeout)
6. **Shows status** (running containers, logs)

All automated. All you do is run one command.

---

## 📊 Your Setup

```
Your Local Machine
├── Code editor (VS Code)
├── Git repository
└── Deploy scripts
       │
       ├─► Test locally: ./test-local.sh coolify
       │
       └─► Deploy to Hetzner: ./ssh-deploy.sh root@IP coolify

                          │
                          ▼

Hetzner Cloud ($2.50/month)
├── Ubuntu 22.04 (1 vCPU, 2GB RAM)
├── Docker Engine
├── Your App Container (Imperial Codex)
│   ├── Node.js 20
│   ├── Next.js
│   └── Running on port 3000
├── Nginx Container (optional later)
└── Health checks & auto-restart
```

---

## 💡 Key Files for Hetzner

| File | Purpose | Edit? |
|------|---------|-------|
| `.env.production.local` | API keys, secrets | ✏️ YES - Essential |
| `docker-compose.coolify.yml` | Container setup | ✓ No need now |
| `Dockerfile` | Build instructions | ✓ No need now |
| `ssh-deploy.sh` | Deploy automation | ✓ No need now |

**Most important:** Update `.env.production.local` with real values!

---

## 🔒 Secrets You Need

Generate these before deploying:

```bash
# Generate 3 random secrets (run locally):
openssl rand -base64 32  # SESSION_SECRET
openssl rand -base64 32  # VAULT_ENCRYPTION_KEY
openssl rand -base64 32  # CRON_SECRET

# Also need:
OPENAI_API_KEY          # From https://platform.openai.com
ANTHROPIC_API_KEY       # From https://console.anthropic.com
```

---

## ✅ Pre-Deployment Checklist

- [ ] Read `HETZNER_QUICK_START.md` (5 min)
- [ ] Generated SESSION_SECRET and VAULT_ENCRYPTION_KEY
- [ ] Updated `.env.production.local` with real API keys
- [ ] Set file permissions: `chmod 600 .env.production.local`
- [ ] Made scripts executable: `chmod +x ssh-deploy.sh`
- [ ] Created Hetzner account
- [ ] Ordered CPX11 server
- [ ] Note IP address
- [ ] SSH key working
- [ ] Ready to deploy!

---

## 📖 Next: Choose Your Starting Point

### 🏃 I'm in a hurry
→ Read: `HETZNER_QUICK_START.md` (5 min)
→ Do: Follow the 5-step checklist
→ Deploy: One command

### 🚀 I want to understand everything
→ Read: `HETZNER_DEPLOYMENT.md` (detailed guide)
→ Do: Follow step-by-step instructions
→ Deploy: Understand each step

### 🔧 I'm technical, give me quick commands
→ Check: `QUICKSTART.md` (command reference)
→ Do: Copy/paste commands
→ Deploy: One command

---

## 🎯 Timeline

| What | Time | Status |
|------|------|--------|
| Create Hetzner account | 5 min | ⏳ Do this first |
| Create server | 2 min | Auto takes 30 sec |
| Install Docker | 2 min | Automated |
| Copy project files | 2 min | Via git or rsync |
| Configure `.env` | 2 min | Edit locally |
| Deploy app | 5 min | First build is slow |
| **Total** | **~18 min** | **Production live!** |

---

## 💰 Costs

| Item | Cost | Notes |
|------|------|-------|
| Server (CPX11) | $2.50/month | 1 vCPU, 2GB RAM, 25GB SSD |
| Bandwidth | Free | 1TB/month included |
| Domain (optional) | $10-15/year | GoDaddy, Namecheap, etc. |
| SSL (optional) | Free | Let's Encrypt |
| Backups (optional) | $0.40/month | Not needed yet |
| **Total** | **$2.50/month** | **Cheapest cloud option** |

---

## 🛠️ After Deployment

### Monitor Your App
```bash
# SSH to Hetzner
ssh root@192.0.2.123

# View live logs
docker logs -f imperial-codex

# Check status
docker ps

# See resource usage
docker stats
```

### Update Your App
```bash
cd ~/imperial-codex
git pull origin main
./build.sh
docker compose -f docker-compose.coolify.yml up -d
```

### Restart/Stop
```bash
# Restart
docker compose -f docker-compose.coolify.yml restart

# Stop
docker compose -f docker-compose.coolify.yml down

# Start
docker compose -f docker-compose.coolify.yml up -d
```

---

## 🔐 Security Checklist

- [ ] SSH key configured (not password-only)
- [ ] Firewall enabled (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] `.env.production.local` has chmod 600
- [ ] No secrets in `.git` (check .gitignore)
- [ ] Docker running as non-root
- [ ] Read-only filesystem enabled
- [ ] Health checks running

---

## 🆘 Need Help?

### App won't start
```bash
ssh root@YOUR_IP
docker logs imperial-codex
# Check for errors
```

### Can't connect to server
```bash
# Test SSH
ssh -v root@YOUR_IP

# Check Hetzner dashboard
# Make sure server is running
```

### Docker build failed
```bash
# Usually network timeout, just try again:
./ssh-deploy.sh root@YOUR_IP coolify
```

### Port not accessible
```bash
# Check Hetzner firewall
# Make sure ports 80, 443, 3000 are open (or just 3000 for Coolify)

# Check UFW on server
ssh root@YOUR_IP
sudo ufw status
```

---

## 📚 Full Documentation Available

- `HETZNER_QUICK_START.md` - Fast track (5 min read)
- `HETZNER_DEPLOYMENT.md` - Detailed guide (20 min read)
- `QUICKSTART.md` - Command reference
- `DEPLOYMENT_GUIDE.md` - Troubleshooting
- `DEPLOYMENT_SUMMARY.md` - Feature overview
- `VPS_DEPLOYMENT_SETUP.md` - VPS general guide
- `START_HERE.md` - Quick overview
- `COMPLETE_SETUP.md` - Everything included

---

## 🎉 You're Ready!

Everything is set up and ready for Hetzner deployment.

### Next Action:
1. Open `HETZNER_QUICK_START.md`
2. Follow the 5-minute checklist
3. Run one deployment command
4. Your app goes live!

### Time to live: **~15 minutes**
### Cost: **$2.50/month**
### Status: **✅ Production Ready**

---

## 🚀 Let's Deploy!

**Ready?** Start with `HETZNER_QUICK_START.md` →

Questions? Check the documentation files - they have the answers!

---

**Created**: 2024
**Status**: ✅ Complete & Ready
**Next Step**: Hetzner deployment
**Estimated Time**: 15-20 minutes
**Est. Cost**: $2.50/month

🎯 **Go live now!**
