# Multi-stage Docker build for Lobby Dashboard (LOBBY-05)
# Stage 1: Dependency installation and compilation
FROM node:22-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.34.6 --activate

WORKDIR /app

# Copy dependency manifests for optimal layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contract/package.json ./packages/contract/
COPY packages/core/package.json ./packages/core/
COPY apps/aggregator/package.json ./apps/aggregator/
COPY apps/web/package.json ./apps/web/
COPY tools/mock-upstream/package.json ./tools/mock-upstream/

RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY config/ ./config/

RUN pnpm --filter @lobby/aggregator build && pnpm --filter @lobby/web build

# Stage 2: Production runtime image
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/app/data
ENV LOBBY_CONFIG_PATH=/app/config/lobby.config.json
ENV WEB_DIST_DIR=/app/web-dist

RUN corepack enable && corepack prepare pnpm@10.34.6 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contract/package.json ./packages/contract/
COPY packages/core/package.json ./packages/core/
COPY apps/aggregator/package.json ./apps/aggregator/
COPY tools/mock-upstream/package.json ./tools/mock-upstream/

RUN pnpm --filter @lobby/aggregator install --prod --frozen-lockfile

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/aggregator/dist ./dist
COPY --from=builder /app/apps/web/dist /app/web-dist
COPY config/ /app/config/

# Ensure write permissions on data directory for unprivileged user
RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 8080) + '/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
