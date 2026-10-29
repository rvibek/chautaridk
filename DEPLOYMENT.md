# Deployment runbook

This is the R0 operations runbook for Chautari.dk.

The stack is built and tested locally with Podman. It has **not** been deployed to Hetzner yet because the Hetzner account does not exist.

---

## 1. What is in the repository

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage production build. `runner` is the standalone Next.js app; `tools` runs migrations and the seed. |
| `compose.yml` | PostgreSQL 16, migration, seed, app and Caddy. |
| `Caddyfile` | Automatic HTTPS, compression, reverse proxy and basic security headers. |
| `.env.production.example` | Production environment template. |
| `scripts/backup-db.sh` | `pg_dump`, retention and optional `rclone` upload. |
| `scripts/restore-db.sh` | Guarded restore into the live database. |
| `scripts/restore-test.sh` | Restore into a scratch database and verify row counts. |
| `scripts/deploy.sh` | Pull, migrate, start app/Caddy and smoke test. |
| `scripts/smoke-test.sh` | Checks health, homepage, login and the unauthenticated `/admin` redirect. |
| `.github/workflows/ci.yml` | Migrations, production seed, typecheck, lint and build. |
| `.github/workflows/container.yml` | Publishes app and tools images to GHCR. |

---

## 2. Local build and test with Podman

Podman is installed on this machine. Docker is not required.

```bash
# Build both targets
podman build --target runner -t chautari:local .
podman build --target tools -t chautari:tools .

# Prepare local production-like environment
cp .env.production.example .env.production
# Edit .env.production. Use APP_IMAGE=chautari:local and TOOLS_IMAGE=chautari:tools for local tests.
# Set AUTH_URL and APP_URL to http://localhost:3001 for a local test.

# Start the database
podman compose --env-file .env.production up -d db

# Apply migrations and seed reference data
podman compose --env-file .env.production run --rm migrate
podman compose --env-file .env.production run --rm seed

# Start the app (Caddy is skipped for local testing)
podman compose --env-file .env.production up -d app
```

The app container has no host port in the production compose file because Caddy fronts it. For a local browser test, add a temporary override or use the container network:

```bash
podman exec chautari_app_1 node -e "fetch('http://127.0.0.1:3000/api/health').then(r => console.log(r.status))"
```

If you want a host port for manual testing, create a local override file:

```yaml
# compose.local.yml — do not commit
services:
  app:
    ports:
      - "3001:3000"
```

Then:

```bash
podman compose -f compose.yml -f compose.local.yml --env-file .env.production up -d app
```

Open `http://localhost:3001`.

### Local production-like checks

```bash
podman compose --env-file .env.production exec -T db \
  psql -U chautari -d chautari -c "select count(*) from articles;"

podman exec chautari_app_1 node -e "fetch('http://127.0.0.1:3000/admin', { redirect: 'manual' }).then(r => console.log(r.status, r.headers.get('location')))"
# expected: 307 /login?error=unauthorized
```

Validate the Caddy configuration without issuing a certificate:

```bash
podman run --rm -i \
  -e DOMAIN=chautari.test \
  -e ACME_EMAIL=admin@example.com \
  docker.io/library/caddy:2-alpine \
  caddy validate --config - --adapter caddyfile < Caddyfile
```

---

## 3. Production environment

Copy the template on the server:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

At minimum, change:

- `APP_IMAGE` and `TOOLS_IMAGE` to the GHCR tags you want to run.
- `DOMAIN` and `ACME_EMAIL`.
- `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL`.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `AUTH_URL` and `APP_URL` to `https://your-domain`.
- `ADMIN_ALLOWED_EMAILS` and `SUPER_ADMIN_EMAILS`.
- `SEED_ADMIN_EMAIL`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
- `GEMINI_API_KEY`.
- `DEV_LOGIN_ENABLED=false`.
- `SEED_SAMPLE_CONTENT=false`.

Optional but recommended:

- `SEED_EDITOR_EMAIL` for a second initial admin.
- `R2_*` for media and backups.
- `R2_REMOTE` plus `rclone` for offsite database backups.

Do **not** commit `.env.production`.

### Google OAuth redirect URI

In the Google Cloud console, add:

