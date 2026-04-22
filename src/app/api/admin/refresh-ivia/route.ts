import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { runIviaRefresh } from "@/lib/scraping/ivia";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/refresh-ivia
 *   Kicks off a demo I-VIA refresh (placeholder for the real scraper — see
 *   src/lib/scraping/ivia.ts for the Playwright/pdfplumber hooks). Returns
 *   the count of rows upserted so the Admin UI can surface success state.
 */
export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const result = await runIviaRefresh({ demo: true });
  return NextResponse.json(result);
}
