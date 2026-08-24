# 📝 Hetzner Naming Guide - What to Name Your Project & Server

## Quick Answer

### **Project Name**: `imperial-codex`
### **Server Name**: `imperial-codex-main` or `imperial-codex-prod`

---

## 🎯 Naming Strategy

### **Project Name** (Top-level organization)

What it is: Container for all your infrastructure in Hetzner console

**Good Options:**
- `imperial-codex` ✅ Simple, clear
- `imperial-codex-prod` ✅ Indicates production
- `codex-project` ✅ If you want shorter
- `imperial-platform` ✅ If multiple apps

**I recommend:** `imperial-codex`

---

### **Server Name** (Individual machine)

What it is: Your CX23 machine running the app

**Good Options:**
- `imperial-codex-app` ✅ Clear purpose
- `imperial-codex-main` ✅ Main server
- `imperial-codex-prod` ✅ Production server
- `imperial-codex-1` ✅ Good for scaling (add -2, -3 later)
- `codex-web-01` ✅ Professional naming

**I recommend:** `imperial-codex-app` or `imperial-codex-main`

---

## 📋 Naming Conventions

### **For Single Server (You Now)**

| Name Type | Example | Notes |
|-----------|---------|-------|
| Simple | `imperial-codex` | Works, but ambiguous |
| Purpose-clear | `imperial-codex-app` ⭐ | Best - shows it's app server |
| Environment | `imperial-codex-prod` | Good - shows production |
| Numbered | `imperial-codex-01` | Good for future scaling |

**I recommend:** `imperial-codex-app`

---

### **For Future Scaling** (If you expand later)

If you add more servers:

```
imperial-codex-app-01   (main app)
imperial-codex-app-02   (load balance)
imperial-codex-db-01    (database server)
imperial-codex-cache-01 (redis/cache)
```

But you're starting simple, so just: `imperial-codex-app`

---

## 🏗️ Full Hetzner Setup Example

```
CONSOLE STRUCTURE:
└── Project: imperial-codex
    └── Server: imperial-codex-app
        ├── Specs: CX23
        ├── OS: Ubuntu 22.04
        ├── IP: 192.0.2.123
        └── App: Imperial Codex (Next.js)
```

---

## 💡 Naming Best Practices

### **DO:**
✅ Use lowercase (Hetzner preference)
✅ Use hyphens `-` not underscores `_`
✅ Keep it short but descriptive
✅ Include purpose (app, db, cache, etc.)
✅ Make it memorable
✅ Be consistent

### **DON'T:**
❌ Use spaces (won't work)
❌ Use special characters
❌ Use UPPERCASE (hard to read)
❌ Be too generic (`server1`, `app`, `web`)
❌ Use underscores (use hyphens instead)

---

## 🎯 RECOMMENDED NAMING

### **For Your Setup:**

**Project Name in Hetzner:**
```
imperial-codex
```

**Server Name in Hetzner:**
```
imperial-codex-app
```

**Why this works:**
- Clear what it is
- Easy to remember
- Professional
- Scales well (can add -db, -cache later)
- All lowercase with hyphens

---

## 📝 Step-by-Step Setup

### **In Hetzner Console:**

1. **Create Project:**
   - Click "Create Project"
   - Name: `imperial-codex`
   - Click "Create"

2. **Create Server:**
   - Click "Add Server"
   - Server Name: `imperial-codex-app`
   - Image: Ubuntu 22.04
   - Type: CX23
   - Location: Choose one
   - Add SSH key
   - Click "Create & Buy Now"

3. **Result:**
   ```
   Hetzner Console
   └── Project: imperial-codex
       └── Server: imperial-codex-app
   ```

---

## 🔄 If You Add More Servers Later

**Naming pattern:**

```
Project: imperial-codex

Servers:
├── imperial-codex-app-01    (main app)
├── imperial-codex-app-02    (backup app)
├── imperial-codex-db-01     (database)
└── imperial-codex-cache-01  (redis)
```

**But for now, just:**
```
Project: imperial-codex
Server:  imperial-codex-app
```

---

## 📊 Alternative Naming Schemes

### **Option 1: Simple** (Recommended)
```
Project: imperial-codex
Server:  imperial-codex-app
```

### **Option 2: Numbered** (Good for scaling)
```
Project: imperial-codex
Server:  imperial-codex-01
```

### **Option 3: Environment** (Good for multiple envs)
```
Project: imperial-codex
Server:  imperial-codex-prod
```

### **Option 4: Descriptive** (Very clear)
```
Project: imperial-codex
Server:  imperial-codex-main-app
```

---

## ✅ My Final Recommendation

### **Use This:**

```
Hetzner Project:  imperial-codex
Hetzner Server:   imperial-codex-app
SSH Hostname:     root@imperial-codex-app
Application:      Imperial Codex (Next.js)
Domain (later):   imperial-codex.com
```

**Why:**
- ✅ Clear and professional
- ✅ Easy to remember
- ✅ Scales well
- ✅ Consistent naming
- ✅ No confusion

---

## 🎯 During Hetzner Setup

**When creating:**

```
Project Name field:
└─ imperial-codex

Server Name field:
└─ imperial-codex-app
```

That's it!

---

## 📝 Quick Reference

| Where | What | Example |
|-------|------|---------|
| Hetzner Project | Container for all resources | `imperial-codex` |
| Hetzner Server | Your CX23 machine | `imperial-codex-app` |
| SSH Connection | How to access | `ssh root@imperial-codex-app` |
| Domain (later) | Public URL | `imperial-codex.com` |
| Docker App Name | Container name | `imperial-codex` (auto) |

---

## ✨ After Deployment

Once deployed, your infrastructure will look like:

```
🌐 Domain (optional):        imperial-codex.com
     ↓
🖥️  Hetzner Server:          imperial-codex-app (192.0.2.123)
     ↓
🐳 Docker Container:          imperial-codex
     ↓
🚀 Application:               Imperial Codex (Next.js)
```

---

## 🚀 Summary

**Just use:**
- Project: `imperial-codex`
- Server: `imperial-codex-app`

**Done!** No need to overthink it. These names are:
- ✅ Professional
- ✅ Clear
- ✅ Scalable
- ✅ Easy to remember

---

**Final Answer:** Name your Hetzner project `imperial-codex` and your server `imperial-codex-app`

That's perfect for what you're building! 🎉
