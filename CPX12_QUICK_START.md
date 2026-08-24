╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                 🚀 YOUR SERVER IS READY - QUICK START                         ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝


📌 YOUR SERVER INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name (current):      ubuntu-2gb-fsn1-1
Name (new):          imperial-codex-app ← RENAME THIS IN HETZNER
IP Address:          2.28.6.68 ← SAVE THIS!
Location:            fsn1 (Germany)
Type:                CPX12 (1 vCPU, 2GB RAM, 40GB SSD)
Cost:                $14.09/month
Status:              Running ✓


🔑 STEP 1: RENAME SERVER (Do in Hetzner Console)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In Hetzner Dashboard:

  1. Click server: ubuntu-2gb-fsn1-1
  2. Find "Rename" button
  3. Change to: imperial-codex-app
  4. Save

Done! ✓


🔐 STEP 2: ADD SSH KEY (Do in Hetzner Console)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On your laptop, open terminal:

  cat ~/.ssh/id_rsa.pub

Copy the output (long string starting with ssh-rsa)

In Hetzner:

  1. Click server settings
  2. Find "SSH Keys" section
  3. Click "Add SSH Key"
  4. Paste your key
  5. Name it: my-laptop
  6. Click "Add"

Done! ✓


💻 STEP 3: CONNECT TO SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On your laptop, open terminal:

  ssh root@2.28.6.68

You should see:

  Welcome to Ubuntu 22.04
  root@imperial-codex-app:~#

Done! ✓


🐳 STEP 4: INSTALL DOCKER (Run on server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After SSH in, run:

  sudo apt update && sudo apt upgrade -y
  curl -fsSL https://get.docker.com | sudo sh
  docker --version

Done! ✓


📂 STEP 5: COPY YOUR PROJECT (Run on server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After SSH in, run:

  git clone https://github.com/YOUR_USERNAME/imperial-codex.git /root/imperial-codex

Or copy via SCP (from your laptop):

  scp -r ./ root@2.28.6.68:/root/imperial-codex/

Done! ✓


⚙️  STEP 6: CONFIGURE ENVIRONMENT (Run on server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On server, run:

  cd /root/imperial-codex
  nano .env.production.local

Add your API keys:

  NODE_ENV=production
  PORT=3000
  HOSTNAME=0.0.0.0
  OPENAI_API_KEY=sk-proj-YOUR_KEY
  ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
  SESSION_SECRET=generated-value-32-chars
  VAULT_ENCRYPTION_KEY=generated-value-32-chars
  CRON_SECRET=generated-value-32-chars
  NEXT_PUBLIC_APP_URL=http://2.28.6.68

Exit nano: Ctrl+X, Y, Enter

Secure it:

  chmod 600 .env.production.local

Done! ✓


🚀 STEP 7: DEPLOY (Run on server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

On server, run:

  chmod +x build.sh
  ./build.sh

Wait 3-5 minutes for build...

Then run:

  docker compose -f docker-compose.coolify.yml up -d

Done! ✓


✅ STEP 8: VERIFY (Run on server)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check if running:

  docker ps

Should show: imperial-codex (running)

Test app:

  curl http://localhost:3000/health

Should return: 200 OK

View logs:

  docker logs -f imperial-codex

Done! ✓


🌐 STEP 9: ACCESS YOUR APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open browser:

  http://2.28.6.68:3000

🎉 YOUR APP IS LIVE!


📋 COMMAND QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Useful commands on server:

  ssh root@2.28.6.68            (Connect)
  docker ps                     (List containers)
  docker logs -f imperial-codex (View logs live)
  docker restart imperial-codex (Restart app)
  docker stats                  (Resource usage)
  curl http://localhost:3000    (Test app)


💡 SECRETS GENERATION (Do on your laptop first)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate 3 secrets and save them:

  openssl rand -base64 32  ← Copy SESSION_SECRET
  openssl rand -base64 32  ← Copy VAULT_ENCRYPTION_KEY
  openssl rand -base64 32  ← Copy CRON_SECRET

Paste these values in .env.production.local


⏱️  TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rename server:          2 min
Add SSH key:            2 min
SSH connect:            1 min
Install Docker:         2 min
Copy project:           2 min
Configure .env:         2 min
Build image:            5 min
Deploy:                 2 min
────────────────────────────
TOTAL:                 ~20 minutes ✓


🎉 RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all steps:

  ✅ Server: imperial-codex-app
  ✅ IP: 2.28.6.68
  ✅ App: http://2.28.6.68:3000
  ✅ Cost: $14.09/month
  ✅ Status: LIVE & RUNNING 🚀

Your Imperial Codex is deployed and accessible!


⚠️  IMPORTANT REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • Add SSH key BEFORE trying to deploy
  • Save your 3 generated secrets securely
  • Update .env.production.local with REAL API keys
  • Set chmod 600 on .env.production.local
  • Keep IP address (2.28.6.68) saved
  • Monitor docker logs if issues arise


📖 DETAILED GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more details, see: CPX12_SETUP_COMPLETE.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR SERVER IS READY! Follow the steps above and you're done. 🎉

Imperial Codex will be live at http://2.28.6.68:3000 in ~20 minutes!

Go! 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
