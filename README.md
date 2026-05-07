# LocalLink

LocalLink is a personal API gateway for local resources. The gateway validates personal API keys and sends requests through an outbound Socket.IO tunnel to a host daemon running on your machine.

## Layout

- `apps/web` - Next.js dashboard
- `apps/host` - native `locallink` CLI daemon
- `services/gateway` - Fastify API, Prisma, Socket.IO tunnel server
- `packages/shared` - shared TypeScript types
- `packages/validators` - Zod request and tunnel schemas
- `packages/tsconfig` - shared TypeScript configuration

## Development

```bash
corepack enable
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run Postgres, gateway, and web:

```bash
docker compose up -d
```

Initialize the host daemon:

```bash
pnpm --filter @locallink/host dev init --gateway http://localhost:3003 --token lhk_token_shown_after_resource_creation
pnpm --filter @locallink/host dev register --id <resource-id> --type http-api --url http://localhost:3000
pnpm --filter @locallink/host dev start
```
Make your local databases, AI models, and HTTP services accessible from anywhere. No port forwarding. No sharing credentials. Just a tunnel and an API k
