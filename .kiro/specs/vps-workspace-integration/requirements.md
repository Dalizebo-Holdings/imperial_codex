# Requirements Document

## Introduction

This feature integrates a VPS (Virtual Private Server) — a Hetzner cloud server running Ubuntu 22.04 with HestiaCP as the control panel — into the imperial_codex workspace as a first-class infrastructure target. The VPS acts as a persistent compute layer that complements Vercel's serverless functions by hosting long-running services: Redis, AI agent workers, MCP servers, and background jobs. It is reachable via SSH, managed through HestiaCP, and wired into the existing GitHub Actions CI/CD pipeline for automated deployment. A health-monitoring API surface exposes VPS and service status to the Next.js application.

## Glossary

- **VPS**: The Hetzner cloud server running Ubuntu 22.04 with HestiaCP installed, accessible via a public IP and SSH.
- **HestiaCP**: The open-source server control panel installed on the VPS that manages web hosting, DNS, email, databases (MySQL/PostgreSQL), SSL certificates (Let's Encrypt), and cron jobs via a web UI and CLI (`v-*` commands).
- **SSH_Manager**: The service responsible for establishing, authenticating, and terminating SSH connections to the VPS from GitHub Actions or application API routes.
- **Deploy_Pipeline**: The GitHub Actions workflow responsible for building, pushing, and deploying Docker images or application files to the VPS.
- **Agent_Worker**: A long-running Docker container on the VPS that processes AI agent tasks (OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet) outside of Vercel's function time limits.
- **MCP_Server**: A Docker container on the VPS that exposes the Model Context Protocol endpoint used by AI clients (Claude Desktop, Cursor, Kiro).
- **Health_Monitor**: The service that periodically probes VPS connectivity, Docker service liveness, and exposes results via an API route.
- **Key_Store**: The encrypted repository of SSH private keys and deployment credentials, stored in GitHub Actions secrets and optionally in AWS Secrets Manager.
- **VPS_Docker_Stack**: The `docker-compose.vps.yml` file defining all services running on the VPS (Redis, Agent_Worker, MCP_Server, monitoring sidecar).
- **Clearance_Level**: The integer (0–2) representing the authenticated user's access tier enforced by iron-session.

---

## Requirements

### Requirement 1: SSH Key Management

**User Story:** As a developer and CI/CD pipeline, I want SSH access to the VPS to be securely managed with rotatable keys, so that deployments and remote commands can be executed without exposing plaintext credentials.

#### Acceptance Criteria

1. THE Key_Store SHALL hold exactly one Ed25519 SSH private key for the VPS deploy user, referenced by the GitHub Actions secret `VPS_SSH_PRIVATE_KEY`.
2. WHEN a GitHub Actions workflow requires SSH access, THE SSH_Manager SHALL authenticate using the key stored in `VPS_SSH_PRIVATE_KEY` without prompting for a passphrase; IF `VPS_SSH_PRIVATE_KEY` is empty or missing, THEN THE SSH_Manager SHALL attempt authentication using any cached keys available to the runner before failing the workflow step.
3. THE VPS SHALL accept SSH connections only from key-based authentication; password-based SSH authentication SHALL be disabled.
4. WHEN the SSH private key is rotated, THE Key_Store SHALL update `VPS_SSH_PRIVATE_KEY` in GitHub Actions secrets and `~/.ssh/authorized_keys` on the VPS atomically; IF either the GitHub Actions secret update or the VPS authorized_keys update fails, THEN THE Key_Store SHALL roll back both changes to their previous values before the rotation attempt.
5. IF an SSH connection attempt fails three consecutive times, THEN THE SSH_Manager SHALL emit a structured error log entry containing the timestamp, target host, and failure reason.
6. THE Key_Store SHALL store a separate read-only deploy key scoped to the GitHub repository for cloning source code on the VPS, distinct from the admin SSH key.

---

### Requirement 2: Docker-Based Deployment Pipeline

**User Story:** As a developer, I want every push to `main` to automatically build a Docker image and deploy it to the Hetzner VPS, so that production and VPS environments stay in sync without manual intervention.

#### Acceptance Criteria

1. WHEN a commit is pushed to the `main` branch, THE Deploy_Pipeline SHALL build the production Docker image using the multi-stage `Dockerfile` and push it to the container registry (Docker Hub or GHCR).
2. WHEN the image push succeeds, THE Deploy_Pipeline SHALL connect to the VPS via SSH and execute `docker compose -f docker-compose.vps.yml pull && docker compose -f docker-compose.vps.yml up -d` to deploy the updated stack.
3. WHEN a deployment completes and the health check returns HTTP 200 within the timeout, THE Deploy_Pipeline SHALL mark the deployment as successful and SHALL NOT trigger a rollback.
4. IF the health check fails after 3 retries, THEN THE Deploy_Pipeline SHALL execute `docker compose -f docker-compose.vps.yml rollback` or redeploy the previous image tag; IF the Slack API is unavailable or credentials are invalid, THEN THE Deploy_Pipeline SHALL log the notification failure locally and continue with the rollback rather than halting the pipeline.
5. THE Deploy_Pipeline SHALL prune dangling Docker images after a successful deployment to prevent disk exhaustion on the VPS.
6. WHEN a deployment is triggered manually via `workflow_dispatch`, THE Deploy_Pipeline SHALL accept an optional `image_tag` parameter to deploy a specific version rather than `latest`.
7. THE VPS_Docker_Stack SHALL define resource limits (`mem_limit`, `cpus`) for each service so no single container can exhaust VPS memory or CPU.

---

### Requirement 3: VPS Service Stack (Redis, Agent Workers, MCP Server)

**User Story:** As a developer, I want Redis, AI agent workers, and an MCP server to run persistently on the VPS as Docker services, so that long-running tasks and protocol servers are not constrained by Vercel function timeouts.

#### Acceptance Criteria

1. THE VPS_Docker_Stack SHALL define a `redis` service using the `redis:7-alpine` image with a persistent named volume for AOF (Append-Only File) data durability.
2. WHEN the `redis` service starts, THE VPS_Docker_Stack SHALL bind Redis to `127.0.0.1:6379` so it is not exposed to the public internet.
3. THE VPS_Docker_Stack SHALL define an `agent-worker` service that connects to Redis as its task queue and polls for AI agent jobs at a configurable interval.
4. WHEN the `agent-worker` service processes a job, THE Agent_Worker SHALL call OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet, persist the result to Supabase using exponential back-off retry (base 500 ms, cap 5000 ms, max 2 retries), and IF all retries are exhausted without a successful persist, THEN THE Agent_Worker SHALL place the job back on the Redis retry queue for later processing rather than discarding the result.
5. THE VPS_Docker_Stack SHALL define an `mcp-server` service that listens on port `3001` and implements the Model Context Protocol endpoint at `/mcp`.
6. WHEN an MCP client connects to port `3001`, THE MCP_Server SHALL require a valid bearer token matching the `MCP_SERVER_TOKEN` secret before processing any tool calls.
7. WHERE HestiaCP manages the nginx reverse proxy, THE VPS_Docker_Stack SHALL expose the `mcp-server` service externally at `https://mcp.imperial-codex.dalizebo.com` with TLS terminated by HestiaCP's Let's Encrypt-managed nginx proxy.
8. THE VPS_Docker_Stack SHALL define restart policies of `unless-stopped` for `redis`, `agent-worker`, and `mcp-server` so services recover automatically after a VPS reboot.
9. THE VPS_Docker_Stack SHALL define a `monitoring-sidecar` service that exports container metrics (CPU, memory, restart count) in Prometheus-compatible format on port `9090`.

---

### Requirement 4: GitHub Actions CI/CD Integration

**User Story:** As a developer, I want the existing GitHub Actions workflows to be extended with VPS deployment steps, so that the VPS deployment is automated alongside the existing Vercel and Docker Hub pipelines without duplicating workflow logic.

#### Acceptance Criteria

1. THE Deploy_Pipeline SHALL reuse the existing `docker-build-push.yml` job as an upstream dependency so the VPS deployment step only runs after a successful image build and push.
2. THE Deploy_Pipeline SHALL define a dedicated `deploy-vps` job that runs on `ubuntu-latest` and reads `VPS_SSH_PRIVATE_KEY`, `VPS_HOST`, `VPS_USER`, and `VPS_DEPLOY_PATH` from GitHub Actions secrets.
3. WHEN the `deploy-vps` job runs, THE SSH_Manager SHALL use `appleboy/ssh-action@v1` (pinned to a specific commit SHA) to execute remote commands, passing no credentials in plain text in the workflow YAML.
4. THE Deploy_Pipeline SHALL gate VPS deployment behind a required GitHub Actions environment named `vps-production`; WHERE no reviewers are configured on the environment, THE Deploy_Pipeline SHALL allow the deployment to proceed and surface the missing-reviewer configuration issue during the approval step rather than failing fast.
5. WHEN a deployment to the VPS succeeds, THE Deploy_Pipeline SHALL update the GitHub deployment status API to `success` with the VPS public IP as the deployment link; WHEN the deployment fails, THE Deploy_Pipeline SHALL set the status to `failure`.
6. IF the VPS deployment job fails, THEN THE Deploy_Pipeline SHALL update the GitHub deployment status API to `failure` and post a structured error message to `SLACK_ALERT_CHANNEL`.
7. THE Deploy_Pipeline SHALL cache the Docker layer cache in the registry using `type=registry,ref=...:buildcache` to reduce build times on subsequent runs.

---

### Requirement 5: Health Monitoring and Connection Status

**User Story:** As a developer and operator, I want real-time visibility into VPS connectivity and service health from within the Next.js application, so that I can detect and respond to infrastructure failures without leaving the workspace.

#### Acceptance Criteria

1. THE Health_Monitor SHALL expose a Next.js API route at `GET /api/vps/health` that returns the current status of the VPS and all services in the VPS_Docker_Stack.
2. WHEN `GET /api/vps/health` is called, THE Health_Monitor SHALL probe the VPS by connecting to port `22` (TCP) within a 5-second timeout to determine SSH reachability.
3. WHEN `GET /api/vps/health` is called, THE Health_Monitor SHALL query the `monitoring-sidecar` metrics endpoint to retrieve per-service health status (running, stopped, restarting).
4. THE `GET /api/vps/health` route SHALL require a minimum Clearance_Level of 1 and return HTTP 403 for requests with Clearance_Level 0 or unauthenticated requests.
5. THE Health_Monitor SHALL cache the health probe result for 30 seconds so that repeated requests within the cache window do not each open a new TCP connection.
6. IF the VPS is unreachable (SSH port probe times out), THEN THE Health_Monitor SHALL return HTTP 200 with a JSON body containing `{ "status": "unreachable", "services": [] }` rather than propagating a 5xx error.
7. IF a service in the VPS_Docker_Stack has a restart count exceeding 5 within the last 10 minutes, THEN THE Health_Monitor SHALL simultaneously include `"degraded": true` in that service's status object in the API response AND emit a structured warning log; the degraded flag and the warning log SHALL always be set together.
8. WHEN `GET /api/vps/health` returns any service with `"status": "stopped"` or `"degraded": true`, THE Health_Monitor SHALL post a single alert to `SLACK_ALERT_CHANNEL` at most once per 15-minute window per affected service.

---

### Requirement 6: HestiaCP Server Configuration Management

**User Story:** As a developer, I want the Hetzner VPS and HestiaCP configuration to be documented and scripted so that the server can be reproduced, reconfigured, or handed off deterministically without manual console operations.

#### Acceptance Criteria

1. THE `infrastructure/hetzner-vps/setup.sh` script SHALL automate post-provision setup: installing Docker, Docker Compose, and any dependencies not managed by HestiaCP.
2. THE `infrastructure/hetzner-vps/setup.sh` script SHALL be idempotent — running it multiple times on the same server SHALL produce the same end state without errors.
3. WHERE HestiaCP manages web hosting and DNS, THE setup script SHALL create the required HestiaCP user account and domain via `v-add-user` and `v-add-domain` CLI commands, rather than through the web UI, so the configuration is reproducible.
4. THE HestiaCP Let's Encrypt SSL certificates SHALL be provisioned for all public-facing domains (including `mcp.imperial-codex.dalizebo.com`) using the `v-add-letsencrypt-domain` CLI command.
5. THE `infrastructure/hetzner-vps/` directory SHALL include a `README.md` documenting the Hetzner server specs, OS version, HestiaCP version, installed services, and the manual steps (if any) required after running the setup script.
6. WHEN HestiaCP is updated, THE `infrastructure/hetzner-vps/README.md` SHALL be updated to reflect the new version; the HestiaCP admin panel port (8083) SHALL be restricted to the list of allowed management IP addresses via HestiaCP's built-in firewall, rather than exposed to `0.0.0.0`.
