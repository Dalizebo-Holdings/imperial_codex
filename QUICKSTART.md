# Coolify & Self-Hosted Server Setup - Quick Reference

## Files Created

✓ **docker-compose.coolify.yml** - Optimized for Coolify deployments
✓ **docker-compose.server.yml** - Full stack with Nginx for self-hosted VPS
✓ **nginx.conf** - Production-ready reverse proxy with SSL/TLS
✓ **build.sh** - Build script for Docker image
✓ **deploy.sh** - Automated deployment script
✓ **DEPLOYMENT_GUIDE.md** - Complete deployment documentation

---

## Quick Start

### 1. COOLIFY (Recommended for beginners)
```bash
# On your VPS with Coolify installed:
docker compose -f docker-compose.coolify.yml up -d
```
Access: `http://your-server.com:3000`

### 2. SELF-HOSTED SERVER WITH NGINX (Production)
```bash
# Set up SSL certificates first
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem

# Deploy full stack
docker compose -f docker-compose.server.yml up -d
```
Access: `https://your-server.com` (auto-redirects HTTP→HTTPS)

### 3. AUTOMATED DEPLOYMENT (Recommended)
```bash
# Builds image, starts containers, verifies health
./deploy.sh coolify    # For Coolify
# OR
./deploy.sh server     # For self-hosted with Nginx
```

---

## Environment Setup

Create `.env.production.local`:
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
# Add your API keys here
```

---

## Key Features Configured

✓ **Multi-stage Docker build** - Smaller images (~200-300MB)
✓ **Security** - Non-root user, read-only filesystem, dropped capabilities
✓ **Health checks** - Automatic restart on failure
✓ **Resource limits** - CPU and memory constraints
✓ **Logging** - JSON file driver with rotation (10MB max)
✓ **Data persistence** - Named volumes for cache
✓ **Nginx reverse proxy** - SSL/TLS, compression, rate limiting, caching
✓ **Asset caching** - Static files cached 1 year in browser
✓ **Rate limiting** - DDoS protection (10r/s general, 30r/s API)

---

## Monitoring

```bash
# View logs
docker compose -f docker-compose.coolify.yml logs -f

# Check container status
docker compose -f docker-compose.coolify.yml ps

# View resource usage
docker stats imperial-codex

# Health endpoint
curl http://localhost:3000/health
```

---

## Useful Commands

```bash
# Restart app
docker compose -f docker-compose.coolify.yml restart imperial-codex

# Stop everything
docker compose -f docker-compose.coolify.yml down

# View container details
docker inspect imperial-codex

# Exec into container
docker exec -it imperial-codex sh

# View image size
docker images imperial-codex

# Update and redeploy
git pull && ./build.sh && docker compose -f docker-compose.coolify.yml up -d
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port in compose file: `8000:3000` |
| App won't start | Check logs: `docker logs imperial-codex` |
| High memory usage | Increase limit: `memory: 4G` in compose file |
| Nginx 502 error | Container unreachable: `docker compose logs imperial-codex` |
| SSL certificate issues | Regenerate: `openssl req -x509...` or use Let's Encrypt |

---

## Next Steps

1. Read **DEPLOYMENT_GUIDE.md** for detailed setup instructions
2. Push image to Docker Hub (optional): `docker push your-user/imperial-codex`
3. Set up monitoring/alerts (Docker events, Prometheus, etc.)
4. Configure backup strategy for data volumes
5. Set up CI/CD pipeline for automated deploys (GitHub Actions, GitLab CI)

---

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed (for Nginx)
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Resource limits tested
- [ ] Backups configured
- [ ] Firewall rules set (80, 443 open)
- [ ] Domain DNS configured
- [ ] Rate limiting tested
- [ ] Performance benchmarked
