import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { runIviaRefresh } from "@/lib/scraping/ivia";

export const dynamic = "force-dynamic";

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
