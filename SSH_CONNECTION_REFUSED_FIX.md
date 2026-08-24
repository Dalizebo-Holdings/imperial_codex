# 🔧 SSH "Connection Refused" - Troubleshooting Guide

## Your Situation

- **Was working, now broken** ⚠️
- **Rename didn't update in console** ⚠️ (possible clue!)
- **Server shows "Running" (green)** in Hetzner
- **Error**: Connection refused (not timeout)

---

## 🎯 IMPORTANT CLUE

**"Rename didn't update"** + **"SSH now refused"** suggests:

Possible scenarios:
1. Hetzner console has a caching/sync delay
2. Server might have been **rebuilt/reset** accidentally
3. **IP address might have changed** during rename attempt
4. A **firewall rule** was accidentally applied

---

## 🚀 STEP-BY-STEP TROUBLESHOOTING

### STEP 1: Verify Current IP Address

```
1. Go to Hetzner Console: https://console.hetzner.cloud
2. Click on your server
3. Look at "IP Address" field
4. Confirm it's still: 2.28.6.68
```

**⚠️ If IP changed**, that's your problem! Use the NEW IP instead.

---

### STEP 2: Check Server Status Details

```
In Hetzner Console:
1. Click your server
2. Look for "Console" tab or "Open Console" button
3. This opens a web-based terminal (VNC-like)
4. Try logging in directly from browser
```

This bypasses SSH entirely and connects directly to the server.

---

### STEP 3: Use Hetzner Web Console (Bypass SSH)

```
1. In Hetzner dashboard, click your server
2. Find "Console" or "VNC Console" button
3. Click it - opens browser-based terminal
4. Login with root and password
```

**This works even if SSH is broken!**

Once in the web console, run:
```bash
# Check if SSH service is running
systemctl status sshd

# If not running, start it
systemctl start sshd
systemctl enable sshd

# Check if firewall is blocking
ufw status

# If UFW is blocking SSH, allow it
ufw allow 22/tcp
ufw reload
```

---

### STEP 4: Check Hetzner Cloud Firewall

```
1. In Hetzner Console, go to "Firewalls" (left sidebar)
2. Check if any firewall is attached to your server
3. If yes, click on it
4. Verify port 22 (SSH) is allowed for INBOUND traffic
5. If not, add rule:
   - Direction: Inbound
   - Protocol: TCP
   - Port: 22
   - Source: 0.0.0.0/0 (or your IP)
```

**This is a COMMON cause of "Connection Refused"!**

---

### STEP 5: Verify Server Didn't Get Recreated

```
Check Hetzner console:
1. Confirm server "Created" date matches when you set it up
2. If it shows a NEW/recent creation time, it might have been rebuilt
3. Check if your files/data are still there (via web console)
```

---

### STEP 6: Test Connection Manually

From MobaXterm or Windows Terminal:

```bash
# Test if port 22 is reachable
telnet 2.28.6.68 22

# Or use PowerShell
Test-NetConnection -ComputerName 2.28.6.68 -Port 22
```

**Results:**
- ✅ "Connected" = Port is open, MobaXterm config issue
- ❌ "Connection refused" = Server-side issue (firewall/SSH service)
- ⏱️ "Timeout" = Network/firewall blocking silently

---

## 🔍 MOST LIKELY CAUSES (In Order)

### 1. Hetzner Cloud Firewall Blocking Port 22 ⭐ MOST LIKELY

```
Fix:
1. Hetzner Console → Firewalls
2. Find firewall attached to your server
3. Add inbound rule: TCP port 22, source 0.0.0.0/0
4. Save
5. Try SSH again
```

### 2. SSH Service Crashed/Stopped

```
Fix (via Web Console):
1. Open Hetzner web console (bypasses SSH)
2. Run: systemctl restart sshd
3. Run: systemctl enable sshd
4. Try SSH again from MobaXterm
```

### 3. UFW Firewall on Server Blocking SSH

```
Fix (via Web Console):
1. Open Hetzner web console
2. Run: ufw status
3. If active and blocking: ufw allow 22/tcp
4. Run: ufw reload
5. Try SSH again
```

