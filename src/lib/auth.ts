import { NextRequest } from "next/server";

/**
 * The password that unlocks /admin/data. Defaults to the hard-coded
 * sentinel from the product spec ('admin123') when no env var is set.
 * In production, set ADMIN_EDITOR_PASSWORD to something real.
 */
export const ADMIN_EDITOR_PASSWORD =
  process.env.ADMIN_EDITOR_PASSWORD || "admin123";

/** Tiny bearer-token gate, used by admin + cron APIs.
 *  Accepts EITHER the ADMIN_API_TOKEN (preferred) OR the ADMIN_EDITOR_PASSWORD
 *  so the /admin/data editor can call its own write endpoints with just the
 *  password the user typed. */
export function assertAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiToken = process.env.ADMIN_API_TOKEN;
  const editorPw = ADMIN_EDITOR_PASSWORD;
  // Dev mode with neither set → allow.
  if (!apiToken && !editorPw) return;
  if (token && (token === apiToken || token === editorPw)) return;
  throw new Response("unauthorized", { status: 401 });
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
