# IL CarLens

**Israel Passenger Car Market Intelligence Platform**

A production-ready Next.js 15 dashboard that helps automotive product managers
and sales teams make data-driven decisions in the Israeli new-car market.
Weekly refreshed from I-VIA (Israel Vehicle Importers Association) PDFs +
Israeli importer websites, and presented around a hero bubble chart that
positions every model by **length × on-road price × sales volume**, colored
by powertrain.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTED5473%2Fmy-first-project&project-name=il-carlens&repository-name=il-carlens&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

### Non-technical users — the 3-click deploy

1. Click the **Deploy with Vercel** button above.
2. Sign in with GitHub (Vercel will ask if this is your first time).
3. Click **Deploy**.

Vercel will automatically provision a managed Neon Postgres database,
wire its connection strings into the project, and build the app. After
about 2 minutes you'll get a live URL like
`https://il-carlens-xxxx.vercel.app` — open it, and the first visit
auto-populates the database with the 2026 Israel market dataset (you'll
see a brief "Getting things ready…" screen for about 15–30 seconds).
That's it. The site stays live forever, refreshing itself every Sunday
evening via Vercel Cron.

## Features

- 🎯 **Hero bubble chart** — interactive, presentation-ready, with rich
  Israel-specific tooltips, strategic insight tags, and click-to-open trim
  matrix.
- 📅 **Global period selector** — 4/8/12 weeks · MTD · YTD 2026 · custom ·
  compare vs. prior period.
- 📊 **KPI dashboard** — total units, YoY, BEV / PHEV / Chinese-brand share,
  volume-weighted avg price, top brand & model.
- 🔍 **Advanced filters** — powertrain, origin, brand, segment, length range,
  price range, free-text search.
- 📋 **Sortable data table** — every trim, with CSV / Excel / PDF export.
- 🚀 **Launch simulator** — input hypothetical specs, see the Israeli
  on-road price (purchase tax + 17% VAT), and get a volume band estimated
  from nearest neighbors.
- 🔔 **Weekly intelligence alerts** — pipeline-generated, with severities.
- ⚙️ **Admin panel** — manual refresh trigger + scrape audit log.
- 🌐 **Hebrew / English** — full RTL support, flag-accented UI.
- 📱 **PWA** — installable, mobile-friendly.

## Tech stack

- **Next.js 15** (App Router, Server Components, Route Handlers)
- **TypeScript** (strict)
- **Tailwind CSS** + shadcn-style UI primitives (Radix)
- **Prisma** ORM on **PostgreSQL** (Supabase / Neon / Railway / local docker)
- **Recharts** for the bubble chart
- **Playwright + pdfplumber / LLM parsing** for scraping (placeholders ready)
- **Vercel Cron** for the weekly (Sunday evening, Israel time) refresh
- **GitHub Actions** — CI (typecheck + lint + build against ephemeral
  Postgres) and automatic preview/production deploys to Vercel

## Quick start (local)

You need Node 22+ and either Docker (for the one-line Postgres) or an
external Postgres URL.

```bash
# 1. local Postgres
docker compose up -d           # or: npm run db:up

# 2. env + install
cp .env.example .env
npm install

# 3. migrate + seed
npm run db:deploy              # applies prisma/migrations
npm run db:seed                # realistic 2026 IL market data

# 4. run
npm run dev                    # http://localhost:3000
```

Other handy scripts:

