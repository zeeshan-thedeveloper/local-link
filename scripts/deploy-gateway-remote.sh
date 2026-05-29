#!/usr/bin/env bash
set -euo pipefail

GATEWAY_IMAGE="${GATEWAY_IMAGE:?GATEWAY_IMAGE is required}"
APP_DIR="${APP_DIR:-$HOME/apps/locallink}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/docker-compose.gateway.prod.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-locallink}"
GATEWAY_PORT="${GATEWAY_PORT:-3003}"
export COMPOSE_PROJECT_NAME GATEWAY_PORT

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — create it on the droplet before deploying."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing $COMPOSE_FILE — sync it from the repo (CI does this on each deploy)."
  exit 1
fi

echo "Deploying $GATEWAY_IMAGE (project: $COMPOSE_PROJECT_NAME)"

PREV_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q gateway 2>/dev/null || true)"
PREV_IMAGE=""
if [ -n "$PREV_CONTAINER" ]; then
  PREV_IMAGE="$(docker inspect --format='{{.Config.Image}}' "$PREV_CONTAINER")"
  echo "Previous image: $PREV_IMAGE"
fi

echo "Cleaning up unused Docker resources before pull"
docker container prune -f || true
docker image prune -af --filter "until=24h" || true
docker builder prune -af --filter "until=24h" || true

docker pull "$GATEWAY_IMAGE"

# Run prisma directly — production image has no monorepo root for `pnpm --filter`
docker run --rm --env-file "$ENV_FILE" -w /app "$GATEWAY_IMAGE" \
  prisma migrate deploy --schema /app/prisma/schema.prisma

export GATEWAY_IMAGE
docker compose -f "$COMPOSE_FILE" pull gateway
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-deps gateway

for attempt in $(seq 1 12); do
  if curl -sf "http://localhost:${GATEWAY_PORT}/health" >/dev/null; then
    echo "Gateway healthy"
    docker compose -f "$COMPOSE_FILE" ps
    docker inspect --format='{{.Config.Image}}' "$(docker compose -f "$COMPOSE_FILE" ps -q gateway)" || true
    docker image prune -af --filter "until=24h" || true
    exit 0
  fi
  echo "Waiting for health... attempt $attempt/12"
  sleep 5
done

echo "Health check failed"
if [ -n "$PREV_IMAGE" ]; then
  echo "Rolling back to $PREV_IMAGE"
  export GATEWAY_IMAGE="$PREV_IMAGE"
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-deps gateway
fi
exit 1
