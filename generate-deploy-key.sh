#!/bin/bash
# Generate SSH key for GitHub Actions deployment to 2.28.6.68

set -e

echo "🔑 Generating SSH key for GitHub Actions..."
echo ""

KEY_FILE="deploy_key"
PUBKEY_FILE="${KEY_FILE}.pub"

# Generate SSH key (no passphrase for CI/CD)
ssh-keygen -t ed25519 -f "$KEY_FILE" -N "" -C "github-actions-deploy@imperial-codex"

echo ""
echo "✅ SSH key generated!"
echo ""
echo "📋 Key files created:"
echo "  - $KEY_FILE (private key — add to GitHub Secrets)"
echo "  - $PUBKEY_FILE (public key — add to server)"
echo ""

# Display the public key
echo "📌 PUBLIC KEY (add to /home/deploy/.ssh/authorized_keys on server):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$PUBKEY_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Display the private key (for GitHub Secrets)
echo "🔐 PRIVATE KEY (copy to GitHub Secrets as 'DEPLOY_KEY'):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$KEY_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Next steps:"
echo ""
echo "1️⃣  Run server setup on 2.28.6.68:"
echo "   bash server-setup.sh"
echo ""
echo "2️⃣  Add public key to server:"
echo "   ssh root@2.28.6.68 'mkdir -p /home/deploy/.ssh && cat >> /home/deploy/.ssh/authorized_keys' << 'KEYEOF'"
cat "$PUBKEY_FILE"
echo "KEYEOF"
echo ""
echo "3️⃣  Add GitHub Secrets (Settings → Secrets and variables → Actions):"
echo ""
echo "   Secret: DEPLOY_HOST"
echo "   Value:  2.28.6.68"
echo ""
echo "   Secret: DEPLOY_USER"
echo "   Value:  deploy"
echo ""
echo "   Secret: DEPLOY_KEY"
echo "   Value:  (paste contents of $KEY_FILE)"
echo ""
echo "   Secret: DEPLOY_PATH"
echo "   Value:  /home/deploy/imperial-codex"
echo ""
echo "4️⃣  Copy docker-compose.prod.yml to server:"
echo "   scp docker-compose.prod.yml deploy@2.28.6.68:/home/deploy/imperial-codex/"
echo ""
echo "5️⃣  Create .env on server (via SSH):"
echo "   ssh deploy@2.28.6.68 'nano /home/deploy/imperial-codex/.env'"
echo ""
echo "✅ Setup complete when all steps are done!"
echo ""
