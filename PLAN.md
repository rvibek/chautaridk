# Chautari.dk — Dynamic Website Plan

**Status:** Agreed v1  
**Date:** 28 October 2026  
**Scope:** Dynamic news portal, editorial console, AI-assisted Nepali translation, phased community and distribution features.

---

## 1. Product summary

Chautari.dk is a Nepali-language news portal for the Nepali diaspora in Denmark.

Primary goals:

- Publish 2–3 editorially reviewed stories per day.
- Translate/summarise Danish, English and Nepali source material into a consistent Nepali house style.
- Give a small newsroom (3–4 admins) a fast, safe editorial workflow.
- Keep the public site fast, accessible, SEO-friendly and mobile-first.
- Add community discussion and public authentication only after the newsroom is stable.

Non-goals for the first release:

- Public user accounts.
- Comments, votes or forum features.
- Automated publishing from feeds.
- Multi-language public editions.
- Complex programmatic advertising.

---

## 2. Agreed decisions

1. **Release order:** News + Opinion first, Nepal second, Discussion later.
2. **Opinion:** Commissioned columnists only. No public opinion submissions. Columnists may write directly in Nepali or submit English/Danish for translation.
3. **Approval:** The same admin who creates a story may approve it. Approval is still an explicit, audited action.
4. **Public authentication:** Deferred to R3. Admin authentication is required from R0.
5. **Login providers for R3:** Google, Microsoft, Facebook, X — introduced in that order. No password management.
6. **Nepal section:** Curated foreign news and diaspora news, always human-approved. No auto-publishing.
7. **Discussion:** Comments on news articles come later, followed by up/down votes and moderation.
8. **Primary language:** Nepali, with English and Danish words/phrases where appropriate. Latin slugs.
9. **AI:** Google Gemini is the default model. Superadmin can add, configure, deactivate and set default models.
10. **Model deletion:** Soft-deactivate only. Revisions must remain reproducible.
11. **Ads:** Direct/house ads in R1. AdSense and reporting in R2.
12. **Hosting:** Start on Hetzner CPX02 (1 GB) for development/private beta; upgrade to 2 GB before public launch.
13. **Admin accounts:** Two superadmin accounts are recommended even if one person operates both.
14. **Nepal and बहस:** Hidden behind feature flags until their releases. Do not launch empty sections.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Runtime | Node.js 22 LTS |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Auth.js (OAuth; admin allowlist in R0, public providers in R3) |
| UI | Tailwind CSS + shadcn/ui + Radix |
| Editor | TipTap |
| Validation | Zod + typed server actions |
| Jobs | pg-boss (Postgres-backed; no Redis on 1 GB) |
| Media | Cloudflare R2 + pre-generated image sizes |
| Email | Resend |
| AI | Provider adapter; Gemini default |
| Search | PostgreSQL `pg_trgm` initially |
| Analytics | Cloudflare Web Analytics initially; Plausible/Umami later |
| Errors | Sentry |
| Hosting | Hetzner Cloud, EU location |
| Reverse proxy | Caddy |
| CI/CD | GitHub Actions → GHCR image → SSH deploy |

Package manager: `pnpm`.

---

## 4. Releases

### R0 — Foundation (≈1 week)

Deliverables:

- Private Git repository, TypeScript strict mode, lint/format, CI.
- Hetzner CPX02 in an EU location.
- Ubuntu LTS, SSH keys, firewall, 2 GB swap, Docker, Caddy, PostgreSQL.
- Cloudflare DNS + TLS.
- Docker Compose: app, Postgres, Caddy.
- Auth.js with Google OAuth restricted to an allowlist.
- Roles: `SUPER_ADMIN`, `ADMIN`.
- Admin shell, audit log foundation, settings table.
- Drizzle schema v1 and migration workflow.
- Seed categories, ad slots, default Gemini provider/model.
- Automated offsite database backups and a tested restore.
- Sentry + external uptime monitoring.
- Walking skeleton: admin logs in → creates draft → publishes a placeholder → public page renders.

