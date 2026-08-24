╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║        CONNECT TO YOUR HETZNER VPS FROM WINDOWS - QUICK GUIDE                 ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝


🎯 WHAT YOU NEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your VPS:    2.28.6.68 (Hetzner)
Your OS:     Windows 10/11
Goal:        Run Linux commands on VPS from Windows


⭐ OPTION 1: WINDOWS TERMINAL (Easiest - Built-in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost:        FREE
Install:     Already on Windows 11
Time:        1 minute

Setup:
  1. Press Windows Key + X
  2. Click "Windows Terminal"
  3. Type: ssh root@2.28.6.68
  4. Enter password
  5. Done! ✓

You'll see:
  root@imperial-codex-app:~#

Now run Linux commands!


✅ OPTION 2: MOBAXTERM (Best Overall - RECOMMENDED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost:        FREE (Home Edition)
Download:    https://mobaxterm.mobatek.net/download.html
Install:     5 minutes
Features:    GUI + File browser + Terminal

Setup:
  1. Download MobaXterm (Home Edition - free)
  2. Install normally
  3. Click "Session" (top left)
  4. Click "SSH"
  5. Remote host: 2.28.6.68
  6. Username: root
  7. Click "OK"
  8. Enter password
  9. Done! ✓

You'll see:
  Left: File browser (drag & drop files!)
  Right: Terminal (run commands!)


🐧 OPTION 3: PUTTY (Classic SSH Client)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost:        FREE
Download:    https://www.putty.org/
Install:     3 minutes
Features:    Simple terminal

Setup:
  1. Download PuTTY
  2. Install
  3. Open PuTTY
  4. Host Name: 2.28.6.68
  5. Port: 22
  6. Connection type: SSH
  7. Click "Open"
  8. Enter password 
  9. Done! ✓


💻 OPTION 4: VS CODE (For Coding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cost:        FREE
Download:    https://code.visualstudio.com/
Setup:       10 minutes
Features:    Edit files on VPS directly

Setup:
  1. Download & install VS Code
  2. Open Extensions (Ctrl+Shift+X)
  3. Search: "Remote - SSH"
  4. Install (by Microsoft)
  5. Press Ctrl+Shift+P
  6. Type: "Remote-SSH: Connect to Host..."
  7. Enter: root@2.28.6.68
  8. Choose config file
  9. Click "Connect"
  10. Done! ✓

You'll get:
  Full Linux development environment
  Edit files directly on server
  Terminal built-in


📊 QUICK COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option          Cost    Install   File Mgmt  Terminal  Coding
─────────────────────────────────────────────────────────────
Windows Term    FREE    Built-in  ❌         ✅        ❌
MobaXterm       FREE    5 min     ✅ (GUI)   ✅        ❌
PuTTY           FREE    3 min     ❌         ✅        ❌
VS Code SSH     FREE    10 min    ✅ (GUI)   ✅        ✅ ⭐


🎯 MY RECOMMENDATION FOR YOU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use: MOBAXTERM ⭐

Why:
  ✅ Professional interface
  ✅ File browser on left
  ✅ Terminal on right
  ✅ Drag & drop files
  ✅ Free (home edition)
  ✅ No installation hassle


🚀 QUICK START - MOBAXTERM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://mobaxterm.mobatek.net/download.html

2. Download: Home Edition (Free) - green button

3. Install: Normal Windows installer

4. Open MobaXterm

5. Create session:
   Session → SSH
   Remote host: 2.28.6.68
   Username: root
   OK

6. Connect:
   Enter password
   
7. Done!

You're now connected to your VPS!


🖥️  WHAT YOU'LL SEE IN MOBAXTERM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────────────┐
│ MobaXterm                                                    │
├─────────────────────┬──────────────────────────────────────┤
│                     │ Welcome to Ubuntu 22.04 LTS        │
│ FILE BROWSER        │ root@imperial-codex-app:~#         │
│ ─────────────────   │                                    │
│ [+] / (home)        │ docker ps                          │
│   [+] /root         │ CONTAINER ID  IMAGE                │
│   [+] /tmp          │ abc123...     imperial-codex       │
│                     │                                    │
│ Drag & drop files   │ docker logs -f imperial-codex      │
│ from Windows here!  │ Starting app...                    │
│                     │                                    │
└─────────────────────┴──────────────────────────────────────┘

Left side: Your VPS files
Right side: Terminal to run commands


📝 COMMANDS YOU'LL RUN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type these in terminal to manage your app:

  docker ps                           (List containers)
  docker logs -f imperial-codex       (View logs live)
  docker restart imperial-codex       (Restart app)
  docker stats                        (Resources)
  cd /root/imperial-codex             (Go to app folder)
  ./build.sh                          (Rebuild image)
  docker compose up -d                (Start app)
  docker compose down                 (Stop app)


⏱️  SETUP TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Download MobaXterm:         1 min
Install:                    2 min
Create session:             1 min
Connect:                    1 min
────────────────────────────────
TOTAL:                      5 minutes


🔐 PASSWORD OR SSH KEY?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option A: Use password (easiest now)
  1. Check Hetzner email for password
  2. Enter when MobaXterm asks
  3. Done!

Option B: Use SSH key (better, passwordless)
  1. Generate key: ssh-keygen -t rsa -b 4096
  2. Add to Hetzner console
  3. MobaXterm auto-detects it
  4. No password needed!


✅ FINAL CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before you start:
  ☐ Download MobaXterm (or your chosen tool)
  ☐ Install it
  ☐ Have your VPS password ready
  ☐ Know your VPS IP: 2.28.6.68

Then:
  ☐ Open MobaXterm
  ☐ Create SSH session
  ☐ Connect to 2.28.6.68
  ☐ You're in! ✓


🎉 YOU'RE READY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once connected, you can:

  ✅ Run all the deployment commands
  ✅ Monitor your app
  ✅ View logs
  ✅ Edit files
  ✅ Manage containers
  ✅ Check resources

All from Windows!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT: Download MobaXterm and connect!

https://mobaxterm.mobatek.net/download.html

Then follow the setup steps above.

Questions? See WINDOWS_CONNECT_TO_VPS.md for detailed guide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
