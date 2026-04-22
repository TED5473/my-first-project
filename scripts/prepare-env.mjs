/**
 * Build-time env prep. Mirror of src/instrumentation.ts, but runs once per
 * deploy in the Node build step (before prisma generate / migrate / next
 * build). Shares the same "find any Postgres URL under any naming
 * convention" logic so the database works no matter what Vercel named the
 * env vars when the user connected the integration.
 */

import crypto from "node:crypto";

const env = process.env;

const keysEndingWith = (suffix) =>
  Object.keys(env).filter((k) => k.endsWith(suffix));

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

const notes = [];

if (!env.DATABASE_URL && pooledKey) {
  env.DATABASE_URL = env[pooledKey];
  if (pooledKey !== "DATABASE_URL") notes.push(`DATABASE_URL ← ${pooledKey}`);
}

if (!env.DIRECT_URL) {
  if (directKey) {
    env.DIRECT_URL = env[directKey];
    if (directKey !== "DIRECT_URL") notes.push(`DIRECT_URL ← ${directKey}`);
  } else if (env.DATABASE_URL) {
    env.DIRECT_URL = env.DATABASE_URL;
    notes.push("DIRECT_URL ← DATABASE_URL (fallback)");
  }
}

if (!env.ADMIN_API_TOKEN) {
  env.ADMIN_API_TOKEN = "admin-" + crypto.randomBytes(24).toString("hex");
  notes.push("ADMIN_API_TOKEN auto-generated");
}
if (!env.CRON_SECRET) {
  env.CRON_SECRET = "cron-" + crypto.randomBytes(24).toString("hex");
  notes.push("CRON_SECRET auto-generated");
}

if (notes.length) {
  console.log("[ilcl] env prepared:");
  for (const n of notes) console.log("  · " + n);
} else {
  console.log("[ilcl] env prepared (no changes)");
}