Acceptance:

- Restore from backup succeeds on a clean database.
- Unauthorised users cannot reach `/admin`.
- Deployment is reproducible from CI.

---

### R1 — Newsroom MVP (≈6–8 weeks)

Theme: **News + Opinion, end to end.**

#### Public site

- Dynamic homepage based on the approved template.
- News index and category pages:
  - समाचार
  - अर्थ र बैंकिङ
  - कानुन र भिसा
  - समुदाय
  - श्रम र समाज
- Article page:
  - Nepali headline, dek and body
  - hero image and caption
  - author/editor byline
  - source attribution block: publisher, original title, date, link
  - translation/summary note
  - rights status recorded internally
- Opinion index and article pages:
  - columnist profile, photo, bio and byline
  - “लेखकको व्यक्तिगत विचार” label
- About, Contact, Privacy, Terms, Editorial Policy.
- Basic search over articles.
- RSS, sitemap, canonical URLs, OpenGraph, JSON-LD `NewsArticle`.
- Direct/house ad slots rendered; superadmin can manage them.
- Nepal and बहस hidden via feature flags.
- Newsletter forms hidden until R2.

#### Admin console

- Google OAuth allowlist login.
- Dashboard: drafts, review queue, published, scheduled.
- Story workspace:
  - source URL extraction, paste, PDF upload
  - source language and rights note
  - Gemini translation with central style guide and glossary
  - side-by-side source/Nepali editor
  - back-translation for verification
  - headline options and SEO fields
  - re-prompt with instructions
  - manual editing
  - revision diff and history
  - preview, approve, schedule, publish
- Opinion workspace with columnist management.
- Media library with alt text.
- Model registry (superadmin only):
  - Gemini default
  - add/configure/deactivate OpenAI, Anthropic, Mistral, additional Gemini models
  - set default and fallback order
  - encrypted API keys, connection test, usage log
- Settings:
  - categories
  - style guide
  - glossary
  - prompt templates
  - ad slots
  - feature flags
- Audit log: publish, approve, edit, role change, model change, ad change.
- Email notifications: changes requested, approved, scheduled.
- Optimistic locking/version field to prevent admins overwriting each other.

#### R1 acceptance criteria

- Admin can go from URL/paste to published Nepali story with a mandatory review step.
- Every published article has source attribution, rights note, revision history and audit entry.
- Re-prompting creates a new revision; approved text is never silently overwritten.
- Opinion articles render with columnist byline and disclaimer.
- Superadmin can add/deactivate models and change the default without a deploy.
- Two or more admins can work concurrently without data loss.
- Site passes mobile, accessibility and core SEO checks.
- Backups and restore are verified.
- Direct ads can be created, scheduled and displayed.

---

### R2 — Nepal, distribution and ads (≈2–3 weeks)

- Nepal section:
  - curated foreign and diaspora news
  - admin curation inbox for URLs and RSS
  - source attribution and approval required
  - no automatic publishing
- Newsletter:
  - double opt-in
  - unsubscribe
  - subscriber export
  - Resend integration
- Static page manager for non-legal pages.
- AdSense integration with consent banner.
- Direct ad reporting: impressions, clicks, date range.
- Search improvements if volume requires.
- Re-enable newsletter forms across the public site.

Acceptance:

- Nepal story cannot publish without a source and admin approval.
- Newsletter signup confirms via email before adding the subscriber.
- AdSense loads only after the required consent.

---

### R3 — Community (≈4–5 weeks)

Can be split into 3a (auth + comments) and 3b (votes + moderation).

- Public OAuth via Google, Microsoft, Facebook, X.
- Local user profile linked to provider identity; no passwords.
- Comments on news articles.
- Threaded replies, maximum depth ~5.
- Upvote/downvote with one vote per user and toggle/switch.
- Sorting: hot, new, top.
- Reports, remove/restore, lock/pin, suspend user.
- Rate limits, Cloudflare Turnstile, spam heuristics.
- Moderation queue and moderator log.
- Account deletion/anonymisation and data export.

