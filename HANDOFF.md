# Chautari.dk — handoff

**Date:** 28 October 2026  
**Status:** Milestone 1 and Milestone 2 complete. Next work is R0 operations.

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
- System instruction now requires a **source-backed Nepali angle**:
  - the dek or first two or three paragraphs must explain why the story matters to Nepali readers in Denmark;
  - the model must not invent a Nepal–Denmark connection;
  - if there is no genuine link, it says so;
  - a separate `नेपाली एंगल` heading is optional;
  - back-translation must include a line starting with `Nepali angle:`.

---

## 2. Verified today

- `npm run typecheck` passes.
- `npm run lint` passes.
- A clean migration and seed were tested on a fresh database.
- Revision workflow tested end to end:
  - edit a live article;
  - keep the public page unchanged while editing;
  - submit the revision;
  - approve and publish;
  - confirm the public page updates.
- Discard, unpublish, republish and private preview tested.
- AI URL intake tested with a real source and a valid `GEMINI_API_KEY`.
- The generated draft included a genuine, source-backed Nepali angle and the required `Nepali angle:` back-translation line.
- The temporary test article and orphaned source were deleted.

Latest manual check:

- `GET /` → `200`
- `GET /login` → `200`
- `GET /admin` unauthenticated → `307` redirect to login (expected)
- Dev server: `http://localhost:3000`

---

## 3. Local environment

- Node: `v26.10.0`
- npm: `11.19.1`
- PostgreSQL 16 binaries: `/opt/homebrew/opt/postgresql@16/bin`
- Local database: `chautari_dev`
- Local DB user: `rvibek`
- Admin login: `admin@chautari.dk` or `editor@chautari.dk` at `/login`
- The dev server is currently running in the background.
- `GEMINI_API_KEY` in `.env` is valid and tested.

The workspace is **not yet a Git repository**. All changes are uncommitted.

---

## 4. Test content currently in the local database

These were created during AI validation and are still present:

- `story-2723ff37` — published
- `story-fe03ae3f` — published

They were not deleted because they may be useful for checking the editor and public pages. Do not remove them without confirming they are disposable.

The temporary FIDI Focus test draft was deleted.

---

## 5. Important files changed today

- `src/lib/ai/draft.ts` — true Gemini `systemInstruction`, Nepali-angle rules, back-translation requirement.
- `src/db/seed.ts` — version 2 translation profile and prompt template.
- `drizzle/0002_nepali_angle_prompt.sql` — updates existing installs to version 2.
- `drizzle/meta/_journal.json` — records migration `0002`.
- `README.md` — status, verification notes and resume instructions.
- Revision workflow files:
  - `src/actions/articles.ts`
  - `src/lib/revisions.ts`
  - `src/app/admin/stories/[id]/page.tsx`
  - `src/components/admin/story-form.tsx`
  - `src/app/admin/review/page.tsx`
  - `src/lib/admin.ts`
  - `src/lib/articles.ts`
  - `src/app/(site)/article/[slug]/page.tsx`
- AI intake files:
  - `src/actions/intake.ts`
  - `src/lib/source-extract.ts`
  - `src/components/admin/new-story-intake.tsx`

---

## 6. Next session — recommended order

1. **Git init and first commit.**
   - Confirm `.env` and local artifacts are ignored.
   - Commit the current working application before adding deployment files.
2. **R0 packaging.**
   - `Dockerfile` using the Next.js standalone output.
   - `docker-compose.yml` with app, PostgreSQL and Caddy.
   - Caddy reverse proxy and HTTPS configuration.
3. **Operations.**
   - Backup script for PostgreSQL.
   - Restore script and a real restore test.
   - Health check and deployment notes.
4. **CI/CD.**
   - GitHub Actions: install, typecheck, lint, build.
   - Deployment workflow for Hetzner.
5. **Then R1 polish.**
   - Gold examples for the Nepali-angle prompt.
   - TipTap editor.
   - Media library.
   - Ad campaign management.
   - Scheduling and newsletter.
   - Nepal section behind its feature flag.
   - Model management UI.

The gold-example prompt work is not a deployment blocker. R0 packaging comes first.

---

## 7. Blockers and external dependencies

- Real Google OAuth requires Google Cloud credentials and allowlisted accounts.
- Hetzner provisioning requires account access.
- Cloudflare DNS/TLS and R2 require account access.
- Resend requires an API key and verified sending domain.
- Docker is not installed on the local machine; Compose files can be written but not run locally.
- Sentry and production monitoring require an account.
- The workspace still needs to be initialized as a Git repository.

---

## 8. Commands

```bash
# Start PostgreSQL (if not already running)
brew services start postgresql@16

# Check database
pg_isready

# Apply migrations
npm run db:migrate

# Seed
npm run db:seed

# Start development server
npm run dev

# Checks
npm run typecheck
npm run lint
npm run build
```
