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

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

COMPOSE_CMD_STRING="${COMPOSE_CMD:-podman compose}"
read -r -a COMPOSE <<< "$COMPOSE_CMD_STRING"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="${BACKUP_DIR}/chautari-${STAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Backing up ${POSTGRES_DB} to ${FILE}"
"${COMPOSE[@]}" --env-file .env.production exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl \
  > "$FILE"

chmod 600 "$FILE"

if [[ -n "${R2_REMOTE:-}" ]]; then
  if command -v rclone >/dev/null 2>&1; then
    echo "Uploading backup to ${R2_REMOTE}"
    rclone copy "$FILE" "$R2_REMOTE"
  else
    echo "R2_REMOTE is set but rclone is not installed; backup remains local." >&2
  fi
fi

find "$BACKUP_DIR" -type f -name 'chautari-*.dump' -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete: ${FILE}"
