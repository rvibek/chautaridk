# Chautari.dk — handoff

**Date:** 29 October 2026

**Status:** Milestone 1, Milestone 2 and R0 container packaging complete. Next work is the first Hetzner deployment.

---

## 1. What is complete

### Milestone 1 — published-article revisions

- A published article stays live while a separate draft revision is edited.
- One open revision per article, enforced by a partial unique index.
- Create, save, submit for review, approve/publish, discard, unpublish and republish.
- Publishing copies the open revision onto `articles` in a transaction.
- Published revisions are immutable.
- Draft preview, revision history and audit entries.
- Optimistic concurrency checks, including discard.
- `articles.first_published_at` and public updated-date display.
- JSON-LD uses first-published and updated dates.

### Milestone 2 — AI intake

- Three entry points: source URL, pasted source text, blank manual draft.
- Safe URL fetch with SSRF protection, redirect limit, timeout and size cap.
- Readability extraction; source text stored in `sources.raw_text`.
- Gemini generates Nepali title, dek, body, SEO fields and English back-translation.
- AI output is always a `DRAFT`.
- Reprompt from the stored source text.
- Model, prompt version and token usage recorded per revision.
- System instruction requires a **source-backed Nepali angle**:
  - the dek or first two or three paragraphs must explain why the story matters to Nepali readers in Denmark;
  - the model must not invent a Nepal–Denmark connection;
  - if there is no genuine link, it says so;
  - a separate `नेपाली एंगल` heading is optional;
  - back-translation must include a line starting with `Nepali angle:`.

### R0 — container packaging and operations

- Next.js standalone production output.
- Multi-stage `Dockerfile` with:
  - `runner` — minimal non-root app image;
  - `tools` — migration and seed image.
- `compose.yml` with PostgreSQL 16, migration, seed, app and Caddy.
- `Caddyfile` with automatic HTTPS, compression, reverse proxy and basic headers.
- Production environment template.
- Production-safe seed:
  - skips demo stories and the demo editor in production;
  - creates the configured admin account and reference data.
- Backup, restore, restore-test, deploy and smoke-test scripts.
- GitHub Actions:
  - CI with PostgreSQL, migrations, production seed, typecheck, lint and build;
  - GHCR image publishing for app and tools.
- Deployment runbook.

---

## 2. Verified today

### Application

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes and emits `.next/standalone/server.js`.
- Revision workflow previously tested end to end.
- AI URL intake previously tested with a valid key and a real source.

### Containers with Podman

- `chautari:local` built successfully.
- `chautari:tools` built successfully.
- Migrations ran successfully in the tools container.
- Production seed created the admin and reference data and **skipped demo articles**.
- Sample-content seed created the expected demo articles when explicitly enabled.
- App container started as a non-root user.
- `GET /api/health` → `200`.
- `GET /` → `200`.
- `GET /admin` → `307` to `/login?error=unauthorized`.
- Caddyfile passed `caddy validate`.
- Backup created.
- Restore test passed with 7 articles, 1 user and 7 revisions in the scratch database.

The test compose stack is local only and can be removed with:

```bash
podman compose --env-file .env.production down -v
```

---

## 3. Git and repository

- Git repository initialized.
- Initial commit: `82ad2ba init`.
- Remote target: `https://github.com/rvibek/chautaridk.git`.
- `.env`, `.env.production` and backups are ignored.
- `.env.example` and `.env.production.example` are intentionally tracked.

---

## 4. Local environment

- Node: `v26.10.0`
- npm: `11.19.1`
- Podman: `6.1.4`
- podman-compose: `1.6.0`
- Docker: not installed
- PostgreSQL 16 binaries: `/opt/homebrew/opt/postgresql@16/bin`
- Local database: `chautari_dev`
- Local DB user: `rvibek`
- Admin login: `admin@chautari.dk` or `editor@chautari.dk` at `/login`
- `GEMINI_API_KEY` in `.env` is valid and tested.

---

## 5. Test content in the local development database

These remain in `chautari_dev`:

- `story-2723ff37` — published
- `story-fe03ae3f` — published

They were created during AI validation. Do not remove them without confirming they are disposable.

The temporary FIDI Focus test draft was deleted.

The separate container test database currently contains sample content from the sample-seed test. It is disposable.

---

## 6. Important files added or changed

### Deployment

- `Dockerfile`
- `.dockerignore`
- `compose.yml`
- `Caddyfile`
- `.env.production.example`
- `DEPLOYMENT.md`
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `scripts/restore-test.sh`
- `scripts/deploy.sh`
- `scripts/smoke-test.sh`
- `.github/workflows/ci.yml`
- `.github/workflows/container.yml`

### Application and configuration

- `next.config.ts` — standalone output.
- `src/db/seed.ts` — production-safe seed guard and optional editor account.
- `.gitignore` — tracks environment templates, ignores backups.
- `.env.example` — seed options.
- `README.md`
- `PLAN.md`
- `HANDOFF.md`

---

## 7. Next session — recommended order

1. Push the current commit to GitHub.
2. Confirm CI passes.
3. Confirm both GHCR images are published.
4. Provision Hetzner CPX02:
   - Ubuntu LTS;
   - swap;
   - firewall;
   - Docker or Podman.
5. Configure DNS and Cloudflare:
   - start with DNS-only so Caddy can obtain a certificate;
   - switch to proxied and Full (strict) after HTTPS works.
6. Configure Google OAuth redirect URI.
7. Create `.env.production` on the server.
8. Pull images, migrate, seed and start the stack.
9. Run the R0 acceptance checklist in `DEPLOYMENT.md`.
10. Then continue R1 polish.

---

## 8. Blockers and external dependencies

- Hetzner account does not exist yet.
- Cloudflare DNS/TLS and R2 require account access.
- Google OAuth requires Google Cloud credentials and allowlisted accounts.
- Resend requires an API key and verified sending domain.
- Sentry and production monitoring require an account.
- The GHCR packages may need their visibility changed to public, or the server must authenticate before pulling.

---

## 9. Commands

```bash
# Local application
brew services start postgresql@16
pg_isready
npm run db:migrate
npm run db:seed
npm run dev

# Checks
npm run typecheck
npm run lint
npm run build

# Container build
podman build --target runner -t chautari:local .
podman build --target tools -t chautari:tools .

# Container stack
cp .env.production.example .env.production
podman compose --env-file .env.production up -d db
podman compose --env-file .env.production run --rm migrate
podman compose --env-file .env.production run --rm seed
podman compose --env-file .env.production up -d app

# Backup and restore test
./scripts/backup-db.sh
./scripts/restore-test.sh backups/chautari-YYYYMMDDTHHMMSSZ.dump
```
