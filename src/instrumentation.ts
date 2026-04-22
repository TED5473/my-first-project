/**
 * Next.js instrumentation — runs once per server cold start, before any
 * route handler. We use it to normalize env vars so the app boots cleanly
 * regardless of which Postgres provider injected which variable name.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (typeof process === "undefined") return;

  // Vercel's Neon integration exposes DATABASE_URL_UNPOOLED; Prisma wants
  // DIRECT_URL for migrations and for prepared-statement-safe pooling.
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL_UNPOOLED) {
    process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
    console.log("[ilcl] DIRECT_URL ← DATABASE_URL_UNPOOLED");
  }

  // Fallback: if only DATABASE_URL is set, use it for migrations too.
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  // Don't crash admin/cron routes if the user never set these — generate
  // ephemeral tokens so the app is still secure against unauthenticated
  // callers. You should set real values in Vercel's env for production.
  if (!process.env.ADMIN_API_TOKEN) {
    const { randomBytes } = await import("node:crypto");
    process.env.ADMIN_API_TOKEN = "admin-" + randomBytes(24).toString("hex");
  }
  if (!process.env.CRON_SECRET) {
    const { randomBytes } = await import("node:crypto");
    process.env.CRON_SECRET = "cron-" + randomBytes(24).toString("hex");
  }
}
