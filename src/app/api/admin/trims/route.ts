import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/trims
 *   Returns every trim with its brand/model context + latest-period unit
 *   volume, flattened for the admin editor table.
 *   Bearer-token gated (admin token OR editor password).
 */
export async function GET(req: NextRequest) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const trims = await prisma.trim.findMany({
    include: { model: { include: { brand: true } } },
    orderBy: [{ model: { brand: { name: "asc" } } }, { model: { name: "asc" } }, { name: "asc" }],
  });

  // Latest weekly volume per trim — simplest proxy for "current volume".
  const sinceDays = 28;
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const agg = await prisma.salesSnapshot.groupBy({
    by: ["trimId"],
    where: { periodStart: { gte: since }, trimId: { not: null } },
    _sum: { units: true },
  });
  const volumeMap = new Map<string, number>();
  for (const r of agg) if (r.trimId) volumeMap.set(r.trimId, r._sum.units ?? 0);

  return NextResponse.json({
    trims: trims.map((t) => ({
      id: t.id,
      brand: t.model.brand.name,
      model: t.model.name,
      trim: t.name,
      segment: t.model.segment,
      bodyStyle: t.model.bodyStyle,
      powertrain: t.powertrain,
      lengthMm: t.lengthMm,
      onRoadPriceIls: t.onRoadPriceIls,
      priceListIls: t.priceListIls,
      eRangeKm: t.eRangeKm,
      combinedKm: t.combinedKm,
      batteryKwh: t.batteryKwh,
      power: t.power,
      sourceSpecs: t.sourceSpecs,
      sourceVolume: t.sourceVolume,
      importerUrl: t.importerUrl,
      updatedAt: t.updatedAt.toISOString(),
      last28Units: volumeMap.get(t.id) ?? 0,
    })),
  });
}
