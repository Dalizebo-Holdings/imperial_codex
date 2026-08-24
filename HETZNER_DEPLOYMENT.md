# 🚀 Hetzner Cloud Deployment Guide for Imperial Codex

## Overview

Hetzner Cloud is one of the cheapest and most reliable cloud providers ($2.50/month for starter VPS). This guide walks you through:

1. Creating a Hetzner account
2. Setting up a server
3. Configuring SSH access
4. Deploying Imperial Codex with Docker

---

## Step 1: Create Hetzner Account

### 1.1 Sign Up

1. Visit: https://www.hetzner.cloud
2. Click **"Sign Up"** (top right)
3. Enter email and create password
4. Verify email
5. Add payment method (credit card or PayPal)

### 1.2 Verify Phone (Optional but Recommended)

- Add phone number for account security
- Receive verification code

---

## Step 2: Create Your First Server

### 2.1 Create Project

1. Log in to Hetzner Cloud Console
2. Click **"Create Project"**
3. Name it: `Imperial Codex`
4. Click **"Create"**

### 2.2 Create Server

1. In your project, click **"Add Server"**
2. Choose **Image**: `Ubuntu 22.04`
3. Choose **Type**: `CPX11` ($2.50/month - 1 vCPU, 2GB RAM, 25GB SSD)
4. Choose **Location**: Closest to you (e.g., US-East, EU-Central)
5. **SSH Key** (important!):
   - Click **"Add SSH Key"**
   - Follow instructions to add your local SSH key
   - (Or create password-based access)
6. Server Name: `imperial-codex`
7. Click **"Create & Buy Now"**

### 2.3 Wait for Server Setup

- Server boots in ~30 seconds
- You'll see IP address in dashboard
- Note: **Write down the IP address**

**Example**: `192.0.2.123`

---

## Step 3: Connect via SSH

### 3.1 From Your Local Machine

```bash
# If you added SSH key:
ssh root@192.0.2.123

# If using password:
ssh root@192.0.2.123
# (Enter password from email)
```

### 3.2 Verify You're Connected

```bash
# You should see something like:
# root@imperial-codex:~#

# Check Ubuntu version
lsb_release -a
# Output: Ubuntu 22.04 LTS
```

---

## Step 4: Initial Server Setup

### 4.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

After reboot, reconnect:
```bash
ssh root@192.0.2.123
```

### 4.2 Create Non-Root User (Recommended)

```bash
# Create user
sudo adduser deploy
# (Set password, press Enter for other fields)

# Add to sudo group
sudo usermod -aG sudo deploy

# Add SSH key for new user
mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Now you can connect as:
```bash
ssh deploy@192.0.2.123
```

### 4.3 Configure Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Step 5: Install Docker

### 5.1 Install Docker Engine

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose --version
```

### 5.2 Add User to Docker Group (Optional)

```bash
sudo usermod -aG docker deploy
# Log out and back in for changes to take effect
exit
# Then reconnect
ssh deploy@192.0.2.123
```

---

## Step 6: Deploy Imperial Codex

### 6.1 Copy Your Project to Hetzner

From your **local machine**:

```bash
# Option A: Clone from Git (Recommended)
ssh deploy@192.0.2.123 "cd /home/deploy && git clone https://github.com/YOUR_USERNAME/imperial-codex.git"

# Option B: Copy files with rsync
rsync -avz --exclude='.git' --exclude='node_modules' \
  ./ deploy@192.0.2.123:/home/deploy/imperial-codex/

# Option C: Copy files with scp
scp -r . deploy@192.0.2.123:/home/deploy/imperial-codex/
```

### 6.2 Configure Environment Variables

```bash
# SSH into server
ssh deploy@192.0.2.123

# Navigate to project
cd ~/imperial-codex

# Create environment file
nano .env.production.local
```

**Add your configuration:**
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
SESSION_SECRET=GENERATE_WITH_openssl_rand_-base64_32
VAULT_ENCRYPTION_KEY=GENERATE_WITH_openssl_rand_-base64_32
NEXT_PUBLIC_APP_URL=http://192.0.2.123
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

**Secure the file:**
```bash
chmod 600 .env.production.local
```

### 6.3 Deploy with Docker

**Option A: Using SSH Deploy Script (Easiest)**

From your **local machine**:
```bash
chmod +x ssh-deploy.sh
./ssh-deploy.sh deploy@192.0.2.123 coolify
```

The script will:
- Build Docker image
- Start containers
- Verify health
- Show you the status

**Option B: Manual Deployment**

On the **Hetzner server**:
```bash
cd ~/imperial-codex

# Make scripts executable
chmod +x build.sh deploy.sh test-local.sh

# Build image
./build.sh

# Start containers
docker compose -f docker-compose.coolify.yml up -d

# Verify
docker ps
docker logs imperial-codex
```

