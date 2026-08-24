# Multi-stage build for optimized production image

# Stage 1: Builder (production build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Stage 2: Development (with hot reload and source maps)
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 3: Production runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy data directories (core, vault, rituals)
COPY --chown=nextjs:nodejs core ./core
COPY --chown=nextjs:nodejs vault ./vault
COPY --chown=nextjs:nodejs rituals ./rituals

# Copy application code (standalone output from next build)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install curl for healthcheck
RUN apk add --no-cache curl

# Health check — verify app is responsive at /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