### 4. IP Address Changed

```
Fix:
1. Check Hetzner console for current IP
2. Use new IP if different from 2.28.6.68
```

---

## 🚨 QUICK FIX: Use Hetzner Web Console

**This is your fastest path to fix things:**

```
1. Go to: https://console.hetzner.cloud
2. Click your server (imperial-codex-app or ubuntu-2gb-fsn1-1)
3. Look for "Console" button (usually top right or in server details)
4. Click it - opens browser-based terminal
5. Login: root
6. Password: [from Hetzner email]
```

**Once inside, run these commands:**

```bash
# Check SSH service
systemctl status sshd

# Restart it (just in case)
systemctl restart sshd

# Check firewall
ufw status

# If UFW shows "active" and blocks SSH:
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw reload

# Verify SSH is listening
netstat -tlnp | grep :22
```

---

## 🔥 IF NOTHING WORKS: Check Hetzner Cloud Firewall

**This is often the hidden culprit:**

```
1. Hetzner Console (left sidebar) → "Firewalls"
2. See if there's a firewall listed
3. Click on it
4. Check "Rules" tab
5. Look for port 22 (SSH)

IF PORT 22 IS NOT ALLOWED:
  1. Click "Add Rule"
  2. Direction: Inbound
  3. Protocol: TCP
  4. Port: 22
  5. Source: Any (0.0.0.0/0)
  6. Click "Add"
  7. Save/Apply firewall
```

---

## 📋 COMPLETE CHECKLIST

Run through this in order:

- [ ] **Check current IP** in Hetzner console (still 2.28.6.68?)
- [ ] **Try Hetzner Web Console** (bypasses SSH entirely)
- [ ] **Check Cloud Firewall** rules (port 22 allowed?)
- [ ] **Check SSH service** status via web console
- [ ] **Check UFW** firewall status via web console
- [ ] **Restart SSH service** if needed
- [ ] **Try MobaXterm again** after fixes

---

## 🎯 MOST LIKELY FIX (Try This First!)

Based on your symptoms (worked before, now refused + rename issue), I suspect:

### **Hetzner Cloud Firewall was accidentally enabled/misconfigured**

**Quick Fix:**
```
1. Hetzner Console → Firewalls
2. If firewall exists and attached to your server:
   → Either DELETE the firewall (if testing)
   → OR add rule allowing port 22 inbound
3. Save
4. Try SSH connection again
```

---

## 💡 ALTERNATIVE: Rebuild Server (Last Resort)

If nothing works and you haven't set up much yet:

```
1. Hetzner Console → Your Server
2. Click "Rebuild" (careful - this erases everything!)
3. Choose Ubuntu 22.04 again
4. Add SSH key properly this time
5. Start fresh
```

**Only do this if you haven't deployed your app yet!**

---

## 🆘 STILL STUCK?

### Get more info:

```bash
# From MobaXterm, try verbose SSH
ssh -vvv root@2.28.6.68

# This shows detailed connection attempt info
# Look for where it fails exactly
```

### Check these Hetzner sections:

1. **Firewalls** (left sidebar) - port 22 blocked?
2. **Networking** tab on server - any changes?
3. **Server** → **Rescue** - can you boot into rescue mode?

---

## 📞 NEXT STEPS

**Please try this RIGHT NOW:**

1. **Use Hetzner Web Console** (bypasses SSH)
   - Login directly through browser
   - This confirms server is accessible

2. **Check Firewalls section** in Hetzner
   - Look for any firewall blocking port 22
   - This is the MOST COMMON cause

3. **Report back**:
   - Can you access via Web Console?
   - Is there a firewall listed?
   - What does `systemctl status sshd` show?

---

## 🎯 SUMMARY

**Most likely fix:**
```
Hetzner Console → Firewalls → Check/Fix port 22 rule
```

**Backup fix:**
```
Hetzner Console → Your Server → Web Console → 
Run: systemctl restart sshd && ufw allow 22/tcp
```

Try the Web Console first - it will tell us definitively if this is a firewall issue or something else!

---

**Let me know what you find and I'll help you fix it completely!** 🚀
