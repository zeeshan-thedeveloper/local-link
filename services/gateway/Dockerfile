FROM node:26-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/host/package.json apps/host/package.json
COPY services/gateway/package.json services/gateway/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/validators/package.json packages/validators/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @locallink/gateway... build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway
COPY --from=build --chown=gateway:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=gateway:nodejs /app/packages ./packages
COPY --from=build --chown=gateway:nodejs /app/services/gateway ./services/gateway
WORKDIR /app/services/gateway
USER gateway
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1
CMD ["node", "dist/server.js"]
