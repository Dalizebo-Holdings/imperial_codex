# Server Setup Guide: root@2.28.6.68

## Overview

This guide walks you through setting up your server at **2.28.6.68** for automated deployments via GitHub Actions.

---

## Step 1: Run Server Setup Script

SSH into your server and run the setup script to configure Docker, create the deploy user, and prepare directories.

```bash
# SSH to server
ssh root@2.28.6.68

# Run setup (copy-paste all at once)
bash << 'EOF'
set -e
echo "🔧 Setting up deployment infrastructure..."

# Update and install dependencies
apt-get update
apt-get install -y curl wget git docker.io docker-compose-plugin jq

# Enable Docker
systemctl enable docker
systemctl start docker

# Create deploy user
if ! id -u deploy > /dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy

# Setup SSH for deploy user
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy cat > /home/deploy/.ssh/config << 'SSHEOF'
Host github.com
    HostName github.com
    User git
    StrictHostKeyChecking no
SSHEOF
sudo -u deploy chmod 600 /home/deploy/.ssh/config

# Create deployment directories
mkdir -p /home/deploy/imperial-codex/{logs,backups}
chown -R deploy:deploy /home/deploy/imperial-codex
sudo -u deploy touch /home/deploy/imperial-codex/.env
sudo -u deploy chmod 600 /home/deploy/imperial-codex/.env

# Docker registry config
sudo -u deploy mkdir -p /home/deploy/.docker
cat > /home/deploy/.docker/config.json << 'DOCKEREOF'
{
  "auths": {
    "docker.io": {},
    "ghcr.io": {}
  }
}
DOCKEREOF
chown -R deploy:deploy /home/deploy/.docker
chmod 600 /home/deploy/.docker/config.json

# Health check script
cat > /home/deploy/imperial-codex/health-check.sh << 'HCEOF'
#!/bin/bash
APP_URL="http://localhost:3000"
for i in {1..30}; do
  if curl -sf ${APP_URL}/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
    exit 0
  fi
  echo "Attempt $i/30..."
  sleep 2
done
echo "❌ Health check failed"
exit 1
HCEOF
chmod +x /home/deploy/imperial-codex/health-check.sh
chown deploy:deploy /home/deploy/imperial-codex/health-check.sh

# Deployment script
cat > /home/deploy/imperial-codex/deploy.sh << 'DEPLOYEOF'
#!/bin/bash
set -e
DEPLOY_DIR="/home/deploy/imperial-codex"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

echo "🚀 Deploying at $(date)"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ docker-compose.prod.yml not found"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env not found"
  exit 1
fi

docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d

if "$DEPLOY_DIR/health-check.sh"; then
  echo "✅ Deployment successful"
  docker image prune -af --filter "until=72h" 2>/dev/null || true
else
  echo "❌ Health check failed"
  docker compose -f "$COMPOSE_FILE" logs --tail=50 app
  exit 1
fi
DEPLOYEOF
chmod +x /home/deploy/imperial-codex/deploy.sh
chown deploy:deploy /home/deploy/imperial-codex/deploy.sh

echo "✅ Server setup complete!"
echo "Docker: $(docker --version)"
echo "Deploy user: $(id deploy)"
echo ""
EOF
```

---

## Step 2: Generate SSH Key for GitHub Actions

On your **local machine** (not the server):

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy@imperial-codex"

# View the private key (copy to GitHub Secrets)
cat deploy_key

# View the public key (copy to server)
cat deploy_key.pub
```

---

## Step 3: Add Public Key to Server

SSH into your server and add the public key:

```bash
# SSH to server
ssh root@2.28.6.68

# Add the public key to deploy user's authorized_keys
# (paste the contents of deploy_key.pub)
mkdir -p /home/deploy/.ssh
cat >> /home/deploy/.ssh/authorized_keys << 'KEYEOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions-deploy@imperial-codex
KEYEOF

# Set correct permissions
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh

# Verify
su - deploy -c 'ls -la ~/.ssh/'
```

---

## Step 4: Copy docker-compose.prod.yml to Server

From your **local machine**:

```bash
scp docker-compose.prod.yml deploy@2.28.6.68:/home/deploy/imperial-codex/
```

---

## Step 5: Create .env File on Server

SSH and create the environment file:

```bash
ssh deploy@2.28.6.68

# Edit .env (use nano or vim)
nano /home/deploy/imperial-codex/.env
```

Paste your environment variables:

```bash
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=claude-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VAULT_ENCRYPTION_KEY=...
NEXT_PUBLIC_APP_URL=https://yourapp.com
SESSION_SECRET=...
CRON_SECRET=...
WEBHOOK_ALERT_URL=...
SLACK_BOT_TOKEN=...
GITHUB_TOKEN=...
GITHUB_REPO=your-org/your-repo
MCP_SERVER_URL=http://localhost:3001
```

Save and exit (`Ctrl+X`, `Y`, `Enter` in nano).

---

## Step 6: Test Deployment Locally

SSH to server and test the deployment script:

```bash
ssh deploy@2.28.6.68

