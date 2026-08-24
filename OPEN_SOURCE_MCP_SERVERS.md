# Open-Source MCP Servers Integration Guide

Complete guide to integrating 11 open-source MCP servers with Imperial Codex for AI-powered development.

---

## Overview

11 MCP servers available:

| Server | Purpose | Tools | Port |
|--------|---------|-------|------|
| **imperial-codex** | Custom system | 13 (read/write) | 3001 |
| **filesystem** | File operations | read, write, create, delete | 3002 |
| **git** | Repository ops | log, diff, branches, commits | 3003 |
| **postgres** | PostgreSQL queries | query, execute | 3004 |
| **sqlite** | SQLite queries | query, execute | 3005 |
| **web-search** | Internet search | search, news | 3006 |
| **memory** | Persistent memory | store, retrieve, list | 3007 |
| **github** | GitHub API | issues, PRs, repos, branches | 3008 |
| **slack** | Slack messaging | send, list channels, read | 3009 |
| **docker** | Docker operations | containers, images, networks | 3010 |
| **http** | HTTP requests | GET, POST, PUT, DELETE | 3011 |

---

## Quick Start

### Option 1: Docker Compose (All 11 Servers)

```bash
chmod +x mcp-servers-setup.sh

# Start all servers
./mcp-servers-setup.sh docker

# Wait 15 seconds for startup
# All services running on ports 3001-3011
```

### Option 2: Local Installation

```bash
# Install all servers globally
./mcp-servers-setup.sh local

# Start individual servers as needed
@modelcontextprotocol/server-filesystem .
@modelcontextprotocol/server-git
# etc.
```

### Option 3: Pre-cache Only

```bash
./mcp-servers-setup.sh install-only

# Servers cached, ready to use with npx
```

---

## Server Details & Configuration

### 1. Filesystem MCP Server

**Purpose:** Read, write, create, delete files and directories

**Tools:**
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_files` - List directory contents
- `create_directory` - Create directory
- `delete_file` - Delete file
- `delete_directory` - Delete directory

**Configuration:**
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
  }
}
```

**Docker:**
```bash
docker run -v ./:/workspace node:20-alpine \
  npx -y @modelcontextprotocol/server-filesystem .
```

**Usage Example:**
```
Claude: Can you read the package.json file?
→ Uses read_file tool to access package.json
```

---

### 2. Git MCP Server

**Purpose:** Git repository operations (log, diff, branches, commits)

**Tools:**
- `list_branches` - List all branches
- `get_current_branch` - Get active branch
- `get_commit_log` - View commit history
- `get_diff` - Show changes between commits
- `get_status` - Repository status
- `get_file_history` - File change history

**Configuration:**
```json
{
  "git": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-git"],
    "env": {
      "GIT_REPO_PATH": "/app"
    }
  }
}
```

**Docker:**
```bash
docker run -v ./:/repo node:20-alpine \
  npx -y @modelcontextprotocol/server-git
```

**Usage Example:**
```
Claude: Show me the last 5 commits
→ Uses get_commit_log tool
→ Claude analyzes changes and provides summary
```

---

### 3. PostgreSQL MCP Server

**Purpose:** Query and execute SQL against PostgreSQL database

**Tools:**
- `query` - Execute SELECT queries
- `execute` - Execute INSERT/UPDATE/DELETE
- `schema` - Get database schema
- `tables` - List tables

**Configuration:**
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "postgresql://user:pass@localhost:5432/imperial_codex"
    }
  }
}
```

**Setup Database:**
```bash
# PostgreSQL container starts automatically in docker-compose.mcp-servers.yml
# Default credentials: imperial / changeme

# Or use your own:
export DB_PASSWORD=your-secure-password

docker compose -f docker-compose.mcp-servers.yml up -d postgres
```

**Usage Example:**
```
Claude: What data do we have in the conversations table?
→ Uses query tool with SELECT * FROM conversations
→ Claude analyzes results
```

---

### 4. SQLite MCP Server

**Purpose:** Lightweight SQL database for development/caching

**Tools:**
- `query` - Execute SELECT queries
- `execute` - Execute INSERT/UPDATE/DELETE
- `schema` - Get database schema

**Configuration:**
```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite"],
    "env": {
      "DATABASE_PATH": "/app/data/imperial-codex.db"
    }
  }
}
```

**Usage Example:**
```
Claude: Store this conversation summary in the database
→ Uses execute tool to INSERT into sqlite
→ Data persists for later retrieval
```

---

### 5. Web Search MCP Server

**Purpose:** Search the internet using Brave Search or Google

**Tools:**
- `search` - Web search query
- `news` - News search
- `retrieve_url` - Get page contents

**Configuration:**
```json
{
  "web-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-web-search"],
    "env": {
      "SEARCH_ENGINE": "brave",
      "BRAVE_API_KEY": "${BRAVE_API_KEY}"
    }
  }
}
```

**Get API Key:**
```bash
# Get Brave Search API key at: https://api.search.brave.com/
# Add to .env.local:
BRAVE_API_KEY=your-brave-api-key
```

**Usage Example:**
```
Claude: Find the latest Docker security updates
→ Uses search tool to query Brave Search
→ Claude summarizes results
```

---

### 6. Memory MCP Server

**Purpose:** Persistent memory storage across conversations

**Tools:**
- `store_memory` - Save information
- `retrieve_memory` - Get stored data
- `list_memories` - View all memories

**Configuration:**
```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

