# 🚀 CPX12 SERVER SETUP - Complete Guide

## ✅ YOUR SERVER INFO

- **Name**: ubuntu-2gb-fsn1-1 (current)
- **IP Address**: 2.28.6.68
- **Location**: fsn1 (Germany)
- **Status**: Running ✓
- **SSH Key**: NOT added yet ⚠️

---

## 📝 STEP 1: Rename Your Server

### In Hetzner Console:

```
1. Go to https://console.hetzner.cloud
2. Click on your project: imperial-codex
3. Click on server: ubuntu-2gb-fsn1-1
4. Look for "Rename" button or Edit name
5. Change name from: ubuntu-2gb-fsn1-1
6. Change name to: imperial-codex-app
7. Click Save/Confirm
```

**New Name**: `imperial-codex-app`

---

## 🔑 STEP 2: Add SSH Key (Important!)

### Why?
- Secure way to access your server
- No password needed
- Industry standard

### Option A: Add SSH Key Now (Recommended)

#### On Your Local Machine:

**Step 1: Get your SSH public key**

Open terminal and run:
```bash
cat ~/.ssh/id_rsa.pub
```

**Output will look like:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDpX... your@email.com
```

**Copy the entire output** (from `ssh-rsa` to `your@email.com`)

#### Step 2: Add to Hetzner

```
1. In Hetzner Console, click your server
2. Look for "SSH Keys" section
3. Click "Add SSH Key" or "Manage SSH Keys"
4. Click "New SSH Key"
5. Paste your key (the long string you copied)
6. Name it: my-laptop (or your device name)
7. Click "Add"
```

✅ Done! Now you can SSH into your server

---

### Option B: Access via Password (Temporary)

If you don't have SSH key yet, Hetzner sent you a temporary password:

```
1. Check your email from Hetzner
2. Look for "Initial Password" email
3. Use that to access the server

SSH command:
ssh root@2.28.6.68
(Enter password when prompted)
```

**Then set up SSH key later**

---

## 🖥️ STEP 3: Connect to Your Server

### If you added SSH key:

```bash
ssh root@2.28.6.68
```

You should see:
```
Welcome to Ubuntu 22.04 LTS
root@ubuntu-2gb-fsn1-1:~#
```

### If using password:

```bash
ssh root@2.28.6.68
# Enter password when prompted
```

---

## 📋 STEP 4: Initial Server Setup

Once connected via SSH, run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Verify Docker is available (we'll install it)
which docker

# Reboot to apply updates
sudo reboot
```

After reboot, reconnect:
```bash
ssh root@2.28.6.68
```

---

## 🐳 STEP 5: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose --version
```

Expected output:
```
Docker version 25.x.x or higher
Docker Compose version 2.x.x or higher
```

---

## 📂 STEP 6: Copy Your Project

### Option A: Clone from Git (Recommended)

```bash
# SSH into your server
ssh root@2.28.6.68

# Clone your project
git clone https://github.com/YOUR_USERNAME/imperial-codex.git /root/imperial-codex

# Go to project
cd /root/imperial-codex
```

### Option B: Copy Files with SCP

From your local machine:

```bash
scp -r ./ root@2.28.6.68:/root/imperial-codex/
```

---

## ⚙️ STEP 7: Configure Environment

### On the server (SSH):

```bash
cd /root/imperial-codex

# Create environment file
nano .env.production.local
```

Add these values:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
ANTHROPIC_API_KEY=sk-ant-YOUR_ACTUAL_KEY
SESSION_SECRET=generate-with-openssl-rand-base64-32
VAULT_ENCRYPTION_KEY=generate-with-openssl-rand-base64-32
CRON_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://2.28.6.68
```

**To generate secrets locally first (on your laptop):**

```bash
openssl rand -base64 32  # Copy this value
openssl rand -base64 32  # Copy this value
openssl rand -base64 32  # Copy this value
```

**Exit nano**: Press `Ctrl+X`, then `Y`, then `Enter`

**Secure the file:**
```bash
chmod 600 .env.production.local
```

---

## 🚀 STEP 8: Deploy with Docker

### Make scripts executable:

```bash
chmod +x build.sh ssh-deploy.sh
```

### Build image:

```bash
./build.sh
```

This will take 3-5 minutes. Wait for it to complete.

### Start containers:

```bash
docker compose -f docker-compose.coolify.yml up -d
```

### Verify:

```bash
docker ps
```

You should see `imperial-codex` container running.

---

## ✅ STEP 9: Test Your App

### Check health endpoint:

```bash
curl http://localhost:3000/health
```

Expected: `200 OK`

### View logs:

```bash
docker logs -f imperial-codex
```

### Access from browser:

Open: `http://2.28.6.68:3000`

Your app should load! 🎉

---

## 📊 COMPLETE SETUP CHECKLIST

- [ ] Server renamed to: imperial-codex-app
- [ ] SSH key added to Hetzner (or have password)
- [ ] SSH into server successful: `ssh root@2.28.6.68`
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Docker installed: `docker --version`
- [ ] Project cloned/copied to `/root/imperial-codex`
- [ ] `.env.production.local` configured with API keys
- [ ] Environment file secured: `chmod 600 .env.production.local`
- [ ] Docker image built: `./build.sh`
- [ ] Containers running: `docker ps`
- [ ] Health check passing: `curl http://localhost:3000/health`
- [ ] App accessible: `http://2.28.6.68:3000`

---

## 🎯 QUICK COMMAND SUMMARY

### On your laptop:

```bash
# Rename in Hetzner console manually

# Copy SSH key and add to Hetzner manually

# Then for deployment:
ssh root@2.28.6.68
```

### On the server:

```bash
# Setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
docker --version

# Clone project
git clone https://github.com/YOUR_USER/imperial-codex.git /root/imperial-codex
cd /root/imperial-codex

# Configure
nano .env.production.local
# (Add your API keys and secrets)
chmod 600 .env.production.local

# Deploy
chmod +x build.sh
./build.sh
docker compose -f docker-compose.coolify.yml up -d

# Verify
docker ps
curl http://localhost:3000/health

# View logs
docker logs -f imperial-codex
```

---

## 🌐 ACCESS YOUR APP

Once deployed:

```
URL: http://2.28.6.68:3000
```

---

## 📝 OPTIONAL: Add Domain Later

When you're ready:

1. Buy domain from Namecheap ($8.88/year)
2. Point DNS A record to: `2.28.6.68`
3. Wait 24 hours for propagation
4. Update `.env.production.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
5. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   ```

---

## 🆘 TROUBLESHOOTING

### Can't SSH in?

```bash
# Check if server is running
# Go to Hetzner console and verify status

# Try with verbose output
ssh -vvv root@2.28.6.68

# If password-based, get password from Hetzner email
```

### Docker not installing?

```bash
# Try manual installation
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Build fails?

```bash
# Usually network timeout, try again
./build.sh

# Or view detailed error
docker build --target runner -t imperial-codex:latest .
```

### Container won't start?

```bash
# Check logs
docker logs imperial-codex

# Check if port is in use
sudo lsof -i :3000
```

---

## 🎉 YOU'RE READY!

Your server is running. Just follow the steps above and you'll have Imperial Codex live in minutes!

---

## 📞 SUMMARY

Your setup:
- **Server**: CPX12 @ $14.09/month
- **Location**: fsn1 (Germany)
- **IP**: 2.28.6.68
- **Name**: imperial-codex-app (rename in console)
- **OS**: Ubuntu 22.04
- **Status**: Ready to deploy!

Follow the steps and you're done! 🚀
