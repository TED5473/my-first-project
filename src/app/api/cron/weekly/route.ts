/**
 * Vercel Cron handler — scheduled in vercel.json to run every Sunday 22:00
 * Israel time (Asia/Jerusalem). Vercel cron uses UTC, so "0 19 * * 0" during
 * winter (IST = UTC+2) lands at Sunday 21:00 IL, which is close enough —
 * I-VIA publishes late Sunday night.
 */

import { NextRequest, NextResponse } from "next/server";
import { assertCron } from "@/lib/auth";
import { runIviaRefresh } from "@/lib/scraping/ivia";
import { runImportersRefresh } from "@/lib/scraping/importers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    assertCron(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const ivia = await runIviaRefresh();
  const importers = await runImportersRefresh();
  return NextResponse.json({
    ok: true,
    ran: new Date().toISOString(),
    ivia,
    importers,
  });
}