**Usage Example:**
```
Claude: Remember that we use semantic versioning for releases
→ Uses store_memory tool
→ Later: What versioning scheme do we use?
→ Uses retrieve_memory tool
```

---

### 7. GitHub MCP Server

**Purpose:** GitHub API integration (issues, PRs, repos)

**Tools:**
- `list_repos` - List repositories
- `list_issues` - View issues
- `create_issue` - Create new issue
- `create_pull_request` - Create PR
- `list_pull_requests` - View PRs
- `get_repo_info` - Repository details

**Configuration:**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}",
      "GITHUB_REPO": "${GITHUB_REPO}"
    }
  }
}
```

**Get Token:**
```bash
# Create GitHub Personal Access Token at:
# https://github.com/settings/tokens
# Scopes: repo, issues

# Add to .env.local:
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPO=your-username/imperial-codex
```

**Usage Example:**
```
Claude: Create an issue for the MCP server integration
→ Uses create_issue tool
→ Issue created in GitHub
```

---

### 8. Slack MCP Server

**Purpose:** Slack messaging and operations

**Tools:**
- `send_message` - Send message to channel
- `list_channels` - List all channels
- `read_channel` - Read channel history
- `create_channel` - Create new channel

**Configuration:**
```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-slack"],
    "env": {
      "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
      "SLACK_CHANNEL": "#imperial-codex-alerts"
    }
  }
}
```

**Get Bot Token:**
```bash
# Create Slack app at: https://api.slack.com/apps
# Add bot token to .env.local:
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxx
```

**Usage Example:**
```
Claude: Send a deployment alert to #imperial-codex-alerts
→ Uses send_message tool
→ Message posted to Slack
```

---

### 9. Docker MCP Server

**Purpose:** Docker container and image management

**Tools:**
- `list_containers` - List running/stopped containers
- `list_images` - List images
- `inspect_container` - Get container details
- `exec_container` - Execute command in container
- `logs` - View container logs

**Configuration:**
```json
{
  "docker": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-docker"],
    "env": {
      "DOCKER_SOCKET": "unix:///var/run/docker.sock"
    }
  }
}
```

**Docker Compose:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Usage Example:**
```
Claude: What's the status of the imperial_codex-app container?
→ Uses list_containers tool
→ Claude reports status, resource usage
```

---

### 10. HTTP MCP Server

**Purpose:** Generic HTTP client for web requests

**Tools:**
- `get` - HTTP GET request
- `post` - HTTP POST request
- `put` - HTTP PUT request
- `delete` - HTTP DELETE request
- `patch` - HTTP PATCH request

**Configuration:**
```json
{
  "http": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-http"]
  }
}
```

**Usage Example:**
```
Claude: Fetch the latest GitHub releases
→ Uses get tool to request GitHub API
→ Claude parses and analyzes response
```

---

### 11. Imperial Codex Custom MCP Server

**Purpose:** Imperial Codex-specific tools (13 tools)

**Tools:** 
- 7 read tools (search pillars, OS modules, library)
- 6 write tools (generate strikes, submit allocations)

**Configuration:**
```json
{
  "imperial-codex": {
    "command": "node",
    "args": ["/app/mcp-server.js"],
    "env": {
      "NODE_ENV": "production",
      "PORT": "3001"
    }
  }
}
```

---

## Docker Compose Setup

**Start all 11 servers:**

```bash
docker compose -f docker-compose.mcp-servers.yml up -d
```

**Services:**
- 11 MCP servers (ports 3001-3011)
- 1 PostgreSQL database (port 5432)
- 1 memory volume
- 1 data volume

**Stop all:**
```bash
docker compose -f docker-compose.mcp-servers.yml down
```

**View logs:**
```bash
docker compose -f docker-compose.mcp-servers.yml logs -f

# Or specific service:
docker compose -f docker-compose.mcp-servers.yml logs -f mcp-git
```

**Restart specific server:**
```bash
docker compose -f docker-compose.mcp-servers.yml restart mcp-github
```

---

## Claude Desktop Integration

### Setup

```bash
# Start all servers
./mcp-servers-setup.sh docker

# Configure Claude Desktop
./mcp-setup.sh claude-desktop

