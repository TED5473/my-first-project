/**
 * Next.js instrumentation — runs once per server cold start, before any
 * route handler. We use it to normalize env vars so the app boots cleanly
 * no matter what naming convention the user's Postgres provider picked.
 *
 * Vercel's Neon integration lets the user set a "Custom Prefix" during
 * connect, so the DB URLs can arrive as any of these:
 *   DATABASE_URL               / DATABASE_URL_UNPOOLED           (no prefix)
 *   STORAGE_DATABASE_URL       / STORAGE_DATABASE_URL_UNPOOLED   (prefix=STORAGE)
 *   POSTGRES_URL               / POSTGRES_URL_NON_POOLING        (legacy Vercel Postgres)
 *   POSTGRES_PRISMA_URL        / POSTGRES_URL_NON_POOLING        (Neon "Prisma" snippet)
 *   <anything>_DATABASE_URL    / <anything>_DATABASE_URL_UNPOOLED (custom prefix)
 *
 * We probe all of them in priority order and alias the first one we find
 * into the canonical names Prisma expects: DATABASE_URL + DIRECT_URL.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (typeof process === "undefined") return;
  resolvePostgresEnv();
  await ensureSecrets();
}

/** Find the best available pooled/direct Postgres URLs and alias them. */
function resolvePostgresEnv() {
  const env = process.env;

  const pooledCandidates = [
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    ...keysEndingWith("_DATABASE_URL").filter((k) => !k.endsWith("_UNPOOLED")),
    ...keysEndingWith("_POSTGRES_URL").filter((k) => !k.endsWith("_NON_POOLING")),
  ];

  const directCandidates = [
    "DIRECT_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    ...keysEndingWith("_DATABASE_URL_UNPOOLED"),
    ...keysEndingWith("_POSTGRES_URL_NON_POOLING"),
  ];

  const pooledKey = pooledCandidates.find((k) => !!env[k]);
  const directKey = directCandidates.find((k) => !!env[k]);

  if (!env.DATABASE_URL && pooledKey) {
    env.DATABASE_URL = env[pooledKey];
    if (pooledKey !== "DATABASE_URL") {
      console.log(`[ilcl] DATABASE_URL ← ${pooledKey}`);
    }
  }

  if (!env.DIRECT_URL) {
    if (directKey) {
      env.DIRECT_URL = env[directKey];
      if (directKey !== "DIRECT_URL") {
        console.log(`[ilcl] DIRECT_URL ← ${directKey}`);
      }
    } else if (env.DATABASE_URL) {
      env.DIRECT_URL = env.DATABASE_URL;
    }
  }
}

function keysEndingWith(suffix: string): string[] {
  return Object.keys(process.env).filter((k) => k.endsWith(suffix));
}

async function ensureSecrets() {
  const { randomBytes } = await import("node:crypto");
  if (!process.env.ADMIN_API_TOKEN) {
    process.env.ADMIN_API_TOKEN = "admin-" + randomBytes(24).toString("hex");
  }
  if (!process.env.CRON_SECRET) {
    process.env.CRON_SECRET = "cron-" + randomBytes(24).toString("hex");
  }
}