| Script | What it does |
| --- | --- |
| `npm run db:up` / `db:down` | Start / stop the local Postgres container |
| `npm run db:migrate` | Create a new migration from schema changes |
| `npm run db:deploy` | Apply existing migrations (used in CI / Vercel) |
| `npm run db:reset` | Drop, migrate, re-seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run scrape` | Run the demo I-VIA + importers pipeline |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

## Environment

Copy `.env.example` → `.env` and fill:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres URL (pgbouncer in prod) |
| `DIRECT_URL` | Non-pooled Postgres URL used by Prisma Migrate |
| `ADMIN_API_TOKEN` | Bearer token for `/api/admin/*` |
| `CRON_SECRET` | Bearer token validated on `/api/cron/weekly` |
| `IVIA_REPORTS_INDEX_URL` | I-VIA listing URL (prod scraper entrypoint) |

## Deploy to Vercel

### One-click

Click the **Deploy with Vercel** button above. Vercel will clone the repo,
ask you to fill in the env vars, and give you a live URL.

You still need a Postgres. Free options that work well:

- **Supabase** — free Postgres + built-in pooler. Use the "Connection
  pooling" URL (port 6543, `?pgbouncer=true`) for `DATABASE_URL`, and the
  regular connection string (port 5432) for `DIRECT_URL`.
- **Neon** — same idea; the dashboard gives you both URLs explicitly.

### Automated via GitHub Actions

Two workflows ship in `.github/workflows`:

| Workflow | Triggers | What it does |
| --- | --- | --- |
| `ci.yml` | push / PR to `main` | Spins up ephemeral Postgres, runs migrate + seed + typecheck + lint + build |
| `vercel-preview.yml` | PR to `main` | Builds + deploys a Vercel Preview, comments the URL on the PR |
| `vercel-production.yml` | push to `main` | Builds + deploys to production |

To enable the deploy workflows, add the following in your GitHub repo:

- **Secrets → Actions**:
  - `VERCEL_TOKEN` — create at https://vercel.com/account/tokens
- **Variables → Actions**:
  - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
  - `VERCEL_PROJECT_ID` — same file

The deploy workflows no-op when `VERCEL_PROJECT_ID` isn't set, so you can
merge this PR safely before configuring Vercel.

After linking, configure `DATABASE_URL`, `DIRECT_URL`, `ADMIN_API_TOKEN`
and `CRON_SECRET` in **Vercel → Project Settings → Environment Variables**.
Prisma picks them up at build time via `postinstall` + `prisma migrate
deploy` in the `build` script.

### Cron

`vercel.json` schedules `/api/cron/weekly` for Sunday 19:00 UTC
(≈ Sunday evening Israel time). Vercel automatically injects the
`CRON_SECRET` as a bearer token.

## Project structure

```
prisma/
  schema.prisma         # Postgres — Brand / Model / Trim / SalesSnapshot / Alert / IngestionRun
  migrations/           # Prisma migrations (checked in)
  seed.ts               # Realistic 2026 IL market seed (top 15 brands, ~30 models)

docker-compose.yml      # Local Postgres 16 for development

.github/workflows/
  ci.yml                # typecheck · lint · build on push / PR
  vercel-preview.yml    # preview deploy + PR comment
  vercel-production.yml # production deploy on merge to main

src/
  app/
    page.tsx            # Main dashboard
    simulator/          # Launch Simulator page
    alerts/             # Weekly intelligence
    admin/              # Manual refresh UI
    api/
      admin/refresh     # POST — full pipeline refresh
      admin/scrape/ivia # POST — scrape I-VIA only
      admin/scrape/importers
      cron/weekly       # GET — Vercel cron entry
      trims             # GET — public read API
      alerts            # GET — public read API
  components/
    dashboard/          # bubble chart, kpi cards, period selector, filters, table, drawer, alerts
    simulator/          # simulator client
    admin/              # admin actions
    layout/             # header / footer / language toggle
    ui/                 # shadcn-style primitives
  lib/
    db.ts               # Prisma singleton
    queries.ts          # Hydrated trim rows + KPIs
    filters.ts          # Client-side filter engine
    periods.ts          # Period presets + prior/YoY
    israel-tax.ts       # On-road price calculator
    scraping/
      ivia.ts           # I-VIA PDF scraper (placeholders wired)
      importers.ts      # Importer website adapters
      run.ts            # CLI refresh
```

## Data methodology & caveats

- The seed data is a curated 2026 approximation of the Israeli market;
  ingested I-VIA + importer data overwrites the seed weekly.
- The on-road price calculator uses simplified "green-tax" tiers (~35% BEV,
  ~45% PHEV, ~49% HEV, ~83% ICE) with a ₪20k BEV floor, plus 17% VAT and
  flat ₪4,500 delivery/plates/first-year license. Real ministry tables are
  more granular; we trust the scraped importer price whenever available.
- YoY uses the same absolute date range one year earlier; the prior-period
  comparison uses an equal-length window immediately preceding.

## License

MIT — build great things. If you ship with this, a hat tip is appreciated.