# Restart Claude Desktop
```

### Usage

In Claude Desktop conversations:

```
Claude: Use the git server to show recent commits
@mcp-git get_commit_log
→ Shows last 10 commits from Imperial Codex repo

Claude: Search the web for Docker best practices
@mcp-web-search search "docker best practices"
→ Returns web search results

Claude: List all GitHub issues in our repo
@mcp-github list_issues
→ Shows open issues
```

---

## VS Code Dev Container Integration

**Automatic MCP server availability in dev container:**

```bash
code .
# Ctrl+Shift+P → Dev Containers: Reopen in Container

# Inside container, all MCP servers available at:
# http://localhost:3001 (imperial-codex)
# http://localhost:3002 (filesystem)
# http://localhost:3003 (git)
# etc.
```

**Use with Claude Dev extension:**
- Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux/Windows)
- Search for "Claude"
- All MCP tools available in Claude Dev panel

---

## Environment Variables Required

Add to `.env.local`:

```bash
# Web Search
BRAVE_API_KEY=your-brave-api-key

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPO=your-username/imperial-codex

# Slack
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxx
SLACK_CHANNEL=#imperial-codex-alerts

# Database
DB_PASSWORD=your-secure-password

# Existing
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

---

## Workflow Examples

### Example 1: Code Review with All Servers

```
Claude: Review the git changes and create a GitHub issue if needed
→ Uses @mcp-git to get recent changes
→ Uses @mcp-filesystem to read modified files
→ Uses @mcp-github to create issue
→ Uses @mcp-slack to notify team
```

### Example 2: Deployment Monitoring

```
Claude: Check Docker container status and send Slack alert if unhealthy
→ Uses @mcp-docker to inspect container
→ Uses @mcp-http to call health endpoint
→ Uses @mcp-slack to send alert
```

### Example 3: Database Queries

```
Claude: Query PostgreSQL for conversation history, store summary in SQLite, and post to Slack
→ Uses @mcp-postgres to SELECT from conversations
→ Uses @mcp-sqlite to INSERT summary
→ Uses @mcp-slack to post results
```

### Example 4: Search & Store Knowledge

```
Claude: Search web for Docker security tips, save to memory, store in database
→ Uses @mcp-web-search to find articles
→ Uses @mcp-memory to store findings
→ Uses @mcp-sqlite to persist data
```

---

## Troubleshooting

### Server won't start

```bash
# Check Docker
docker ps -a

# View logs
docker compose -f docker-compose.mcp-servers.yml logs mcp-git

# Restart
docker compose -f docker-compose.mcp-servers.yml restart mcp-git
```

### PostgreSQL connection failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Get logs
docker logs postgres-imperial

# Reset password in .env.local
export DB_PASSWORD=newpassword
docker compose -f docker-compose.mcp-servers.yml down postgres
docker compose -f docker-compose.mcp-servers.yml up -d postgres
```

### API key errors

```bash
# Verify all env vars set
cat .env.local | grep -E "BRAVE|GITHUB|SLACK"

# Ensure Docker containers have .env.local mounted
docker exec mcp-github env | grep GITHUB_TOKEN
```

### Claude Desktop not seeing servers

```bash
# Re-run setup
./mcp-setup.sh claude-desktop

# Restart Claude Desktop completely
# macOS: Command+Q
# Windows: Alt+F4
# Linux: killall claude
```

---

## Performance Tuning

**Memory limits per server:**
```yaml
environment:
  NODE_OPTIONS: "--max_old_space_size=512"
```

**Increase for large operations:**
```yaml
environment:
  NODE_OPTIONS: "--max_old_space_size=1024"
```

**Database indexing (PostgreSQL):**
```sql
CREATE INDEX idx_conversations ON conversations(created_at);
CREATE INDEX idx_instruments ON instruments(created_at);
```

---

## Production Deployment

**Kubernetes with MCP servers:**

```bash
# Create ConfigMap for env vars
kubectl create configmap mcp-config --from-env-file=.env.local

# Deploy with Helm
helm install imperial-codex ./helm \
  --values docker-compose.mcp-servers.yml
```

**Docker Swarm:**

```bash
docker stack deploy -c docker-compose.mcp-servers.yml imperial-mcp
```

---

## Summary

| Task | Command |
|------|---------|
| Start all 11 servers | `./mcp-servers-setup.sh docker` |
| Stop all servers | `docker compose -f docker-compose.mcp-servers.yml down` |
| Configure Claude | `./mcp-setup.sh claude-desktop` |
| View logs | `docker compose -f docker-compose.mcp-servers.yml logs -f` |
| Install locally | `./mcp-servers-setup.sh local` |
| Pre-cache packages | `./mcp-servers-setup.sh install-only` |

**All 11 MCP servers ready for AI-powered development!** 🚀
