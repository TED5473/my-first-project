import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { runIviaRefresh } from "@/lib/scraping/ivia";
import { runImportersRefresh } from "@/lib/scraping/importers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const ivia = await runIviaRefresh({ demo: true });
  const importers = await runImportersRefresh({ demo: true });
  return NextResponse.json({ ok: true, ivia, importers });
}