cd /home/deploy/imperial-codex
./deploy.sh
```

Expected output:
```
🚀 Deploying at ...
✅ Deployment successful
```

---

## Step 7: Add GitHub Secrets

In your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `DEPLOY_HOST` | `2.28.6.68` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_KEY` | (contents of local `deploy_key` file) |
| `DEPLOY_PATH` | `/home/deploy/imperial-codex` |
| `DOCKER_HUB_USERNAME` | (your Docker Hub username) |
| `DOCKER_HUB_TOKEN` | (your Docker Hub token) |
| `SLACK_WEBHOOK_URL` | (optional: Slack webhook for notifications) |

---

## Step 8: Login to Docker Registries

SSH to server as deploy user and login:

```bash
ssh deploy@2.28.6.68

# Login to Docker Hub
docker login -u your-docker-username

# Login to GitHub Container Registry
echo $YOUR_GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin
```

Or configure credentials in `/home/deploy/.docker/config.json`:

```bash
cat > ~/.docker/config.json << 'EOF'
{
  "auths": {
    "docker.io": {
      "auth": "base64(username:token)"
    },
    "ghcr.io": {
      "auth": "base64(username:token)"
    }
  }
}
EOF
```

---

## Step 9: Test Workflow

Push a tag to trigger the workflow:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Monitor in GitHub:
- **Actions tab** → watch `Build → Test → Scan → Push` workflow
- Once complete, `Deploy & Verify Production` triggers automatically (if tag)
- Check **Actions logs** for deployment details

---

## Step 10: Verify Deployment

After workflow completes, SSH to server:

```bash
ssh deploy@2.28.6.68

# Check container status
docker compose -f /home/deploy/imperial-codex/docker-compose.prod.yml ps

# View logs
docker compose -f /home/deploy/imperial-codex/docker-compose.prod.yml logs -f app

# Test health endpoint
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### GitHub Actions can't connect to server
- Verify `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, `DEPLOY_PATH` secrets are set
- Test SSH locally: `ssh -i deploy_key deploy@2.28.6.68 'ls /home/deploy/imperial-codex'`
- Check server firewall: `sudo ufw allow 22/tcp`

### Health check fails after deployment
- SSH to server: `ssh deploy@2.28.6.68`
- Check logs: `docker compose -f /home/deploy/imperial-codex/docker-compose.prod.yml logs app`
- Verify `/api/health` endpoint exists in your app
- Check environment variables in `.env` are correct

### Docker login fails
- Verify credentials: `ssh deploy@2.28.6.68 'cat ~/.docker/config.json'`
- Regenerate token: Docker Hub → Account Settings → Security → Personal Access Tokens

### Port 3000 not accessible
- SSH to server: `ssh deploy@2.28.6.68`
- Check port is published: `docker ps | grep imperial`
- Test locally: `curl http://localhost:3000`
- Check firewall: `sudo ufw allow 3000/tcp`

### Container exits immediately
- SSH to server and check logs: `docker compose -f /home/deploy/imperial-codex/docker-compose.prod.yml logs app`
- Verify all required environment variables are in `.env`
- Check `/app/core`, `/app/vault`, `/app/rituals` directories exist (if using volumes)

---

## Monitoring & Maintenance

### View logs
```bash
ssh deploy@2.28.6.68
docker compose -f /home/deploy/imperial-codex/docker-compose.prod.yml logs -f app
```

### Manual deployment
```bash
ssh deploy@2.28.6.68
/home/deploy/imperial-codex/deploy.sh
```

### Rollback to previous version
```bash
ssh deploy@2.28.6.68
cd /home/deploy/imperial-codex
docker compose -f docker-compose.prod.yml down
docker pull ghcr.io/your-org/your-repo:previous-tag
docker compose -f docker-compose.prod.yml up -d
```

### Check disk space
```bash
ssh deploy@2.28.6.68
docker system df
docker system prune -a --volumes  # Clean up unused images/volumes
```

---

## Security Notes

- SSH keys are generated without passphrase for CI/CD automation
- Deploy user is added to `docker` group (equivalent to root access in containers)
- `.env` file contains secrets — never commit to git
- Firewall should restrict SSH access to GitHub Actions IPs or specific machines
- Consider using SSH keys with IP restrictions for additional security

---

## Next Steps

1. ✅ Run server setup script
2. ✅ Generate SSH key and add to authorized_keys
3. ✅ Copy docker-compose.prod.yml to server
4. ✅ Create .env file with secrets
5. ✅ Test deployment locally
6. ✅ Add GitHub Secrets
7. ✅ Push a tag to trigger workflow
8. ✅ Monitor deployment in GitHub Actions
9. ✅ Verify app is running: `curl http://2.28.6.68:3000/api/health`

Good to go! 🚀
