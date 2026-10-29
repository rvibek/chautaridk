#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.production
set +a

: "${APP_IMAGE:?APP_IMAGE is required}"
: "${TOOLS_IMAGE:?TOOLS_IMAGE is required}"

COMPOSE_CMD_STRING="${COMPOSE_CMD:-podman compose}"
read -r -a COMPOSE <<< "$COMPOSE_CMD_STRING"

echo "Pulling ${APP_IMAGE} and ${TOOLS_IMAGE}..."
"${COMPOSE[@]}" --env-file .env.production pull

echo "Running database migrations..."
"${COMPOSE[@]}" --env-file .env.production run --rm migrate

echo "Starting app and Caddy..."
"${COMPOSE[@]}" --env-file .env.production up -d app caddy

echo "Running smoke test..."
./scripts/smoke-test.sh
