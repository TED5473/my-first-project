import { NextRequest } from "next/server";

/** Tiny bearer-token gate, used by admin + cron APIs. */
export function assertAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return; // dev: allow
  if (!token || token !== expected) {
    throw new Response("unauthorized", { status: 401 });
  }
}

export function assertCron(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return;
  const hdr = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  // Vercel Cron sends the same secret in the Authorization header.
  if (hdr !== expected) {
    throw new Response("unauthorized", { status: 401 });
  }
}
