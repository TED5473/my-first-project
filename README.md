# IL CarLens

**Israel Passenger Car Market Intelligence Platform**

A production-ready Next.js 15 dashboard that helps automotive product managers
and sales teams make data-driven decisions in the Israeli new-car market.
Weekly refreshed from I-VIA (Israel Vehicle Importers Association) PDFs +
Israeli importer websites, and presented around a hero bubble chart that
positions every model by **length × on-road price × sales volume**, colored
by powertrain.

![bubble chart](public/favicon.svg)

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
- **Prisma** ORM, SQLite dev / PostgreSQL prod (Supabase-ready)
- **Recharts** for the bubble chart
- **Playwright + pdfplumber / LLM parsing** for scraping (placeholders ready)
- **Vercel Cron** for the weekly (Sunday evening, Israel time) refresh

## Quick start

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Use `npm run scrape` to run the demo ingestion pipeline (writes a new
weekly snapshot).

## Environment

Copy `.env.example` → `.env` and fill:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite path in dev, PostgreSQL URL in prod |
| `ADMIN_API_TOKEN` | Bearer token for `/api/admin/*` |
| `CRON_SECRET` | Bearer token validated on `/api/cron/weekly` |
| `IVIA_REPORTS_INDEX_URL` | I-VIA listing URL (prod scraper entrypoint) |

## Production deploy (Vercel)

1. Switch `prisma/schema.prisma` `provider = "postgresql"` and point
   `DATABASE_URL` at Supabase or Neon.
2. `vercel env add ADMIN_API_TOKEN` / `CRON_SECRET`.
3. Push; the `vercel.json` cron runs the pipeline every Sunday 19:00 UTC
   (~21:00 Israel time).

## Project structure

```
prisma/
  schema.prisma         # Brand / Model / Trim / SalesSnapshot / Alert / IngestionRun
  seed.ts               # Realistic 2026 IL market seed (top 15 brands, ~30 models)

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
