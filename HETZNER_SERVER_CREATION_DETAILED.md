# 🖥️ HETZNER SERVER CREATION - COMPLETE STEP-BY-STEP

## Overview

This guide walks you through every field when creating a server in Hetzner Cloud Console.

---

## 📋 BEFORE YOU START - GATHER THIS INFO

Have these ready:

1. **SSH Public Key** (your laptop's SSH key)
   ```bash
   # Find it on your computer:
   cat ~/.ssh/id_rsa.pub
   # Copy the entire output (starts with ssh-rsa)
   ```

2. **Your Preferred Location** (where server will be hosted)
   - US-East (Virginia)
   - EU-Central (Germany)
   - Pick closest to your users

3. **Server Name** (from our guide)
   - `imperial-codex-app`

---

## 🚀 STEP-BY-STEP SERVER CREATION

### STEP 1: Access Hetzner Cloud Console

```
1. Go to: https://console.hetzner.cloud
2. Log in with your account
3. Select Project: imperial-codex
```

---

### STEP 2: Click "Add Server"

```
In the dashboard:
→ Click the big "+ Add Server" button (top right area)
```

---

### STEP 3: Fill in "Choose Location"

```
FIELD: Location (Where your server will be hosted)

OPTIONS:
  ☐ fsn1 (Falkenstein, Germany)       ✅ Good default
  ☐ nbg1 (Nuremberg, Germany)         ✅ Good default
  ☐ hel1 (Helsinki, Finland)          ✅ Good for EU
  ☐ ash (Ashburn, Virginia, USA)      ✅ Good for US
  ☐ hil (Hillsboro, Oregon, USA)      ✅ Good for West Coast
  ☐ sjc (San Jose, California, USA)   ✅ Good for West Coast

CHOOSE: 
  → Pick closest to your users
  → Or pick any, doesn't matter much for testing
  → Recommendation: fsn1 (Germany) or ash (USA)

EXAMPLE SELECTION: fsn1
```

---

### STEP 4: Fill in "Choose Image"

```
FIELD: Operating System Image

SECTION: "Available" (First section)

OPTIONS SHOWN:
  ☐ Ubuntu 24.04
  ☐ Ubuntu 22.04         ✅ SELECT THIS
  ☐ Ubuntu 20.04
  ☐ Debian 12
  ☐ Debian 11
  [... more options ...]

ACTION:
  → Click on "Ubuntu 22.04"
  → It will be highlighted/selected

RECOMMENDED: Ubuntu 22.04
  ✅ Stable, widely used
  ✅ Perfect for Docker
  ✅ Long-term support
```

---

### STEP 5: Fill in "Choose Server Type"

```
FIELD: Server Type / Size

SECTION: "Shared vCPU"

OPTIONS (with prices):
  ☐ CPX11     $2.50/month     (1 vCPU, 2GB RAM, 25GB SSD)    ⚠️ Too small
  ☐ CPX21     $5.80/month     (2 vCPU, 4GB RAM, 40GB SSD)    ✅ SELECT THIS
  ☐ CPX31     $12.00/month    (2 vCPU, 8GB RAM, 80GB SSD)
  ☐ CPX41     $24.00/month    (4 vCPU, 16GB RAM, 160GB SSD)

MORE OPTIONS (if you scroll):
  • Dedicated vCPU (more expensive)
  • Storage Optimized (for databases)

ACTION:
  → Click on "CPX21" (the $5.80/month one)
  → It will be highlighted/selected

RECOMMENDED: CPX21
  ✅ Perfect for Imperial Codex
  ✅ Best price/performance
  ✅ Room to grow
```

---

### STEP 6: Fill in "SSH Keys"

```
FIELD: SSH Keys (for authentication)

OPTIONS:
  ☐ Create Key (Option 1: Hetzner generates key)
  ☐ Add Key from Settings (Option 2: Use your existing key)

RECOMMENDED: Use your existing key (Option 2)

HOW TO ADD YOUR KEY:

Step A: Get your public key
  1. Open terminal on your laptop
  2. Run: cat ~/.ssh/id_rsa.pub
  3. Copy the entire output (long string starting with ssh-rsa)

Step B: Add to Hetzner
  1. In this field, look for input box or button
  2. Click "Add SSH Key" or "Select SSH Key"
  3. If first time: "Create SSH Key"
     → Paste your key
     → Name it: "my-laptop" or "development"
     → Click "Add"
  4. Select the key you just added

WHAT TO PASTE:
  Looks like: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... your@email.com

WHY:
  ✅ Secure authentication
  ✅ No password needed
  ✅ Industry standard
```

---

### STEP 7: Fill in "Hostname"

```
FIELD: Hostname (Name of your server)

INPUT: imperial-codex-app

NOTES:
  • Lowercase only
  • Hyphens allowed
  • No spaces
  • Max 63 characters
  • This is what shows in dashboard

EXAMPLE: imperial-codex-app
```

---

### STEP 8: Fill in "Labels" (Optional)

```
FIELD: Labels (Optional - for organization)

INPUT: (You can skip this, it's optional)

OR if you want to add them:

Option 1 - Add Label:
  1. Click "+ Add Label"
  2. Key: environment
  3. Value: production
  4. Click "Add"

Option 2 - Add Another:
  1. Click "+ Add Label" again
  2. Key: team
  3. Value: personal
  4. Click "Add"

EXAMPLES (optional):
  • environment: production
  • team: personal
  • project: imperial-codex

FOR NOW: Skip this (optional)
```

---

### STEP 9: Review Everything

```
REVIEW SCREEN should show:

  Location:        fsn1 (Falkenstein)
  Image:           Ubuntu 22.04 x64
  Server Type:     CPX21 ($5.80/month)
  SSH Key:         my-laptop (or whatever you named it)
  Hostname:        imperial-codex-app
  Labels:          (none if you skipped)
  
  TOTAL PRICE:     $5.80/month
```

---

### STEP 10: Click "Create & Buy Now"

```
BUTTON: "Create & Buy Now" (bottom right)

ACTION:
  1. Click it
  2. Confirm payment method if prompted
  3. Server starts provisioning

WAIT: Server boots in ~30 seconds
```

---

### STEP 11: Server Created!

```
Dashboard will show:

  Status:        Running (green checkmark)
  Name:          imperial-codex-app
  Type:          CPX21
  Location:      Falkenstein
  IP Address:    192.0.2.123 (example)
  OS:            Ubuntu 22.04

COPY THE IP ADDRESS - You'll need it for deployment!
```

---

## 📊 COMPLETE FILLED EXAMPLE

```
═══════════════════════════════════════════════════════════
              HETZNER SERVER CREATION FORM
═══════════════════════════════════════════════════════════

Location:
  ✓ fsn1 (Falkenstein, Germany)

Image:
  ✓ Ubuntu 22.04 x64

Server Type:
  ✓ CPX21 - 2 vCPU, 4GB RAM, 40GB SSD ($5.80/month)

SSH Keys:
  ✓ my-laptop (ssh-rsa AAAAB3...)

Hostname:
  ✓ imperial-codex-app

Labels:
  (empty - optional)

═══════════════════════════════════════════════════════════
TOTAL COST: $5.80/month
═══════════════════════════════════════════════════════════
```

---

## 🎯 QUICK FORM TEMPLATE

If you want to just copy-paste the values:

```
Location:          fsn1 (or closest to you)
Image:             Ubuntu 22.04 x64
Server Type:       CPX21 ($5.80/month)
SSH Keys:          [Your public key from ~/.ssh/id_rsa.pub]
Hostname:          imperial-codex-app
Labels:            (skip - optional)
```

---

## ⏱️ TIMELINE

```
Step 1-5:    Choose location, image, type        (1 min)
Step 6-7:    Add SSH key, hostname               (2 min)
Step 8-9:    Review and confirm                  (1 min)
Step 10-11:  Click create, server boots          (1 min + 30 sec wait)
             ────────────────────────────────
TOTAL:       ~5 minutes to live server
```

---

## ✅ AFTER SERVER CREATION

### You'll See:

```
Status:     Running (with green checkmark)
IP:         192.0.2.123 (SAVE THIS!)
Server:     imperial-codex-app
Type:       CPX21
Location:   Falkenstein
```

### Next Step:

```
Copy IP address: 192.0.2.123

Then run deployment command:
./ssh-deploy.sh root@192.0.2.123 coolify
```

---

## 🆘 COMMON QUESTIONS

### Q: What if I don't have an SSH key?

```
A: Create one first:

On Mac/Linux:
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
  cat ~/.ssh/id_rsa.pub

On Windows:
  Use PuTTY or Windows Subsystem for Linux (WSL)
  
Then paste that key in Hetzner
```

### Q: Can I change the location later?

```
A: No, but you can:
  1. Create new server in different location
  2. Deploy to new server
  3. Delete old server
```

### Q: What if I pick the wrong image?

```
A: You can:
  1. Delete server
  2. Create new one with correct image
  3. No charges after first deletion
```

### Q: Can I resize the server?

```
A: Yes! In Hetzner:
  1. Stop server
  2. Click "Resize"
  3. Choose bigger type (CPX31, etc.)
  4. Start server
  
Takes ~5 min downtime
```

### Q: What's the difference between locations?

```
A: Just geography:
  • fsn1 = Germany (Europe)
  • ash = Virginia (USA)
  • Others = specific regions
  
Pick closest to your users for lower latency
For testing, doesn't matter
```

---

## 📝 FILLED FORM SUMMARY

Here's what you'll have filled in:

| Field | Your Value |
|-------|-----------|
| Location | fsn1 |
| Image | Ubuntu 22.04 x64 |
| Type | CPX21 |
| SSH Key | [your public key] |
| Hostname | imperial-codex-app |
| Labels | (none) |
| **Total Cost** | **$5.80/month** |

---

## 🚀 READY TO CREATE?

You have all the information. Just follow the steps:

1. Go to https://console.hetzner.cloud
2. Click "Add Server"
3. Follow this guide field by field
4. Click "Create & Buy Now"
5. Server is live in 30 seconds!

Then deploy Imperial Codex:
```bash
./ssh-deploy.sh root@YOUR_IP coolify
```

---

## 📞 NEED HELP?

If you get stuck:
- Review the step above
- Check Hetzner's help: https://docs.hetzner.cloud
- All fields have ? icons with explanations

---

**You're ready to create your server!** 🎉

Follow this guide step-by-step and you'll have Imperial Codex running in 20 minutes!
