# 🖥️ Connect to Hetzner VPS from Windows - Complete Guide

## What You Need

A way to connect to your Linux server (2.28.6.68) from Windows and run Linux commands.

---

## ✅ OPTION 1: Windows Terminal + SSH (EASIEST) ⭐ RECOMMENDED

### What is it?
Built-in SSH client in Windows (no installation needed)

### How to use:

#### Step 1: Open Windows Terminal
```
Press: Windows Key + X
Select: Windows Terminal (Admin)

Or search for "Terminal" in Start menu
```

#### Step 2: Connect to your server
```bash
ssh root@2.28.6.68
```

#### Step 3: Enter password
```
Password: [The one Hetzner sent you]
Or no password if SSH key is set up
```

#### Step 4: You're in!
```
Welcome to Ubuntu 22.04
root@imperial-codex-app:~#

Now run Linux commands!
```

### Example commands:
```bash
docker ps
docker logs -f imperial-codex
cd /root/imperial-codex
ls -la
```

---

## ✅ OPTION 2: MobaXterm (BEST WITH GUI)

### What is it?
Professional SSH client with file explorer and GUI

### Download:
https://mobaxterm.mobatek.net/

### Free version available: YES

### How to use:

#### Step 1: Download & Install
- Go to https://mobaxterm.mobatek.net/download.html
- Download Home Edition (free)
- Install normally

#### Step 2: Create Session
```
1. Click "Session" (top left)
2. Click "SSH"
3. Remote host: 2.28.6.68
4. Username: root
5. Click "OK"
```

#### Step 3: Connect
```
First time: Enter password (or use SSH key)
Then you're connected!
```

### Features:
- ✅ Terminal on right side
- ✅ File browser on left side
- ✅ Drag & drop files
- ✅ Built-in text editor
- ✅ Clean interface

---

## ✅ OPTION 3: PuTTY (Simple & Classic)

### What is it?
Lightweight SSH client, been around for 20+ years

### Download:
https://www.putty.org/

### How to use:

#### Step 1: Download & Install
- Go to https://www.putty.org/
- Download installer
- Install normally

#### Step 2: Create connection
```
1. Open PuTTY
2. Host Name: 2.28.6.68
3. Port: 22 (default)
4. Connection type: SSH
5. Click "Open"
```

#### Step 3: Connect
```
login as: root
Password: [Enter your password]
```

---

## ✅ OPTION 4: VS Code Remote SSH (FOR CODING)

### What is it?
If you want to edit files on server directly in VS Code

### How to set up:

#### Step 1: Install VS Code
https://code.visualstudio.com/

#### Step 2: Install Extension
- Open VS Code
- Extensions (Ctrl+Shift+X)
- Search: "Remote - SSH"
- Install by Microsoft

#### Step 3: Connect
```
1. Press Ctrl+Shift+P
2. Type: "Remote-SSH: Connect to Host..."
3. Select "Add New SSH Host..."
4. Enter: root@2.28.6.68
5. Choose config file location
6. Click "Connect"
```

#### Step 4: You're in!
- Edit files on server directly
- Terminal built-in
- Full Linux development environment

---

## 📊 Comparison Table

| Option | Easy? | GUI? | File Transfer | Cost | Best For |
|--------|-------|------|---|---|---|
| **Windows Terminal** | ⭐⭐⭐ | ❌ | ❌ | FREE | Quick commands |
| **MobaXterm** | ⭐⭐ | ✅ | ✅ | FREE | All-in-one tool |
| **PuTTY** | ⭐⭐ | ❌ | ❌ | FREE | Simple SSH |
| **VS Code SSH** | ⭐ | ✅ | ✅ | FREE | Coding/editing |

---

## 🎯 MY RECOMMENDATION

### For your use case:
**Use MobaXterm** (Option 2)

Why?
- ✅ Easy to use
- ✅ File browser on left
- ✅ Terminal on right
- ✅ Drag & drop files
- ✅ Professional interface
- ✅ Free version works great

---

## 🚀 QUICK SETUP - MobaXterm

### Step 1: Download
```
https://mobaxterm.mobatek.net/download.html
→ Click Home Edition (Free)
→ Download
→ Install
```

### Step 2: Create Session
```
1. Launch MobaXterm
2. Click "Session" (top left)
3. Click "SSH"
4. Remote host: 2.28.6.68
5. Username: root
6. Click "OK"
```

### Step 3: Connect
```
Enter password when prompted
(Or SSH key if you set it up)
```

### Step 4: You're in!
```
Left side: File browser
Right side: Terminal
Run commands!
```

---

## 📝 Example Commands You'll Run

Once connected (via any option):

```bash
# Check if Docker is running
docker ps

# View logs
docker logs -f imperial-codex

# Restart app
docker compose -f docker-compose.coolify.yml restart

# Check resources
docker stats

# View files
ls -la /root/imperial-codex

# Edit file
nano .env.production.local

# Deploy
cd /root/imperial-codex && ./build.sh
```

---

## 🆘 TROUBLESHOOTING

### "Connection refused"
```
Problem: Can't connect to 2.28.6.68
Solution: 
  1. Verify IP address is correct
  2. Check server is running in Hetzner console
  3. Try again in 30 seconds
```

### "Authentication failed"
```
Problem: Wrong password
Solution:
  1. Check email from Hetzner for password
  2. Reset password in Hetzner console
  3. Try again
```

### "Permission denied (publickey)"
```
Problem: SSH key not set up
Solution:
  1. Use password instead
  2. Or set up SSH key in Hetzner console
  3. See SSH key setup guide
```

---

## 🔑 SSH Key Setup (Optional but Better)

If you want passwordless access:

### Step 1: Create SSH key (Windows Terminal)
```bash
# Windows Terminal
ssh-keygen -t rsa -b 4096

# Just press Enter for all prompts
```

### Step 2: Add to Hetzner
```
1. Go to Hetzner console
2. Click your server
3. SSH Keys section
4. Add your public key
```

### Step 3: Connect (now without password!)
```bash
ssh root@2.28.6.68
# No password needed!
```

---

## 📚 Reference

| Task | Command |
|------|---------|
| Connect | `ssh root@2.28.6.68` |
| View containers | `docker ps` |
| View logs | `docker logs -f imperial-codex` |
| Restart app | `docker restart imperial-codex` |
| Stop app | `docker compose down` |
| Start app | `docker compose up -d` |
| Update app | `git pull && ./build.sh` |

---

## ✅ Summary

### To connect to your Hetzner VPS from Windows:

**Option A - Simplest (No install)**
```
Open Windows Terminal
Type: ssh root@2.28.6.68
Done!
```

**Option B - Best UI (Recommended)**
```
1. Download MobaXterm (free)
2. Create SSH session to 2.28.6.68
3. Connect
4. File browser + Terminal ready!
```

**Option C - For Coding**
```
Use VS Code Remote SSH extension
Code on server directly!
```

Pick any option and you can run all Linux commands from Windows!

---

**Which option would you like to use?**

I recommend **MobaXterm** for the best experience!