---

## Step 7: Access Your Application

### 7.1 Direct Access

```
http://192.0.2.123:3000
```

In your browser, replace `192.0.2.123` with your actual Hetzner IP.

### 7.2 With Domain (Optional)

1. Buy a domain (GoDaddy, Namecheap, etc.)
2. Point DNS A record to your Hetzner IP:
   ```
   A record: @ → 192.0.2.123
   ```
3. Update `.env.production.local`:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
4. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot certonly --standalone -d your-domain.com
   ```
5. Copy certificates:
   ```bash
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/imperial-codex/certs/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/imperial-codex/certs/key.pem
   sudo chown deploy:deploy ~/imperial-codex/certs/*
   ```
6. Switch to server mode:
   ```bash
   docker compose -f docker-compose.server.yml up -d
   ```

---

## Step 8: Verify Deployment

### 8.1 Check Container Status

```bash
ssh deploy@192.0.2.123

docker ps
# Should show: imperial-codex container running
```

### 8.2 Test Health Endpoint

```bash
curl http://192.0.2.123:3000/health
# Should return: 200 OK
```

### 8.3 View Logs

```bash
docker logs -f imperial-codex
# Should show: app startup logs
```

---

## Step 9: Ongoing Management

### View Logs

```bash
ssh deploy@192.0.2.123
docker compose -f docker-compose.coolify.yml logs -f
```

### Restart Application

```bash
docker compose -f docker-compose.coolify.yml restart imperial-codex
```

### Stop Application

```bash
docker compose -f docker-compose.coolify.yml down
```

### Update Application

```bash
cd ~/imperial-codex
git pull origin main
./build.sh
docker compose -f docker-compose.coolify.yml up -d
```

### Check Resource Usage

```bash
docker stats imperial-codex
```

### SSH into Container

```bash
docker exec -it imperial-codex sh
```

---

## 💰 Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| **Server (CPX11)** | $2.50/month | 1 vCPU, 2GB RAM, 25GB SSD |
| **Bandwidth** | Free | Up to 1TB/month included |
| **Backups** | $0.40/month | Optional, not needed yet |
| **Domain** | $10-15/year | Optional |
| **SSL Certificate** | Free | Let's Encrypt |
| **Total** | ~$2.50/month | Cheapest option |

---

## 🔧 Troubleshooting

### Container won't start

```bash
docker logs imperial-codex
# Check for error messages
```

### Port 3000 not accessible

```bash
# Check if container is running
docker ps

# Check if ports are open
sudo ufw status

# Check port binding
docker port imperial-codex
```

### Out of memory

```bash
# Check memory usage
free -h
docker stats

# Increase server size in Hetzner dashboard:
# Stop server → Resize → Choose larger type (CPX21, etc.)
# Start server
```

### Permission denied errors

```bash
# Fix permissions
sudo chown -R deploy:deploy ~/imperial-codex
```

---

## 🔐 Security Checklist

- [ ] SSH key added (not password-only)
- [ ] Firewall enabled (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] `.env.production.local` has correct permissions (600)
- [ ] Non-root user created for deployment
- [ ] Automatic updates enabled (optional)
- [ ] Backups configured (optional)

---

## 📚 Helpful Hetzner Resources

- **Dashboard**: https://console.hetzner.cloud
- **Docs**: https://docs.hetzner.cloud
- **Support**: https://support.hetzner.com
- **Pricing**: https://www.hetzner.cloud/pricing

---

## ✅ Deployment Checklist

- [ ] Hetzner account created and verified
- [ ] Server created (CPX11, Ubuntu 22.04)
- [ ] SSH key configured
- [ ] SSH connection verified
- [ ] System updated
- [ ] Docker installed
- [ ] Project files copied to server
- [ ] `.env.production.local` configured
- [ ] Docker image built
- [ ] Containers running
- [ ] App accessible at http://ip:3000
- [ ] Health check passing

---

## 🎉 You're Live!

Your Imperial Codex app is now running on Hetzner Cloud for **$2.50/month**!

**Access it at:**
```
http://YOUR_HETZNER_IP:3000
```

**Next steps:**
- Monitor logs: `docker logs -f imperial-codex`
- Configure domain (optional)
- Set up backups (optional)
- Configure monitoring (optional)

---

## 📞 Next Questions?

- Check logs: `docker logs -f imperial-codex`
- View status: `docker ps`
- SSH in: `ssh deploy@YOUR_IP`
- Review deploy scripts: Check `ssh-deploy.sh`

**Enjoy your deployment!** 🚀