```text
https://your-domain/api/auth/callback/google
```

---

## 4. First deployment

The target is a Hetzner CPX02 with Ubuntu LTS, a swap file, and Docker or Podman installed.

```bash
# On the server, from the repository directory:
docker compose --env-file .env.production pull
docker compose --env-file .env.production run --rm migrate
docker compose --env-file .env.production run --rm seed
docker compose --env-file .env.production up -d app caddy
```

The seed is idempotent. In production it creates the admin account, categories, AI provider/model, ad slots, settings, glossary and prompt template, but **does not** create demo stories or the demo editor account.

### DNS and TLS

1. Create `A` records for `@` and `www` pointing to the server.
2. Start with Cloudflare proxying **off** (“DNS only”) so Caddy can complete the ACME HTTP challenge.
3. Confirm `https://your-domain/api/health` works.
4. Turn Cloudflare proxying on and set SSL mode to **Full (strict)**.

Caddy stores certificates in the `caddy_data` volume. Do not delete that volume during ordinary redeploys.

---

## 5. Backups and restore

### Backup

```bash
./scripts/backup-db.sh
```

The script writes `backups/chautari-<timestamp>.dump`, keeps 14 days by default, and uploads with `rclone` when `R2_REMOTE` is set.

Example cron entry:

```cron
15 3 * * * cd /srv/chautari && COMPOSE_CMD="docker compose" ./scripts/backup-db.sh >> /var/log/chautari-backup.log 2>&1
```

### Restore test

Always test a dump before trusting it:

```bash
./scripts/restore-test.sh backups/chautari-YYYYMMDDTHHMMSSZ.dump
```

This creates `chautari_restore_test`, restores the dump, prints article/user/revision counts, and drops the scratch database.

### Live restore

```bash
./scripts/restore-db.sh backups/chautari-YYYYMMDDTHHMMSSZ.dump
```

The script asks you to type `RESTORE`. It stops the app and Caddy, restores with `--clean --if-exists`, then starts them again. Run `scripts/smoke-test.sh` afterwards.

---

## 6. CI and container publishing

### CI

`.github/workflows/ci.yml` runs on every push and pull request:

1. Starts PostgreSQL 16.
2. Installs dependencies with `npm ci`.
3. Applies migrations.
4. Runs the production-safe seed.
5. Typechecks.
6. Lints.
7. Builds.
8. Verifies that demo content was not seeded.

### Container publishing

`.github/workflows/container.yml` runs on `main`, version tags and manual dispatch. It builds `linux/amd64` images and pushes:

- `ghcr.io/rvibek/chautaridk:latest`
- `ghcr.io/rvibek/chautaridk:sha-<commit>`
- `ghcr.io/rvibek/chautaridk:tools`
- `ghcr.io/rvibek/chautaridk:tools-sha-<commit>`

The GitHub Actions token has package write permission. The current packages are readable anonymously. If visibility changes, either make the package public or authenticate the server before pulling.

Current published tags after the first run:

- `latest`
- `sha-7cc2d1d`
- `tools`
- `tools-sha-7cc2d1d`

### Deployment script

After the images exist:

```bash
docker login ghcr.io
COMPOSE_CMD="docker compose" ./scripts/deploy.sh
```

`scripts/deploy.sh` pulls the configured images, runs migrations, starts app and Caddy, and runs the smoke test.

For rollback, pin `APP_IMAGE` and `TOOLS_IMAGE` to a previous `sha-...` / `tools-sha-...` tag in `.env.production`, then run the deploy script again.

---

## 7. R0 acceptance checklist

- [ ] Admin login works through Google OAuth.
- [ ] Admin can create a draft and publish it.
- [ ] The published article appears at its public URL.
- [ ] `/admin` redirects unauthenticated users.
- [ ] A backup restores into a scratch database with the expected rows.
- [ ] CI passes on `main`.
- [ ] The container image is built by CI, not on the server.
- [ ] `DEV_LOGIN_ENABLED=false` and `SEED_SAMPLE_CONTENT=false` in production.
- [ ] Caddy obtains a certificate and HTTPS works.
- [ ] Cloudflare is set to Full (strict) after the origin certificate works.

The remaining unchecked item is the actual Hetzner provisioning and first live deployment.
