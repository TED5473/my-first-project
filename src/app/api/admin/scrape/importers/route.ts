import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { runImportersRefresh } from "@/lib/scraping/importers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const result = await runImportersRefresh({ demo: true });
  return NextResponse.json(result);
}
