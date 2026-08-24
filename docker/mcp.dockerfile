# MCP Server Dockerfile
# Runs the Imperial Codex MCP server in isolation
# Exposes stdio and HTTP/SSE transports for external AI clients

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV MCP_TRANSPORT=http

# Create non-root user
RUN addgroup --system --gid 1001 mcp && \
    adduser --system --uid 1001 mcpuser

# Copy built app
COPY --from=builder --chown=mcpuser:mcp /app/.next ./
COPY --from=builder --chown=mcpuser:mcp /app/node_modules ./node_modules
COPY --from=builder --chown=mcpuser:mcp /app/public ./public

# Copy data directories (read-only)
COPY --chown=mcpuser:mcp core ./core
COPY --chown=mcpuser:mcp vault ./vault
COPY --chown=mcpuser:mcp rituals ./rituals

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Security
RUN chmod -R 755 /app && \
    chown -R mcpuser:mcp /app

USER mcpuser

EXPOSE 3001

# Start MCP server
CMD ["node", "server.js"]
