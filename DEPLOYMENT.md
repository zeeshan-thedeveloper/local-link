# LocalLink Deployment Runbook

## Prerequisites

- SSH access to the DigitalOcean droplet as the deploy user.
- Docker and Docker Compose installed on the server.
- Server files:
  - `~/apps/locallink/docker-compose.yml`
  - `~/apps/locallink/.env` for production
  - `~/apps/locallink/.env.staging` for staging
- GitHub Actions secrets (either naming works):
  - Host: `DROPLET_IP` or `DEPLOY_HOST` (your droplet IP, e.g. `134.209.221.190`)
  - SSH key: `SSH_PRIVATE_KEY` or `DEPLOY_KEY` (private key from `~/.ssh/id_ed25519` on your PC)
  - User: `DEPLOY_USER` (optional; defaults to `zeesh`)
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `BETTER_AUTH_SECRET`
  - `RESEND_API_KEY`

## Normal Deployment

Merging to `main` (when `services/gateway/**` or deploy files change) triggers `.github/workflows/deploy-gateway.yml`.

The workflow:

1. Builds and pushes `ghcr.io/<owner>/locallink-gateway:<sha>` and `:latest`
2. Copies `docker-compose.gateway.prod.yml` and `scripts/deploy-gateway-remote.sh` to `~/apps/locallink` on the droplet
3. SSH runs the deploy script: `docker pull`, Prisma migrate, `docker compose up -d --force-recreate`
4. Verifies `http://localhost:3003/health`

The production compose file uses `image:` (not `build:`) and project name `locallink`, so the running container (`locallink-gateway-1`) is recreated on every deploy.

You can also trigger a deploy manually: **Actions → Deploy Gateway → Run workflow**.

Success means the GitHub Actions production job passes and `/health` returns `200`.

## Manual Deployment

SSH to the server and run (replace `<sha>` with the commit you want):

```sh
export GATEWAY_IMAGE=ghcr.io/<owner>/locallink-gateway:<sha>
~/apps/locallink/scripts/deploy-gateway-remote.sh
```

Or pull `latest`:

```sh
export GATEWAY_IMAGE=ghcr.io/<owner>/locallink-gateway:latest
~/apps/locallink/scripts/deploy-gateway-remote.sh
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
docker run --rm --env-file ~/apps/locallink/.env -w /app/services/gateway ghcr.io/<owner>/locallink-gateway:<sha> sh -c '/app/node_modules/.bin/prisma migrate deploy'
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