Acceptance:

- Public user can sign in with each enabled provider.
- Vote uniqueness is enforced in the database.
- Reported content reaches the moderation queue.
- Deleted accounts no longer expose personal data while preserving thread integrity.

---

### R4 — Growth and optimisation (ongoing)

- Analytics dashboards for editorial and ads.
- Model A/B testing and translation quality review.
- Typesense/Meilisearch if PostgreSQL search is insufficient.
- PWA/offline reading.
- Multi-language editions if required.
- Advanced ad reporting and advertiser self-service.
- Automated content suggestions from trusted feeds (still human-approved).

---

## 5. Roles and permissions

### SUPER_ADMIN

- Everything an admin can do.
- Manage admins and roles.
- Manage AI providers/models and API keys.
- Manage ads and ad slots.
- Manage global settings, feature flags, style guide, glossary.
- View audit log.
- Emergency unpublish.

### ADMIN

- Create/edit/translate stories and opinion.
- Approve/reject/request changes.
- Schedule and publish.
- Manage media.
- Manage columnists.
- View audit entries relevant to their work.

### PUBLIC_USER (R3)

- OAuth login.
- Comment, vote, report.
- Edit display name/avatar.
- Delete own account.

Permissions should be checked server-side on every mutation. UI hiding is not security.

---

## 6. Editorial workflow

```text
DRAFT
  → EXTRACTING
  → TRANSLATING
  → NEEDS_REVIEW
      → CHANGES_REQUESTED → edit/reprompt → NEEDS_REVIEW
      → APPROVED → SCHEDULED / PUBLISHED
      → REJECTED
  → ARCHIVED
```

Rules:

- Transitions are explicit and audited.
- Edits create revisions; published revisions remain immutable.
- Re-prompt stores the instruction, model, prompt version and token usage.
- Same-admin approval is allowed.
- Optional four-eyes rule can be enabled later for legal/immigration content.
- Preview links are signed and expire.
- Scheduled publishing uses a pg-boss job.

---

## 7. AI translation pipeline

1. **Intake**
   - Public URL → server-side extraction with Readability.
   - Private/paywalled → paste or PDF.
   - Store source metadata and permission/rights note.
2. **Preparation**
   - Detect source language.
   - Clean navigation/boilerplate.
   - Summarise long source material.
3. **Generation**
   - Nepali headline options, dek, body, SEO fields, tags.
   - Apply style guide, glossary and approved examples.
   - Return structured JSON.
4. **Quality checks**
   - Numbers, dates, names, links and quote fidelity.
   - Back-translation or source summary for editor verification.
5. **Human review**
   - Side-by-side editing.
   - Re-prompt with presets or free text.
   - Revision diff.
6. **Approval and publish**
   - Preview, approve, schedule or publish.

Guardrails:

- Treat extracted source text as untrusted; defend against prompt injection.
- Do not reproduce full copyrighted articles without permission. Prefer summary + key quotes + attribution + link.
- Human approval is mandatory.
- Editorial policy discloses AI-assisted translation.
- Store model, prompt version and token usage for every revision.

---

## 8. Data model (v1)

Core:

- `users`
- `accounts` (OAuth)
- `sessions`
- `audit_logs`
- `settings`

Content:

- `articles`
- `article_revisions`
- `sources`
- `categories`
- `tags`
- `article_tags`
- `media`
- `columnists`

AI:

- `ai_providers`
- `ai_models`
- `translation_profiles`
- `glossary_terms`
- `prompt_templates`
- `ai_usage_logs`

Ads:

- `ad_slots`
- `ad_campaigns`
- `ad_events`

Distribution:

- `static_pages`
- `newsletter_subscribers`

R3:

- `comments`
- `votes`
- `reports`
- `moderation_actions`

Key article fields:

`id`, `slug` (Latin, unique), `section_id`, `status`, `locale`, `title`, `dek`, `body` (JSON), `hero_media_id`, `author_id`, `editor_id`, `published_at`, `scheduled_at`, `seo_title`, `seo_description`, `canonical_url`, `rights_status`, `allow_comments`, `version`, timestamps.

