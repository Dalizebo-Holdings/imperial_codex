╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                   HETZNER NAMING - QUICK ANSWER                               ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝


🎯 WHAT TO NAME YOUR PROJECT & SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT NAME (Hetzner Console):
  → imperial-codex

SERVER NAME (Your CX23 machine):
  → imperial-codex-app

DONE! ✅


📝 WHY THESE NAMES?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project Name: imperial-codex
  ✅ Clear what the project is
  ✅ Groups all infrastructure
  ✅ Professional
  ✅ Easy to remember

Server Name: imperial-codex-app
  ✅ Shows it's the app server
  ✅ Clear purpose
  ✅ Scalable (can add -db, -cache later)
  ✅ Professional naming


🏗️  HOW IT LOOKS IN HETZNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hetzner Dashboard:

  Projects
  ├── imperial-codex ← Your project
  │   ├── Servers
  │   │   └── imperial-codex-app ← Your server
  │   │       ├── Status: Running ✓
  │   │       ├── Type: CX23
  │   │       ├── IP: 192.0.2.123
  │   │       └── OS: Ubuntu 22.04
  │   └── Networks
  │   └── Volumes


⏩ QUICK SETUP IN HETZNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Create Project
  1. Click "Create Project"
  2. Name: imperial-codex
  3. Click "Create"

Step 2: Create Server
  1. Click "Add Server"
  2. Server Name: imperial-codex-app
  3. Image: Ubuntu 22.04
  4. Type: CX23
  5. Location: Your choice
  6. SSH Key: Add yours
  7. Click "Create & Buy Now"

Step 3: Note Your IP
  Copy the IP address (e.g., 192.0.2.123)

That's it!


📊 NAMING OPTIONS (If you want alternatives)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Server Name, you could use:

  ⭐ imperial-codex-app     (RECOMMENDED - clear purpose)
  ✅ imperial-codex-main    (good - shows it's main)
  ✅ imperial-codex-prod    (good - shows production)
  ✅ imperial-codex-01      (good - good for scaling)
  ✅ codex-web-main         (shorter)
  ❌ imperial-codex         (confusing with project name)
  ❌ server1                (too generic)
  ❌ myapp                  (not descriptive)

I recommend: imperial-codex-app


💡 NAMING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO:
  ✅ Use lowercase
  ✅ Use hyphens (-)
  ✅ Keep it descriptive
  ✅ Make it memorable
  ✅ Be consistent

DON'T:
  ❌ Use spaces
  ❌ Use underscores (_)
  ❌ Use UPPERCASE
  ❌ Use special characters
  ❌ Be too generic


🔄 IF YOU SCALE LATER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When you add more servers:

  Project: imperial-codex
  Servers:
    ├── imperial-codex-app-01    (main app)
    ├── imperial-codex-app-02    (load balance)
    ├── imperial-codex-db-01     (database)
    └── imperial-codex-cache-01  (redis)

But for now, just: imperial-codex-app


🚀 FULL INFRASTRUCTURE NAME MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your complete setup will be:

  🌐 Domain (optional later):    imperial-codex.com
  🖥️  Hetzner Project:            imperial-codex
  🖥️  Hetzner Server:             imperial-codex-app
  🐳 Docker Container:            imperial-codex
  🚀 Application:                 Imperial Codex (Next.js)
  📍 IP Address:                  192.0.2.123 (example)
  🔑 SSH:                         ssh root@imperial-codex-app
  🌐 URL (dev):                   http://192.0.2.123:3000
  🌐 URL (prod):                  https://imperial-codex.com


✅ FINAL SETUP CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When creating in Hetzner:

  ☐ Project Name: imperial-codex
  ☐ Server Name: imperial-codex-app
  ☐ Server Type: CX23
  ☐ OS: Ubuntu 22.04
  ☐ Add SSH key
  ☐ Location: Choose one
  ☐ Create server
  ☐ Note IP address

Then deploy:

  ☐ ./ssh-deploy.sh root@YOUR_IP coolify
  ☐ Wait 5 minutes
  ☐ Access: http://YOUR_IP:3000
  ☐ Done!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANSWER:

  Hetzner Project:  imperial-codex
  Hetzner Server:   imperial-codex-app

That's it! Professional, clear, and ready to scale.

Deploy and go live! 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
