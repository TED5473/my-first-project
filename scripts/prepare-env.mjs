/**
 * Build-time env prep. Runs once per deploy, before Prisma generate /
 * migrate and Next build. Handles the common "user clicked Deploy, didn't
 * touch env vars" case by:
 *
 *   1. Mirroring Neon's DATABASE_URL_UNPOOLED -> DIRECT_URL when Prisma's
 *      directUrl isn't set. Vercel's Neon integration injects the former.
 *
 *   2. Auto-generating ADMIN_API_TOKEN and CRON_SECRET if missing, so the
 *      admin/cron APIs don't crash at boot. (You should still set real
 *      values in Vercel → Project Settings → Environment Variables.)
 *
 * We write both process.env (for steps in the same shell) and, on Vercel,
 * we just print a notice — Vercel env is immutable at build time so the
 * mirror is applied again at runtime via src/instrumentation.ts.
 */

import crypto from "node:crypto";

const notes = [];

if (!process.env.DIRECT_URL && process.env.DATABASE_URL_UNPOOLED) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
  notes.push("DIRECT_URL ← DATABASE_URL_UNPOOLED (Neon integration)");
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  notes.push("DIRECT_URL ← DATABASE_URL (fallback)");
}

if (!process.env.ADMIN_API_TOKEN) {
  process.env.ADMIN_API_TOKEN = "admin-" + crypto.randomBytes(24).toString("hex");
  notes.push("ADMIN_API_TOKEN auto-generated (set one in Vercel env for security)");
}

if (!process.env.CRON_SECRET) {
  process.env.CRON_SECRET = "cron-" + crypto.randomBytes(24).toString("hex");
  notes.push("CRON_SECRET auto-generated (set one in Vercel env for security)");
}

if (notes.length) {
  console.log("[ilcl] env prepared:");
  for (const n of notes) console.log("  · " + n);
}
