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

COMPOSE_CMD_STRING="${COMPOSE_CMD:-podman compose}"
read -r -a COMPOSE <<< "$COMPOSE_CMD_STRING"

TEST_DB="${TEST_DB:-chautari_restore_test}"

cleanup() {
  "${COMPOSE[@]}" --env-file .env.production exec -T db \
    psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${TEST_DB}\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Creating scratch database ${TEST_DB}..."
"${COMPOSE[@]}" --env-file .env.production exec -T db \
  psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${TEST_DB}\";" \
  -c "CREATE DATABASE \"${TEST_DB}\";"

echo "Restoring backup into ${TEST_DB}..."
"${COMPOSE[@]}" --env-file .env.production exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$TEST_DB" --no-owner --no-acl \
  < "$BACKUP_FILE"

echo "Checking restored data..."
"${COMPOSE[@]}" --env-file .env.production exec -T db \
  psql -U "$POSTGRES_USER" -d "$TEST_DB" -v ON_ERROR_STOP=1 \
  -c "SELECT count(*) AS articles FROM articles;" \
  -c "SELECT count(*) AS users FROM \"user\";" \
  -c "SELECT count(*) AS revisions FROM article_revisions;"

echo "Restore test passed. Scratch database will be dropped."
