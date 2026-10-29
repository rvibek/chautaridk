#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup.dump>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.production
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

COMPOSE_CMD_STRING="${COMPOSE_CMD:-podman compose}"
read -r -a COMPOSE <<< "$COMPOSE_CMD_STRING"

echo "This will replace the contents of database '${POSTGRES_DB}' with ${BACKUP_FILE}."
read -r -p "Type RESTORE to continue: " answer
if [[ "$answer" != "RESTORE" ]]; then
  echo "Cancelled."
  exit 1
fi

echo "Stopping app and Caddy..."
"${COMPOSE[@]}" --env-file .env.production stop app caddy || true

echo "Restoring ${BACKUP_FILE}..."
"${COMPOSE[@]}" --env-file .env.production exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl \
  < "$BACKUP_FILE"

echo "Starting app and Caddy..."
"${COMPOSE[@]}" --env-file .env.production up -d app caddy

echo "Restore complete. Run scripts/smoke-test.sh to verify."
