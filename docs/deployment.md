# Imperial Codex — Deployment Guide

This guide covers deploying Imperial Codex v16 to Vercel with Supabase as the persistence layer.

For comprehensive service integration documentation (AWS, Docker, GitHub, Qdrant, Pinecone, Redis), see [Service Integration Guide](service-integration.md).

For monitoring and observability documentation, see [Monitoring Guide](monitoring.md).

---

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) account
- An [OpenAI](https://platform.openai.com) API key
- An [Anthropic](https://console.anthropic.com) API key
- Node.js 20+ installed locally

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose a name (e.g., `imperial-codex`), set a strong database password, and select the **US East (N. Virginia)** region for lowest latency with Vercel's `iad1` region.
4. Wait for the project to provision (~2 minutes).

---

## Step 2: Run the Database Migration

1. In the Supabase dashboard, go to **SQL Editor**.
2. Open the file `/supabase/migrations/20260101000000_initial_schema.sql` from this repository.
3. Paste the entire contents into the SQL Editor and click **Run**.
4. Verify all 9 tables appear in the **Table Editor**: `audit_log`, `loop_execution_log`, `instruments`, `instrument_registry`, `capital_allocations`, `capital_allocation_failures`, `vault`, `agent_conversations`, `agent_messages`.

---

## Step 3: Collect Environment Variables

From the Supabase dashboard, go to **Project Settings → API**:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Project URL (e.g., `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret) |

Generate the remaining secrets locally:

```bash
# VAULT_ENCRYPTION_KEY (64-char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# SESSION_SECRET (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your Git repository (GitHub, GitLab, or Bitbucket).
3. Vercel will auto-detect Next.js — no framework configuration needed.

---

## Step 5: Set Environment Variables in Vercel

1. In the Vercel project dashboard, go to **Settings → Environment Variables**.
2. Add all 9 variables from `.env.example`:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VAULT_ENCRYPTION_KEY`
   - `SESSION_SECRET`
   - `CRON_SECRET`
   - `WEBHOOK_ALERT_URL` (optional)
3. Set all variables for **Production**, **Preview**, and **Development** environments.

---

## Step 6: Deploy

1. Click **Deploy** in the Vercel dashboard, or push to your main branch.
2. Vercel will build and deploy the application.
3. The build should complete in ~2 minutes.

---

## Step 7: Verify Cron Jobs

1. In the Vercel project dashboard, go to **Settings → Cron Jobs**.
2. Verify two cron jobs appear:
   - `*/15 * * * *` → `/api/agent/cron` (loop evaluation every 15 minutes)
   - `0 6 * * *` → `/api/agent/cron` (daily summary at 06:00 UTC)
3. Click **Trigger** on either job to test it manually.
4. Check the function logs to confirm the cron executed successfully.

---

## Step 8: Verify the Deployment

```bash
# Check system status
curl https://your-deployment.vercel.app/api/status

# Expected response:
# { "version": "v16.2", "status": "active" }
```

---

## Troubleshooting

### Kernel halted on startup
- Check that `/core/KERNEL_V16_MASTER.md` exists and contains all 36 OS Module slugs.
- Check the Vercel function logs for `KERNEL_FILE_MISSING` or `KERNEL_VALIDATION_FAILED`.

### Supabase connection errors
- Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.
- Ensure the migration SQL has been applied (check the Table Editor in Supabase).

### Cron jobs not running
- Verify `CRON_SECRET` is set in Vercel environment variables.
- Check that `vercel.json` is present at the repository root.
- Cron jobs require a Pro or Enterprise Vercel plan for custom schedules.

### Claude API unavailable
- The system automatically falls back to template-based Strike Output generation.
- Check `ANTHROPIC_API_KEY` is valid and has sufficient credits.
- Check Vercel function logs for `CLAUDE_API_UNAVAILABLE` entries.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in .env.local with your values

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Next Steps

1. **Set up monitoring** — Configure Vercel and AWS CloudWatch dashboards
2. **Review service integration** — Understand how all services work together
3. **Configure alerting** — Set up Slack notifications for critical alerts
4. **Start developing** — Begin implementing features using the integrated services
