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

: "${DOMAIN:?DOMAIN is required}"
BASE="https://${DOMAIN}"

echo "Checking ${BASE}/api/health"
curl -fsS --max-time 15 "${BASE}/api/health" >/dev/null

echo "Checking ${BASE}/"
curl -fsS --max-time 15 "${BASE}/" >/dev/null

echo "Checking ${BASE}/login"
curl -fsS --max-time 15 "${BASE}/login" >/dev/null

ADMIN_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${BASE}/admin")"
if [[ "$ADMIN_STATUS" != "302" && "$ADMIN_STATUS" != "307" ]]; then
  echo "Expected /admin to redirect unauthenticated users, got HTTP ${ADMIN_STATUS}" >&2
  exit 1
fi

echo "Smoke test passed (admin redirect: ${ADMIN_STATUS})."