Key revision fields:

`article_id`, `revision_no`, `title`, `dek`, `body`, `seo`, `change_reason`, `created_by`, `ai_model_id`, `prompt_version`, `token_input`, `token_output`, `back_translation`, `status`, `created_at`.

Vote constraint:

`UNIQUE(user_id, target_type, target_id)` with value `+1/-1`.

---

## 9. Admin console routes

- `/admin` — dashboard
- `/admin/stories`
- `/admin/stories/new`
- `/admin/stories/[id]`
- `/admin/review`
- `/admin/opinion`
- `/admin/columnists`
- `/admin/media`
- `/admin/categories`
- `/admin/users`
- `/admin/ads` (superadmin)
- `/admin/models` (superadmin)
- `/admin/settings`
- `/admin/audit`

Public routes:

- `/`
- `/samachar`
- `/samachar/[category]`
- `/article/[slug]`
- `/vichar`
- `/vichar/[slug]`
- `/nepal` (R2)
- `/bahas` (R3)
- `/search`
- `/about`, `/contact`, `/privacy`, `/terms`, `/editorial-policy`
- `/sitemap.xml`, `/rss.xml`, `/robots.txt`

---

## 10. Infrastructure — cheapest sensible setup

### Start (R0–R1 private beta)

- Hetzner CPX02: 1 vCPU, 1 GB RAM, 20 GB NVMe, ~€6.49/month.
- EU location (Falkenstein/Nuremberg/Helsinki).
- 2 GB swap, `vm.swappiness=10`.
- Docker Compose: Next.js standalone, PostgreSQL, Caddy.
- No Redis; pg-boss for jobs.
- No self-hosted analytics; Cloudflare Web Analytics.
- Media in Cloudflare R2.
- Builds in GitHub Actions; server only pulls images.
- Postgres tuning for 1 GB:
  - `shared_buffers=128MB`
  - `work_mem=4MB`
  - `maintenance_work_mem=64MB`
  - `max_connections=20`
  - `random_page_cost=1.1`
- Log rotation and Docker image pruning.
- Daily `pg_dump` to R2/Storage Box.
- Cloudflare proxy, TLS, WAF, rate limiting.
- Sentry free tier, UptimeRobot/Better Stack.

### Before public launch

- Upgrade to CPX11 (2 GB) or CPX21 (4 GB).
- Snapshot before resize.
- Disk can grow but not shrink.
- Re-test backups and restore after resize.

### Estimated monthly cost

- Server: €6.49–10
- Backups: €1–4
- R2: free/low
- Resend: free tier initially
- Gemini: low double digits at 60–90 stories/month
- Total: roughly €15–25/month plus AI usage

---

## 11. Security and compliance

- HTTPS everywhere; HSTS.
- Admin OAuth allowlist.
- Optional TOTP for admins.
- Role checks server-side.
- CSRF protection and rate limits.
- CSP, secure headers.
- Encrypted AI API keys at rest (AES-256-GCM, master key in environment).
- Signed media uploads.
- No secrets in the repository.
- Audit log for sensitive actions.
- GDPR: EU hosting, DPAs, retention policy, account deletion/export, cookie consent for AdSense.
- Copyright: rights status per source, attribution, takedown process, permission notes for private material.
- Legal review of translation/copyright approach before launch.
- Accessibility: WCAG 2.1 AA, keyboard navigation, Nepali screen-reader checks.
- Editorial policy and moderation policy published.

---

## 12. SEO and performance

- SSR/ISR with cache revalidation on publish.
- Latin slugs, canonical URLs.
- OpenGraph and Twitter cards.
- JSON-LD `NewsArticle`.
- Sitemap and RSS.
- Optimised images with width/height and alt text.
- Cloudflare CDN caching for public pages.
- Database indexes for slug, status, published_at, category.
- Core Web Vitals checks on mobile.
- Nepali font loading: `preconnect`, `font-display: swap`, subset if practical.

