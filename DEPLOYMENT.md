# LocalLink Deployment Runbook

## Prerequisites

- SSH access to the DigitalOcean droplet as the deploy user.
- Docker and Docker Compose installed on the server.
- Server files:
  - `~/apps/locallink/docker-compose.yml`
  - `~/apps/locallink/.env` for production
  - `~/apps/locallink/.env.staging` for staging
- GitHub Actions secrets:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_KEY`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `BETTER_AUTH_SECRET`
  - `RESEND_API_KEY`

## Normal Deployment

Merging to `main` triggers `.github/workflows/deploy-gateway.yml`.

The workflow builds `ghcr.io/<owner>/locallink-gateway:<sha>`, runs Prisma migrations, starts the gateway through Docker Compose, then checks `http://localhost:3003/health`.

Success means the GitHub Actions production job passes and `/health` returns `200`.

## Manual Deployment

SSH to the server and run:

```sh
cd ~/apps/locallink
docker pull ghcr.io/<owner>/locallink-gateway:<sha>
docker run --rm --env-file .env ghcr.io/<owner>/locallink-gateway:<sha> pnpm --filter @locallink/gateway prisma migrate deploy
GATEWAY_IMAGE=ghcr.io/<owner>/locallink-gateway:<sha> docker compose up -d --no-deps gateway
curl -sf http://localhost:3003/health
```

Success means the container is running and the health check returns JSON with `status: "ok"`.

## Rolling Back

Find the previous image and restart the gateway:

```sh
docker inspect --format='{{.Image}}' locallink-gateway
docker stop locallink-gateway
docker rm locallink-gateway
docker run -d --name locallink-gateway --restart unless-stopped --env-file ~/apps/locallink/.env -p 3003:3003 <previous-image-id>
curl -sf http://localhost:3003/health
```

Success means `/health` returns `200` again.

## Database Migrations

Run migrations before switching traffic to a new image:

```sh
docker run --rm --env-file ~/apps/locallink/.env ghcr.io/<owner>/locallink-gateway:<sha> pnpm --filter @locallink/gateway prisma migrate deploy
```

Prisma migrations are forward-only. To recover from a bad migration, restore from the latest database backup or deploy a corrective migration.

## Environment Variables

The gateway reads secrets from the server `.env` files and from GitHub Actions secrets during automated deploys. Production uses `~/apps/locallink/.env`; staging uses `~/apps/locallink/.env.staging`.

The web service reads `GATEWAY_URL`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_API_URL`, and `PORT` from Docker Compose.

## Monitoring

Check running containers:

```sh
docker compose ps
```

Check gateway logs:

```sh
docker compose logs gateway --tail=100
```

Check health and readiness:

```sh
curl -sf http://localhost:3003/health
curl -sf http://localhost:3003/ready
```
