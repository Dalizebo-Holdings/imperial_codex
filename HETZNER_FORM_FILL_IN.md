╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║             HETZNER SERVER CREATION - QUICK REFERENCE FORM                    ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝


📋 BEFORE YOU START - CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ☐ Hetzner account created
  ☐ Project "imperial-codex" created
  ☐ SSH public key ready (cat ~/.ssh/id_rsa.pub)
  ☐ Know your location preference


🖥️  HETZNER FORM - FILL IN EXACTLY AS SHOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIELD 1: Location
┌─────────────────────────────────────────────────────────┐
│ Select ONE (pick closest to you):                       │
│                                                          │
│  ☐ fsn1 (Falkenstein, Germany)       ✅ RECOMMENDED    │
│  ☐ nbg1 (Nuremberg, Germany)         ✅ GOOD           │
│  ☐ ash (Ashburn, Virginia, USA)      ✅ GOOD FOR US    │
│                                                          │
│ YOUR CHOICE: _____________________                      │
└─────────────────────────────────────────────────────────┘


FIELD 2: Operating System Image
┌─────────────────────────────────────────────────────────┐
│ Select ONE:                                             │
│                                                          │
│  ☑️ Ubuntu 22.04 x64  ← SELECT THIS                     │
│  ☐ Ubuntu 24.04                                         │
│  ☐ Ubuntu 20.04                                         │
│  ☐ Debian 12                                            │
│                                                          │
│ YOUR CHOICE: Ubuntu 22.04                              │
└─────────────────────────────────────────────────────────┘


FIELD 3: Server Type
┌─────────────────────────────────────────────────────────┐
│ Select ONE:                                             │
│                                                          │
│  ☐ CPX11 - 1 vCPU, 2GB RAM ($2.50/mo) - Too small      │
│  ☑️ CPX21 - 2 vCPU, 4GB RAM ($5.80/mo) ← SELECT THIS    │
│  ☐ CPX31 - 4 vCPU, 8GB RAM ($12/mo) - Overkill         │
│                                                          │
│ YOUR CHOICE: CPX21                                      │
└─────────────────────────────────────────────────────────┘


FIELD 4: SSH Keys
┌─────────────────────────────────────────────────────────┐
│ Add your SSH public key:                                │
│                                                          │
│ Step 1: On your laptop, run:                           │
│   cat ~/.ssh/id_rsa.pub                                │
│                                                          │
│ Step 2: Copy the entire output                         │
│                                                          │
│ Step 3: In Hetzner, click "Add SSH Key"                │
│                                                          │
│ Step 4: Paste the key you copied                       │
│                                                          │
│ Step 5: Name it: my-laptop (or similar)                │
│                                                          │
│ Step 6: Click "Add"                                    │
│                                                          │
│ YOUR KEY: [Paste ssh-rsa AAAAB3NzaC...]               │
└─────────────────────────────────────────────────────────┘


FIELD 5: Hostname
┌─────────────────────────────────────────────────────────┐
│ Enter server name:                                      │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ imperial-codex-app                              │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│ YOUR CHOICE: imperial-codex-app                        │
└─────────────────────────────────────────────────────────┘


FIELD 6: Labels (Optional - Skip)
┌─────────────────────────────────────────────────────────┐
│ Labels: (optional, you can skip this)                   │
│                                                          │
│ If you want to add them:                               │
│   Key: environment                                      │
│   Value: production                                     │
│                                                          │
│ Or leave blank                                         │
│                                                          │
│ YOUR CHOICE: (Skip)                                    │
└─────────────────────────────────────────────────────────┘


✅ REVIEW YOUR CHOICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before clicking "Create & Buy Now", verify:

  Location:        fsn1 (or your choice)          ✓
  Image:           Ubuntu 22.04 x64               ✓
  Server Type:     CPX21 ($5.80/month)            ✓
  SSH Key:         my-laptop (selected)           ✓
  Hostname:        imperial-codex-app             ✓
  Labels:          (none)                         ✓
  
  TOTAL MONTHLY COST: $5.80                       ✓


🎯 QUICK REFERENCE TABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Field              What to Enter              Notes
─────────────────  ─────────────────────────  ─────────────────
Location           fsn1                       Germany - default
Image              Ubuntu 22.04 x64           Stable + Docker
Server Type        CPX21                      2 vCPU, 4GB RAM
SSH Key            [your public key]          From ~/.ssh/id_rsa.pub
Hostname           imperial-codex-app         Clear server name
Labels             (skip)                     Optional


📝 STEP-BY-STEP CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When Creating Server:

  ☐ 1. Go to https://console.hetzner.cloud
  ☐ 2. Log in
  ☐ 3. Select project: imperial-codex
  ☐ 4. Click "+ Add Server"
  ☐ 5. Select location: fsn1
  ☐ 6. Select image: Ubuntu 22.04 x64
  ☐ 7. Select type: CPX21 ($5.80/month)
  ☐ 8. Add SSH key (or select existing)
  ☐ 9. Hostname: imperial-codex-app
  ☐ 10. Labels: (skip)
  ☐ 11. Review: Check all fields correct
  ☐ 12. Click "Create & Buy Now"
  ☐ 13. Wait 30 seconds for server to boot
  ☐ 14. Copy IP address when it appears


⏱️  TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Filling form:     2-3 minutes
  Click create:     1 minute
  Server boots:     30 seconds
  ─────────────────────────
  TOTAL:            ~4 minutes


✨ AFTER CREATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard will show:

  Status:           Running ✓
  Name:             imperial-codex-app
  Type:             CPX21
  Location:         Falkenstein
  IP Address:       192.0.2.123 (EXAMPLE)
  OS:               Ubuntu 22.04


🚀 NEXT COMMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After server is created, on your local machine:

  ./ssh-deploy.sh root@YOUR_IP coolify

Replace YOUR_IP with the IP shown in Hetzner dashboard

Example:
  ./ssh-deploy.sh root@192.0.2.123 coolify


💡 COMMON MISTAKES TO AVOID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Selecting CPX11 (too small)
   → Use CPX21 instead

❌ Selecting Ubuntu 24.04 (newer but less tested)
   → Use Ubuntu 22.04 instead

❌ Forgetting SSH key
   → You won't be able to access server

❌ Using wrong hostname format
   → Use lowercase, hyphens only

❌ Picking expensive server type
   → CPX21 is perfect, don't pick CPX31+


🎉 YOU'RE READY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All fields you need are above.

Just follow this form and you'll have:

  ✅ Server created in 4 minutes
  ✅ Cost: $5.80/month
  ✅ Ready for deployment
  ✅ Perfect specs for Imperial Codex


NEXT: See HETZNER_SERVER_CREATION_DETAILED.md for more info

OR just fill in the form and click "Create & Buy Now"!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