---

## 13. Testing and CI/CD

- TypeScript strict mode.
- ESLint + Prettier.
- Vitest for units and server logic.
- Playwright for critical flows:
  - admin login
  - create source
  - generate translation
  - edit and approve
  - publish
  - public article renders
  - ad slot renders
- Migration check in CI.
- Docker image build in GitHub Actions, push to GHCR.
- Deploy via SSH: pull image, run migrations, restart.
- Staging environment before public launch (second small server or separate compose stack).
- Seed script for local development.

---

## 14. Timeline

| Phase | Duration | Outcome |
|---|---:|---|
| R0 Foundation | 1 week | Auth, roles, DB, deploy, backups |
| R1 Newsroom MVP | 6–8 weeks | News + Opinion live |
| R2 Nepal & distribution | 2–3 weeks | Nepal, newsletter, AdSense, reports |
| R3 Community | 4–5 weeks | OAuth, comments, votes, moderation |
| R4 Growth | ongoing | Analytics, search, PWA, multi-language |

Assumes one full-time developer with part-time design/editorial support. Part-time development stretches R1 to 8–10 weeks.

---

## 15. Open decisions

- Admin console language: English-first or Nepali-first (recommend bilingual-ready, Nepali labels for content fields).
- Newsletter provider confirmation: Resend.
- Contact form handling: email inbox vs ticketing.
- AdSense approval and consent management approach.
- Legal review of source translation and copyright policy.
- Whether to enforce four-eyes approval for legal/immigration stories later.
- Public comment policy details (allowed content, appeals, retention).
- Whether to add a second superadmin account.
- AI bake-off: compare Gemini against one alternative on 10 real articles before freezing prompts.

---

## 16. Immediate next steps (R0)

1. Create private repository and Next.js TypeScript project.
2. Provision Hetzner CPX02, harden server, add swap and Docker.
3. Configure Cloudflare DNS/TLS and R2 bucket.
4. Implement Auth.js Google allowlist and admin roles.
5. Add Drizzle schema v1 and migrations.
6. Build admin shell and audit log.
7. Seed categories, ad slots and Gemini model.
8. Deploy walking skeleton: login → draft → publish → public page.
9. Set up daily backups and test restore.
10. Start R1 source-to-translation vertical slice.

---

## 17. Definition of done for the dynamic site

- Newsroom can publish 2–3 reviewed stories/day without developer involvement.
- Translation style is consistent and reproducible.
- Every story is traceable to a source, a rights note and a revision history.
- Superadmin controls models and ads without deploys.
- Public site is fast, mobile-friendly, accessible and indexable.
- Backups, monitoring and restore process are proven.
- Nepal, discussion and public auth can be enabled later without re-architecting.

---

## 18. Progress log

### 28 October 2026

**Completed**

- Milestone 1: published-article revision workflow.
  - Live article remains public while a draft revision is edited.
  - Explicit approval swaps the live copy in a transaction.
  - Draft preview, discard, unpublish, republish and audit history.
  - Optimistic concurrency and immutable published revisions.
- Milestone 2: AI intake from URL, pasted text or blank draft.
  - Safe URL extraction with SSRF protection.
  - Gemini generation of Nepali title, dek, body, SEO and back-translation.
  - AI output remains a draft; reprompt and usage logging.
- AI prompt v2: source-backed Nepali angle for readers in Denmark.
  - Implemented as a real Gemini `systemInstruction`.
  - Guardrail against invented Nepal–Denmark connections.
  - `Nepali angle:` line required in the back-translation.
  - Stored in the default translation profile and `translate-news` template.
- README and handoff documentation updated.
- Typecheck and lint pass.
- AI URL intake tested with a valid key and a real source.

**Next**

1. Initialize Git and make the first commit.
2. Add Dockerfile and Docker Compose.
3. Add Caddy, backups and restore test.
4. Add GitHub Actions CI.
5. Continue R1 polish, including gold examples for the Nepali-angle prompt.
