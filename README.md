# चौतारी.dk — Chautari

Nepali-language news portal for the Nepali diaspora in Denmark.

The project is at the **R0/R1 boundary**. Public pages, the editorial console, authentication, the database schema, the draft → review → publish flow, the first AI intake pipeline, and the R0 container packaging are implemented. Media uploads, newsletter, Nepal curation, comments, and public user accounts are planned for later releases. See [`PLAN.md`](./PLAN.md) for the full release plan.

> **Last worked:** 29 October 2026. Milestone 1 (published-article revisions), Milestone 2 (AI intake), and the R0 container packaging are complete and verified. The next task is provisioning Hetzner and performing the first live deployment, then continuing R1 polish. See [§17](#17-what-to-do-when-resuming-this-work), [`DEPLOYMENT.md`](./DEPLOYMENT.md) and [`HANDOFF.md`](./HANDOFF.md).

---

## 1. Current status

### Implemented

- Next.js 16 App Router + TypeScript.
- PostgreSQL 16 + Drizzle ORM schema and migration.
- Auth.js with:
  - Google OAuth support.
  - Local development email login.
  - Admin email allowlist.
  - `SUPER_ADMIN` / `ADMIN` roles.
- Public site:
  - dynamic homepage
  - article pages
  - समाचार index and category pages
  - विचार index
  - search
  - about, contact, privacy, terms, editorial policy
  - ad placeholders and direct house-ad rendering
  - JSON-LD, sitemap, robots, health endpoint
- Admin console:
  - dashboard and activity feed
  - story list and editor
  - draft → submit for review → approve and publish
  - published-article revisions: the live article stays online while a separate draft is edited
  - draft preview, discard, unpublish and republish
  - revision history and audit log
  - read-only views for ad slots, AI models, users, settings, columnists
- AI intake:
  - public source URL with Readability extraction and SSRF protection
  - pasted source text
  - blank manual draft
  - Gemini-generated Nepali headline, dek, body, SEO fields and back-translation
  - system-instruction rule requiring a **source-backed Nepali angle** for readers in Denmark
  - AI output is always a `DRAFT` and must pass explicit review
  - reprompt from the stored source text
  - model, prompt version and token usage recorded per revision
- Seed data:
  - categories
  - superadmin and admin accounts
  - Gemini default model
  - ad slots
  - translation style guide, prompt template, glossary
  - local sample stories and one columnist
  - production-safe mode that skips demo content and the demo editor account
- Production packaging:
  - multi-stage Dockerfile with standalone app and separate migration/seed image
  - Docker Compose stack with PostgreSQL, app and Caddy
  - Caddy reverse proxy and security headers
  - backup, restore and restore-test scripts
  - GitHub Actions CI and GHCR container publishing
  - deployment runbook in [`DEPLOYMENT.md`](./DEPLOYMENT.md)

### Not implemented yet

- Media library and image uploads.
- Ad campaign create/edit UI.
- AI model add/deactivate UI.
- Newsletter.
- Nepal section (feature-flagged off).
- Public authentication, comments, votes, moderation.
- Hetzner provisioning and the first live deployment. The deployment files are ready; the account does not exist yet.
- Sentry and external uptime monitoring.

### Last verified — 28 October 2026

- `npm run typecheck` and `npm run lint` pass.
- A clean migration + seed was tested on a fresh database.
- The revision workflow was exercised end to end: edit a live article, keep it public, approve the revision, and swap the live copy.
- AI URL intake was tested with a real source and a valid `GEMINI_API_KEY`; the output contained a source-backed Nepali angle and the required `Nepali angle:` line in the back-translation.
- The temporary test draft was deleted; no test article was left behind.
- The production image and tools image build successfully with Podman.
- The standalone container starts and serves `/api/health`, `/` and the `/admin` redirect.
- The production seed created the admin and reference data without demo articles; a separate sample-content seed created the expected demo articles.
- A backup was restored into a scratch database and verified: 7 articles, 1 user and 7 revisions.
- The Caddyfile passes `caddy validate`.
- GitHub Actions CI passed on `main`.
- The container workflow published both app and tools images to GHCR.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | Auth.js / NextAuth v5 |
| Styling | Tailwind CSS v4 + custom Chautari design system |
| Icons | Lucide |
| Jobs | pg-boss (installed, not wired yet) |
| AI | Google Gemini through `@google/genai`; provider/model registry in PostgreSQL |
| Source extraction | `@mozilla/readability` + `jsdom` |

---

## 3. Prerequisites

- Node.js **22 LTS or newer** (the project is developed on Node 26).
- npm 11+.
- PostgreSQL 16.
- macOS, Linux, or WSL.

On macOS with Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
```

Make sure PostgreSQL binaries are available:

```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

---

## 4. First-time setup

### 4.1 Install dependencies

```bash
npm install
```

### 4.2 Create the environment file

```bash
cp .env.example .env
```

Edit `.env`. At minimum, set:

```dotenv
DATABASE_URL=postgres://YOUR_OS_USER@localhost:5432/chautari_dev
AUTH_SECRET=generate-a-random-secret
AUTH_TRUST_HOST=true
APP_URL=http://localhost:3000

ADMIN_ALLOWED_EMAILS=admin@chautari.dk,editor@chautari.dk
SUPER_ADMIN_EMAILS=admin@chautari.dk

DEV_LOGIN_ENABLED=true
SEED_ADMIN_EMAIL=admin@chautari.dk

# AI intake (optional for browsing the site, required for AI drafts)
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-2.5-flash
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

> **Important:** `DATABASE_URL` must use your local PostgreSQL user. On macOS Homebrew this is usually your macOS username, not `postgres`.

### 4.3 Create the database

```bash
createdb chautari_dev
```

If `createdb` is not on your PATH:

```bash
/opt/homebrew/opt/postgresql@16/bin/createdb chautari_dev
```

### 4.4 Run migrations

```bash
npm run db:migrate
```

### 4.5 Seed the database

```bash
npm run db:seed
```

This creates:

- categories
- `admin@chautari.dk` as `SUPER_ADMIN`
- `editor@chautari.dk` as `ADMIN`
- Gemini 2.5 Flash as the default model
- ad slots
- style guide, prompt template and glossary
- sample stories and a columnist in non-production environments

Sample content can be disabled by running the seed with `NODE_ENV=production`, or forced in production with `SEED_SAMPLE_CONTENT=true`.

### 4.6 Start the development server

```bash
npm run dev
```

Open:

- Public site: <http://localhost:3000>
- Admin login: <http://localhost:3000/login>
- Admin console: <http://localhost:3000/admin>

---

## 5. Logging in

### Local development login

When `DEV_LOGIN_ENABLED=true` and `NODE_ENV` is not `production`, `/login` shows a passwordless local login form.

Use one of the allowed emails:

```text
admin@chautari.dk
editor@chautari.dk
```

The email must also appear in `ADMIN_ALLOWED_EMAILS`.

> This login method is **only for local development**. It is disabled automatically in production even if the flag is left on. Set `DEV_LOGIN_ENABLED=false` in production anyway.

### Google login

1. Go to Google Cloud Console → **APIs & Services → Credentials**.
2. Create an **OAuth client ID** of type **Web application**.
3. Add authorised JavaScript origin:
   - `http://localhost:3000`
4. Add authorised redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
5. Copy the client ID and secret into `.env`:

```dotenv
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

6. Restart the dev server.

For production, add the production domain and its callback URL:

```text
https://chautari.dk/api/auth/callback/google
```

### Adding an admin

1. Add the person's email to `ADMIN_ALLOWED_EMAILS`.
2. Add it to `SUPER_ADMIN_EMAILS` only if they need superadmin rights.
3. Restart the app.
4. The person signs in with Google.
5. A user row is created automatically and the role is assigned from the allowlist.

Server-side role checks are enforced on every admin action. Hiding a link in the UI is not treated as security.

---

## 6. Running the site

### Development

```bash
npm run dev
```

### Production build locally

```bash
npm run build
npm start
```

`AUTH_SECRET`, `DATABASE_URL` and the other environment variables must be available when building and running.

> `npm start` runs with `NODE_ENV=production`, so the local dev login is disabled. Use `npm run dev` if you want the passwordless local admin login. Production uses Google OAuth.

### Type checking and linting

```bash
npm run typecheck
npm run lint
```

### Health check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"ok":true,"service":"chautari","time":"..."}
```

---

## 7. Admin console: how to run the newsroom

### 7.1 Create a story

1. Open `/admin`.
2. Click **+ नयाँ स्टोरी**.
3. Choose one of three starting points:
   - **लिङ्कबाट सुरु** — paste a public source URL.
   - **सामग्री टाँस्नुहोस्** — paste source text directly.
   - **खाली मस्यौदा** — write a manual Nepali draft.
4. For link/text intake, choose section, content type and rights status, then optionally add an editorial instruction.
5. Click the AI intake button. The request can take 30–60 seconds.
6. The AI output opens as a `DRAFT` on the story edit screen.

Deep links: `/admin/stories/new?tab=blank`, `?tab=text`, `?tab=url`.

### 7.2 AI intake rules

The AI pipeline:

1. Fetches a public URL with a 20-second timeout, 2.5 MB limit and SSRF protection.
2. Rejects localhost, private IP ranges, link-local addresses and non-HTML responses.
3. Extracts the main article text and metadata with Readability.
4. Stores the extracted text in `sources.raw_text` for reprompting and auditing.
5. Sends the source and the house style guide, glossary and prompt template to Gemini.
6. Produces a Nepali headline, dek, body, SEO title/description and an English back-translation.
7. Saves everything as a `DRAFT` revision and records model, prompt version and token usage.

The system instruction requires a **Nepali angle** in every story: the dek or first two or three paragraphs must explain why the story matters to Nepali readers living in Denmark. The model may connect it to Danish rules and policy, work and visas, study, tax and living costs, family, health, local services, Nepal–Denmark links, or the practical impact on the Nepali community. It must not invent a Nepal–Denmark connection; if there is no genuine link, it says so in one sentence. A separate “नेपाली एंगल” heading is optional, not a template requirement. The back-translation must include a line starting with `Nepali angle:` so the editor can check it.

The angle rule is stored in the default translation profile and the active `translate-news` prompt template, so it can be edited in the database without a code deploy. A fresh seed creates version 2 of both; migration `0002_nepali_angle_prompt.sql` updates existing installs.

AI output is **never published automatically**. An editor must verify facts, names, dates and quotations, then explicitly submit the draft for review.

The edit screen shows the source, rights status and back-translation. Use **एआई पुनः तयार** to reprompt from the stored source text; this only changes the open draft.

If `GEMINI_API_KEY` is missing or invalid, intake returns a clear error and does not create an article.

### 7.3 Body editor format

The R0 editor is intentionally simple plain text. It stores TipTap-compatible JSON.

- Separate paragraphs with a blank line.
- `## Heading` creates a subheading.
- `- Item` creates a bullet list.

Example:

```text
पहिलो अनुच्छेद।

## उपशीर्षक

दोस्रो अनुच्छेद।

- पहिलो बुँदा
- दोस्रो बुँदा
```

A full TipTap editor is planned for R1.

### 7.4 Review and publish

1. Save the draft.
2. Click **समीक्षाका लागि पठाउनुहोस्**.
3. Open **समीक्षा** in the sidebar.
4. Check title, dek, numbers, dates, names, source and rights.
5. Click **स्वीकृत र प्रकाशित**.

The same admin may create and approve a story. This is explicitly allowed, but the approval is recorded in the audit log with a `selfApproved` flag.

Published stories appear at `/article/[slug]`.

### 7.5 Edit a published article without taking it offline

Published stories and drafts are separate:

- The `articles` row is the **live published copy**.
- An `article_revisions` row is a **candidate draft**.
- A published article can have at most one open revision (`DRAFT`, `NEEDS_REVIEW` or `CHANGES_REQUESTED`).
- Opening a revision copies the live content into a new draft. The public page keeps serving the old copy.
- Saving edits only changes the draft.
- Approval copies the draft into `articles` inside one transaction and marks the revision `PUBLISHED`.
- Published revisions are immutable.

Workflow:

1. Open a published story.
2. Click **नयाँ संस्करण सुरु गर्नुहोस्**.
3. Edit and save. Use **मस्यौदा पूर्वावलोकन** to inspect the draft privately.
4. Submit for review.
5. Approve and publish. The public article swaps to the new content.

The public page displays the original publication date and an **अद्यावधिक** date when the article has been republished.

### 7.6 Unpublish, discard and republish

- **अनपब्लिश गर्नुहोस्** removes the article from the public site, sets it to `DRAFT`, and opens a working revision from the last live content.
- **मस्यौदा खारेज गर्नुहोस्** deletes the open draft. The live article is untouched.
- To republish, submit the working revision for review and approve it.
- Discarding and unpublishing are both audited.

### 7.7 Superadmin pages

Only `SUPER_ADMIN` users can see and access:

- `/admin/ads` — ad slots and campaigns (read-only in R0)
- `/admin/models` — AI model registry (read-only in R0)
- `/admin/users` — admin accounts

### 7.8 Audit log

`/admin/audit` records:

- story creation
- revision start, save, submit, discard and publish
- AI generation and reprompt
- publication and unpublishing
- future role, model and ad changes

---

## 8. Database

### Schema and migrations

- Schema: `src/db/schema.ts`
- Generated migrations: `drizzle/`
- Drizzle config: `drizzle.config.ts`

After changing the schema:

```bash
npm run db:generate
npm run db:migrate
```

Use `npm run db:push` only for quick local prototyping. Migrations are the source of truth.

### Revision model

- `articles` is the live public copy.
- `article_revisions` stores every candidate and published version.
- A partial unique index allows only one open revision per article (`DRAFT`, `NEEDS_REVIEW`, `CHANGES_REQUESTED`).
- `articles.first_published_at` preserves the original publication date; `articles.updated_at` becomes `dateModified` in JSON-LD.
- `sources.raw_text` stores extracted or pasted source text for reprompting and audit.
- The `0001` migration backfills existing articles and revisions with the new metadata.

### Drizzle Studio

```bash
npm run db:studio
```

### Reset the local database

> This deletes all local data.

```bash
dropdb chautari_dev
createdb chautari_dev
npm run db:migrate
npm run db:seed
```

With Homebrew PostgreSQL:

```bash
/opt/homebrew/opt/postgresql@16/bin/dropdb chautari_dev
/opt/homebrew/opt/postgresql@16/bin/createdb chautari_dev
```

### Backup and restore

```bash
pg_dump chautari_dev > chautari-backup.sql
psql chautari_dev < chautari-backup.sql
```

Production backups are not automated yet. They are part of the remaining R0 operations work.

---

## 9. npm scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (prototyping only) |
| `npm run db:seed` | Seed categories, admins, models, ads and samples |
| `npm run db:studio` | Open Drizzle Studio |

---

## 10. Project structure

```text
.
├── backup/                  # Original static HTML site, kept for reference
├── drizzle/                 # Generated SQL migrations
├── public/                  # Static assets
├── src/
│   ├── actions/             # Server actions (auth, story workflow, AI intake)
│   ├── app/
│   │   ├── (site)/          # Public site routes and layout
│   │   ├── admin/           # Editorial console
│   │   ├── api/             # Auth and health routes
│   │   ├── login/           # Admin login
│   │   ├── globals.css      # Chautari design system + admin styles
│   │   └── layout.tsx       # Root layout and fonts
│   ├── components/
│   │   ├── admin/           # Admin-only components
│   │   └── ...              # Public site components
│   ├── db/
│   │   ├── index.ts         # Database client
│   │   ├── schema.ts        # Drizzle schema
│   │   └── seed.ts          # Seed script
│   ├── lib/
│   │   ├── ai/draft.ts      # Gemini prompt, schema and generation
│   │   ├── source-extract.ts # Safe URL fetch and Readability extraction
│   │   ├── revisions.ts     # Revision helpers and open-revision guard
│   │   └── ...              # Auth guards, queries, content helpers, audit
│   ├── types/               # Auth type augmentation
│   └── auth.ts              # Auth.js configuration
├── .env.example
├── PLAN.md
└── README.md
```

---

## 11. Public routes

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/samachar` | All news |
| `/samachar/[category]` | Category page, e.g. `/samachar/kanun-visa` |
| `/article/[slug]` | Article page |
| `/vichar` | Opinion index |
| `/search?q=` | Search |
| `/about` | About |
| `/contact` | Contact |
| `/privacy` | Privacy policy |
| `/terms` | Terms |
| `/editorial-policy` | Editorial policy |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots |
| `/api/health` | Health check |

Hidden for now: `/nepal`, `/bahas`, newsletter, comments.

---

## 12. Admin routes

| Route | Access |
|---|---|
| `/login` | Public login page |
| `/admin` | All admins |
| `/admin/stories` | All admins |
| `/admin/stories/new` | All admins |
| `/admin/stories/[id]` | All admins |
| `/admin/stories/[id]/preview` | All admins (private draft preview) |
| `/admin/review` | All admins |
| `/admin/opinion` | All admins |
| `/admin/columnists` | All admins |
| `/admin/media` | All admins (placeholder) |
| `/admin/settings` | All admins (read-only) |
| `/admin/audit` | All admins |
| `/admin/ads` | Superadmin only |
| `/admin/models` | Superadmin only |
| `/admin/users` | Superadmin only |

---

## 13. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js signing secret |
| `AUTH_TRUST_HOST` | Recommended | Trust the configured host |
| `AUTH_URL` | Production | Public auth URL, e.g. `https://chautari.dk` |
| `APP_URL` | Yes | Public base URL for metadata and links |
| `ADMIN_ALLOWED_EMAILS` | Yes | Comma-separated admin allowlist |
| `SUPER_ADMIN_EMAILS` | Yes | Comma-separated superadmin allowlist |
| `DEV_LOGIN_ENABLED` | Development | Enable passwordless local login |
| `SEED_ADMIN_EMAIL` | Seed only | Email for the seeded superadmin |
| `SEED_EDITOR_EMAIL` | Optional | Additional admin created by the seed |
| `SEED_SAMPLE_CONTENT` | Production | Must be `false` to skip demo stories and the demo editor |
| `AUTH_GOOGLE_ID` | Production | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Production | Google OAuth client secret |
| `GEMINI_API_KEY` | AI intake | Google AI Studio API key |
| `GEMINI_MODEL` | Optional | Override the model id; defaults to the registry default |
| `RESEND_API_KEY` | Later | Newsletter/email |
| `R2_*` | Later | Cloudflare R2 media storage |
| `R2_REMOTE` | Optional | `rclone` target for offsite database backups |
| `BACKUP_RETENTION_DAYS` | Optional | Local backup retention; defaults to 14 |

Never commit `.env` or real secrets. `.env` is ignored by Git.

---

## 14. Security notes

- Admin access is checked server-side on every page and mutation.
- Admin emails must be on the allowlist.
- The local dev login is passwordless by design and is blocked in production.
- Google OAuth is the production login method.
- Published revisions remain in history; edits create new revisions.
- The same admin may approve their own story, but the audit log records the self-approval.
- AI intake refuses localhost, private and link-local addresses, follows at most three redirects, and caps source responses at 2.5 MB.
- Gemini API keys live in server-only environment variables. Never expose them to the browser.
- Caddy provides HTTPS, HTTP-to-HTTPS redirects and a baseline HSTS/security-header policy in production.
- Database backups and a restore-test path are implemented; CSP, application-level rate limiting and external uptime monitoring are still to be completed.

---

## 15. Deployment

The repository now contains the complete container stack:

- `Dockerfile` — multi-stage production image, Next.js standalone runtime, and a separate `tools` target for migrations and seeding.
- `compose.yml` — PostgreSQL 16, one-shot migration, app, optional one-shot seed, and Caddy.
- `Caddyfile` — automatic HTTPS, compression, reverse proxy and basic security headers.
- `.env.production.example` — production environment template.
- `scripts/backup-db.sh` — `pg_dump` with retention and optional `rclone` upload.
- `scripts/restore-db.sh` — guarded restore into the live database.
- `scripts/restore-test.sh` — restores a dump into a scratch database and verifies row counts.
- `scripts/deploy.sh` — pull images, migrate, start app and Caddy, then smoke test.
- `.github/workflows/ci.yml` — migrations, production seed, typecheck, lint and build.
- `.github/workflows/container.yml` — publishes app and tools images to GHCR.

The target production setup remains:

- Hetzner Cloud CPX02 (1 GB) for development/private beta.
- Upgrade to CPX11 (2 GB) before public launch.
- Ubuntu LTS with Docker (or Podman) and a swap file.
- Caddy in front of the Next.js app.
- Cloudflare DNS and TLS. Start with the DNS record set to “DNS only” so Caddy can obtain its certificate.
- Cloudflare R2 for media and optional offsite backups.
- `DEV_LOGIN_ENABLED=false` and `SEED_SAMPLE_CONTENT=false` in production.
- Sentry and external uptime monitoring are still to be added.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full runbook. The stack has been built and tested locally with Podman, including migrations, production-safe seed, backup and restore. It has **not** been deployed to Hetzner because the account does not exist yet.

---

## 16. Troubleshooting

### `connection refused` or `database does not exist`

Check PostgreSQL:

```bash
pg_isready
createdb chautari_dev
```

Confirm `DATABASE_URL` uses the correct user, host, port and database.

### `Invalid environment: AUTH_SECRET is required`

Generate a secret and add it to `.env`:

```bash
openssl rand -base64 32
```

### Login says the email is not allowed

Add the email to `ADMIN_ALLOWED_EMAILS` in `.env`, then restart the dev server.

### Google login does not appear

`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` must both be set. Restart after changing `.env`.

### Google redirect URI mismatch

Use exactly:

```text
http://localhost:3000/api/auth/callback/google
```

and for production:

```text
https://chautari.dk/api/auth/callback/google
```

### Port 3000 is already in use

```bash
lsof -i :3000
```

Stop the old process, or run:

```bash
npm run dev -- -p 3001
```

If you change the port, update `APP_URL` and the Google redirect URI.

### Dev login works locally but not in production

That is intentional. Production requires Google OAuth. Set `DEV_LOGIN_ENABLED=false`.

### A story will not publish

It must first be submitted for review. Open the story, click **समीक्षाका लागि पठाउनुहोस्**, then approve it from **समीक्षा**.

### AI intake says the API key is invalid

1. Create or rotate a key in Google AI Studio.
2. Put it in `.env` as `GEMINI_API_KEY=...`.
3. Restart `npm run dev`.
4. Confirm the key is allowed to use the configured model.

The server never sends the key to the browser and never prints it in the error message.

### AI intake cannot fetch a URL

The source must be public HTML. The fetcher rejects:

- localhost and private IP addresses
- redirects to private addresses
- non-HTML responses
- pages larger than 2.5 MB
- requests that take longer than 20 seconds

Use **सामग्री टाँस्नुहोस्** with the source text when a site blocks automated fetching.

### A published article cannot be edited directly

That is intentional. Open the article and click **नयाँ संस्करण सुरु गर्नुहोस्**. The live page stays online until the new revision is approved and published. The URL slug is locked while the article is live; unpublish first if the slug must change.

### The draft save says another editor changed it

The revision uses optimistic concurrency. Reload the page, review the other editor's changes in the revision history, and reapply your edits.

### A legend or old revision has no section metadata

Run `npm run db:migrate`. The `0001` migration backfills category, kind, rights, source and approval fields from the article row.

---

## 17. What to do when resuming this work

Milestone 1, Milestone 2 and the R0 container packaging are complete. Do not rebuild them; verify them and continue with the live deployment.

1. Start PostgreSQL:
   ```bash
   brew services start postgresql@16
   ```
2. Confirm the database is healthy:
   ```bash
   pg_isready
   ```
3. Apply any pending migrations:
   ```bash
   npm run db:migrate
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `/admin` and verify login.
6. Confirm the AI configuration:
   - `GEMINI_API_KEY` in `.env` is valid.
   - The default Gemini model is active at `/admin/models`.
   - The translation profile and `translate-news` template are at version 2.
7. Provision Hetzner CPX02:
   - Ubuntu LTS, swap, firewall, Docker or Podman.
   - DNS, Cloudflare and Google OAuth redirect URI.
   - First deploy using [`DEPLOYMENT.md`](./DEPLOYMENT.md).
8. Prove the R0 acceptance checklist:
   - admin login → create draft → publish → public page;
   - backup and restore test;
   - `/admin` is protected;
   - CI build and GHCR image publishing are reproducible.
9. Then start R1:
   - TipTap editor polish
   - media library
   - ad campaign management
   - scheduling and newsletter
   - Nepal section behind its feature flag
   - model management UI

### Suggested first task

Push the current commit to GitHub, let CI run, and confirm both GHCR images are published. Then provision the Hetzner server and follow the first-deployment section of [`DEPLOYMENT.md`](./DEPLOYMENT.md).

Keep the gold-example prompt work for later: it is an editorial-quality improvement, not a blocker for launch.

---

## 18. Related documents

- [`PLAN.md`](./PLAN.md) — agreed product and release plan.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — container, deployment, backup and CI runbook.
- [`HANDOFF.md`](./HANDOFF.md) — current session handoff and next steps.
- `backup/` — original static HTML pages, preserved for design reference.

---

## 19. Contact

- Editorial: `editorial@chautari.dk`
- News desk: `news@chautari.dk`
- Advertising: `ads@chautari.dk`
- Privacy: `privacy@chautari.dk`

Copenhagen, Denmark.
