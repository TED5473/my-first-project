# Agent Internet Sci-Fi Dashboard

Every day the Agent Internet dreams up tomorrow. We turn it into your next novel.

This project is a **Next.js 15 App Router** dashboard that reads Moltbook, distills the most mind-bending daily ideas, and transforms them into cinematic sci-fi sparks: titles, premises, blurbs, world-building seeds, and reusable plot hooks.

## Stack

- Next.js 15 (App Router, Server Actions, React Server Components)
- TypeScript (strict mode)
- Tailwind CSS + shadcn-style component architecture
- tailwind-merge + clsx
- Lucide React icons
- next-themes (dark cyberpunk default)
- Zod validation
- date-fns
- Vercel-ready (with `vercel.json` cron example)

## Features

- `/` Home dashboard
  - Hero tagline + cyberpunk interface
  - "Today’s Sci-Fi Sparks" (8–12 spark cards)
  - Generate button that calls a Server Action
  - Last-updated timestamp + 24h refresh hint
  - Save spark to notebook
- `/archive`
  - Daily digest history via localStorage
  - Date picker + direct day selection
- `/settings`
  - Moltbook API key input
  - API key saved in localStorage and encrypted cookie via Server Action
  - Submolt watchlist chooser
  - LLM provider selector (OpenAI / xAI / Anthropic)
  - Cron setup note
- `/notebook`
  - Saved sparks list (MVP localStorage)
  - Export as Markdown or JSON
- Custom loading page + custom 404 + Open Graph image route

## 1) Get a Moltbook API key in ~60 seconds

1. Go to [https://www.moltbook.com](https://www.moltbook.com)
2. Register an observer/agent account (or sign in)
3. Generate/copy your Bearer token (`moltbook_xxx`)
4. Open `/settings` in this app and paste the key
5. Click **Save encrypted cookie**

> Security reminder: send this key only to `https://www.moltbook.com` endpoints.

## 2) Add your LLM API key

Copy `.env.example` to `.env.local` and configure at least one provider:

```bash
cp .env.example .env.local
```

Set:

- `COOKIE_ENCRYPTION_SECRET` (required for encrypted cookie storage)
- `OPENAI_API_KEY` and/or `XAI_API_KEY` and/or `ANTHROPIC_API_KEY`

Optional model overrides:

- `OPENAI_MODEL`
- `XAI_MODEL`
- `ANTHROPIC_MODEL`

## 3) Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## 4) How generation works

On **Generate Today’s Sparks**:

1. Loads encrypted Moltbook API token from cookie
2. Fetches posts from selected submolts using:
   - `GET /api/v1/posts?sort=hot&limit=...`
   - `GET /api/v1/posts?sort=new&limit=...`
3. Fetches comments for candidate posts:
   - `GET /api/v1/posts/:id/comments?sort=best&limit=...`
4. Sends raw post/comment data to the selected LLM with the exact hardcoded system prompt
5. Validates and normalizes spark output via Zod
6. Returns daily digest to client and stores digest locally for archive/notebook workflows

## 5) Deploy to Vercel

1. Push this repo to GitHub
2. Import project into Vercel
3. Add environment variables from `.env.example`
4. Deploy

`vercel.json` is included with a daily cron example.

## 6) Optional daily cron setup

This repo includes:

- `vercel.json` with:
  - `"path": "/api/cron/daily"`
  - `"schedule": "0 10 * * *"`
- API route at `/api/cron/daily`

For production automation, wire this endpoint to persistent storage/queue logic (e.g. save daily digests in a DB).

## Notes

- Archive and notebook persistence are localStorage-based (MVP).
- If an LLM call fails, the app gracefully generates fallback sparks from Moltbook source material.
- All Moltbook calls use `https://www.moltbook.com/api/v1`.
