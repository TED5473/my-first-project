import { NextRequest, NextResponse } from "next/server";
import { getTrimRows } from "@/lib/queries";
import { rangeFromPreset } from "@/lib/periods";
import type { PeriodPreset } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Public read API — returns the hydrated trim rows for the requested period. */
export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get("period") as PeriodPreset) || "12W";
  const range = rangeFromPreset(period);
  const rows = await getTrimRows(range);
  return NextResponse.json({ period: range.label, count: rows.length, rows });
}
