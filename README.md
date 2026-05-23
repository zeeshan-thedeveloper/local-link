# LocalLink

A self-hosted API gateway that exposes local resources — Postgres databases, HTTP services — through a persistent Socket.IO tunnel, without port forwarding or sharing upstream credentials.

## How it works

```
Client request
      │
      ▼
┌─────────────┐   scoped API key   ┌──────────────┐   Socket.IO tunnel   ┌───────────────┐
│   Gateway   │ ─────────────────► │  Host daemon │ ───────────────────► │ Local resource│
│  (Fastify)  │ ◄───────────────── │  (locallink) │ ◄─────────────────── │ (Postgres/HTTP│
└─────────────┘   proxied response └──────────────┘                      └───────────────┘
       │
       ▼
  Next.js dashboard
  (manage resources + API keys)
```

The **gateway** validates API keys and forwards requests over a WebSocket tunnel. The **host daemon** runs on your machine, maintains the outbound tunnel, and proxies requests to local services. No inbound ports are opened.

## Stack

| Layer      | Tech                                                             |
| ---------- | ---------------------------------------------------------------- |
| Gateway    | Fastify · Prisma · Socket.IO · Better Auth · Zod · OpenTelemetry |
| Dashboard  | Next.js 15 · React 19 · Tailwind CSS                             |
| CLI daemon | TypeScript · Commander · Socket.IO client · node-postgres        |
| Monorepo   | pnpm workspaces · Turborepo · Changesets                         |
| Tooling    | Vitest · ESLint · Prettier · Husky · commitlint                  |

## Structure

```
apps/
  web/          Next.js dashboard
  host/         locallink CLI daemon (published as @locallink/cli)
services/
  gateway/      Fastify API server
packages/
  shared/       TypeScript types
  validators/   Zod schemas
  tsconfig/     shared TS config
examples/
  local-db/     Express API using @locallink/client against a tunneled Postgres resource
  http/         Vite React app for end-to-end HTTP proxy testing
```

## Development

**Prerequisites:** Docker, Node.js ≥ 18, pnpm

```bash
corepack enable
pnpm install
```

Start Postgres, gateway, and dashboard:

```bash
docker compose up -d
```

Run the host daemon against your local gateway:

```bash
# One-time init — saves gateway URL and host token
pnpm --filter @locallink/host dev init \
  --gateway http://localhost:3003 \
  --token <host-token-from-dashboard>

# Register a local resource
pnpm --filter @locallink/host dev register \
  --id <resource-id> \
  --type http-api \
  --url http://localhost:3000

# Start the tunnel
pnpm --filter @locallink/host dev start
```

CI checks (no Docker required):

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# or run everything at once
pnpm ci:local
```

## Deployment

The gateway runs on a DigitalOcean droplet behind [Caddy](https://caddyserver.com/) (automatic HTTPS). The dashboard is deployed to Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup instructions.

## License

MIT
