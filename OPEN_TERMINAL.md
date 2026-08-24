# Open Terminal in VS Code Remote Container

## Method 1: Built-in Terminal (Easiest)

1. Inside VS Code (after attaching to container), press: **Ctrl+\`** (backtick)
2. A terminal opens at the bottom showing `/app` (container path)
3. You're now inside the container shell

This should show something like:
```
nextjs@<container-id>:/app$
```

---

## Method 2: Command Palette

1. **Ctrl+Shift+P** (open Command Palette)
2. Type: **Terminal: Create New Terminal**
3. Terminal opens in container

---

## Method 3: Menu

1. **View** → **Terminal**
2. Terminal opens at bottom

---

## Once Terminal is Open

Then run these commands **inside the container terminal**:

```bash
# Verify you're in the container
pwd
# Should show: /app

# Install extensions
bash install-ai-extensions.sh

# Verify Model Runner is reachable
curl http://model-runner:12434/health
# Should return: {"status":"ok"}

# List models
docker model list
```

---

## If Still Can't Open Terminal

**Alternative: Use VS Code's integrated command execution**

1. **Ctrl+Shift+P** → **Tasks: Run Task**
2. Or create a `.vscode/tasks.json` file I can generate for you

Would you like me to create a tasks.json for one-click execution?
