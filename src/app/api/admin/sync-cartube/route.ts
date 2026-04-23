import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { runIviaRefresh } from "@/lib/scraping/ivia";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/sync-cartube
 *
 * Cartube.co.il is the declared sole data source for IL CarLens. This
 * endpoint is the production hook the "Sync from cartube.co.il" button
 * fires. Today it runs the demo ingestion (see src/lib/scraping/ivia.ts
 * for placeholders) and writes a fresh IngestionRun row. When the real
 * Playwright crawler is ready, point `runIviaRefresh` at cartube.co.il
 * and the front-end needs zero changes.
 */
export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const result = await runIviaRefresh({ demo: true });
  return NextResponse.json({ ...result, source: "cartube.co.il" });
}
