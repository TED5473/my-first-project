import "server-only";
import { prisma } from "./db";
import type { KpiBundle, PeriodRange, TrimRow } from "./types";
import type { Powertrain } from "./enums";
import { yoyPeriod } from "./periods";

/**
 * Hydrate every active trim with its period / YTD sales numbers.
 * Designed for the bubble chart + data table — one query, a few aggregations.
 */
export async function getTrimRows(
  period: PeriodRange,
  comparison?: PeriodRange,
): Promise<TrimRow[]> {
  const now = new Date();
  const year = period.end.getFullYear();
  const yearStart = new Date(year, 0, 1);

  const trims = await prisma.trim.findMany({
    include: {
      model: { include: { brand: true } },
    },
    orderBy: { onRoadPriceIls: "asc" },
  });

  const periodAgg = await prisma.salesSnapshot.groupBy({
    by: ["trimId", "modelId"],
    where: {
      periodStart: { gte: period.start },
      periodEnd: { lte: period.end },
    },
    _sum: { units: true },
  });

  const comparisonAgg = comparison
    ? await prisma.salesSnapshot.groupBy({
        by: ["trimId", "modelId"],
        where: {
          periodStart: { gte: comparison.start },
          periodEnd: { lte: comparison.end },
        },
        _sum: { units: true },
      })
    : [];

  const ytdAgg = await prisma.salesSnapshot.groupBy({
    by: ["trimId", "modelId"],
    where: {
      periodStart: { gte: yearStart },
      periodEnd: { lte: now },
    },
    _sum: { units: true },
  });

  // We split sales by trimId when available, otherwise we proportionally
  // distribute model-level volumes across the trims of that model by their
  // relative list price share. For our seed data every snapshot has trimId.
  const mapBy = (rows: typeof periodAgg) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const key = r.trimId ? `t:${r.trimId}` : `m:${r.modelId}`;
      m.set(key, (m.get(key) ?? 0) + (r._sum.units ?? 0));
    }
    return m;
  };
  const pMap = mapBy(periodAgg);
  const cMap = mapBy(comparisonAgg);
  const yMap = mapBy(ytdAgg);

  return trims.map<TrimRow>((t) => ({
    id: t.id,
    brand: t.model.brand.name,
    brandSlug: t.model.brand.slug,
    brandOrigin: t.model.brand.origin as TrimRow["brandOrigin"],
    model: t.model.name,
    modelSlug: t.model.slug,
    trim: t.name,
    segment: t.model.segment,
    bodyStyle: t.model.bodyStyle,
    powertrain: t.powertrain as TrimRow["powertrain"],
    lengthMm: t.lengthMm,
    onRoadPriceIls: t.onRoadPriceIls,
    priceListIls: t.priceListIls,
    eRangeKm: t.eRangeKm,
    batteryKwh: t.batteryKwh,
    power: t.power,
    periodUnits: pMap.get(`t:${t.id}`) ?? pMap.get(`m:${t.modelId}`) ?? 0,
    comparisonUnits: comparison
      ? cMap.get(`t:${t.id}`) ?? cMap.get(`m:${t.modelId}`) ?? 0
      : undefined,
    ytdUnits: yMap.get(`t:${t.id}`) ?? yMap.get(`m:${t.modelId}`) ?? 0,
    importerUrl: t.importerUrl,
  }));
}

/** Compute headline KPIs for the given period. */
export async function getKpis(
  period: PeriodRange,
  rows: TrimRow[],
): Promise<KpiBundle> {
  const totalUnits = rows.reduce((s, r) => s + r.periodUnits, 0);

  // YoY: sum units in the same range, one year prior.
  const yoy = yoyPeriod(period);
  const yoyAgg = await prisma.salesSnapshot.aggregate({
    _sum: { units: true },
    where: { periodStart: { gte: yoy.start }, periodEnd: { lte: yoy.end } },
  });
  const yoyUnits = yoyAgg._sum.units ?? 0;
  const yoyGrowthPct = yoyUnits > 0 ? ((totalUnits - yoyUnits) / yoyUnits) * 100 : 0;

  const byPt = (pt: Powertrain) =>
    rows.filter((r) => r.powertrain === pt).reduce((s, r) => s + r.periodUnits, 0);
  const evShare = totalUnits ? byPt("BEV") / totalUnits : 0;
  const phevShare = totalUnits ? byPt("PHEV") / totalUnits : 0;
  const chineseUnits = rows
    .filter((r) => r.brandOrigin === "CHINESE")
    .reduce((s, r) => s + r.periodUnits, 0);
  const chineseShare = totalUnits ? chineseUnits / totalUnits : 0;

  // Volume-weighted average price.
  const priceSum = rows.reduce((s, r) => s + r.periodUnits * r.onRoadPriceIls, 0);
  const avgOnRoadPrice = totalUnits ? priceSum / totalUnits : 0;

  // Top brand + top model.
  const brandMap = new Map<string, number>();
  const modelMap = new Map<string, { name: string; brand: string; units: number }>();
  for (const r of rows) {
    brandMap.set(r.brand, (brandMap.get(r.brand) ?? 0) + r.periodUnits);
    const mKey = `${r.brand}|${r.model}`;
    const prev = modelMap.get(mKey);
    modelMap.set(mKey, {
      name: r.model,
      brand: r.brand,
      units: (prev?.units ?? 0) + r.periodUnits,
    });
  }
  const topBrandEntry = [...brandMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const topModel = [...modelMap.values()].sort((a, b) => b.units - a.units)[0] ?? null;

  return {
    totalUnits,
    yoyGrowthPct,
    evShare,
    phevShare,
    chineseShare,
    avgOnRoadPrice,
    topBrand: topBrandEntry ? { name: topBrandEntry[0], units: topBrandEntry[1] } : null,
    topModel: topModel
      ? { name: topModel.name, brand: topModel.brand, units: topModel.units }
      : null,
    periodLabel: period.label,
  };
}

export async function getAlerts(limit = 6) {
  return prisma.alert.findMany({
    where: { title: { not: { startsWith: "__ilcl_" } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestIngestions(limit = 5) {
  return prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
