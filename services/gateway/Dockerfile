FROM node:22-alpine AS base
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

FROM build AS deploy
RUN pnpm --filter @locallink/gateway --prod deploy /prod/gateway
RUN cp -R /app/services/gateway/prisma /prod/gateway/prisma
RUN rm -rf \
    /prod/gateway/node_modules/.bin/esbuild \
    /prod/gateway/node_modules/.pnpm/node_modules/.bin/esbuild \
    /prod/gateway/node_modules/.pnpm/node_modules/@esbuild \
    /prod/gateway/node_modules/.pnpm/node_modules/esbuild \
    /prod/gateway/node_modules/.pnpm/@esbuild+* \
    /prod/gateway/node_modules/.pnpm/esbuild@* \
    /prod/gateway/node_modules/.pnpm/vite@* \
    /prod/gateway/node_modules/.pnpm/vite-node@* \
    /prod/gateway/node_modules/.pnpm/vitest@* \
    /prod/gateway/node_modules/.pnpm/@vitest+* \
    /prod/gateway/node_modules/.pnpm/node_modules/vite \
    /prod/gateway/node_modules/.pnpm/node_modules/vite-node \
    /prod/gateway/node_modules/.pnpm/node_modules/vitest \
    /prod/gateway/node_modules/.pnpm/node_modules/@vitest

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway
COPY --from=deploy --chown=gateway:nodejs /prod/gateway ./
# Wrapper so deploy can run `prisma migrate deploy` without pnpm workspace
RUN PRISMA_JS="$(find /app/node_modules -path '*/prisma/build/index.js' | head -1)" && \
    printf '%s\n' '#!/bin/sh' "exec node \"$PRISMA_JS\" \"\$@\"" > /usr/local/bin/prisma && \
    chmod +x /usr/local/bin/prisma
USER gateway
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3003/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
