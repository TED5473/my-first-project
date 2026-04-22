import type { FiltersState, ModelRow, TrimRow } from "./types";
import type { Powertrain, OriginBucket } from "./enums";

export const DEFAULT_FILTERS: FiltersState = {
  powertrains: [],
  brands: [],
  origins: [],
  segments: [],
  models: [],
  lengthRange: [3500, 5400],
  priceRange: [60_000, 800_000],
  search: "",
  groupBy: "trim",
};

export function modelKey(brand: string, model: string): string {
  return `${brand}|${model}`;
}

export function applyFilters(rows: TrimRow[], f: FiltersState): TrimRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.powertrains.length && !f.powertrains.includes(r.powertrain as Powertrain)) return false;
    if (f.brands.length && !f.brands.includes(r.brand)) return false;
    if (f.origins.length && !f.origins.includes(r.brandOrigin as OriginBucket)) return false;
    if (f.segments.length && !f.segments.includes(r.segment)) return false;
    if (f.models.length && !f.models.includes(modelKey(r.brand, r.model))) return false;
    if (r.lengthMm < f.lengthRange[0] || r.lengthMm > f.lengthRange[1]) return false;
    if (r.onRoadPriceIls < f.priceRange[0] || r.onRoadPriceIls > f.priceRange[1])
      return false;
    if (q) {
      const hay = `${r.brand} ${r.model} ${r.trim} ${r.segment}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Aggregate filtered trim rows into per-model rows. "Base price" is the
 *  cheapest trim's on-road price, per the user's request. */
export function aggregateByModel(rows: TrimRow[]): ModelRow[] {
  const buckets = new Map<string, TrimRow[]>();
  for (const r of rows) {
    const k = modelKey(r.brand, r.model);
    const bucket = buckets.get(k);
    if (bucket) bucket.push(r);
    else buckets.set(k, [r]);
  }

  const out: ModelRow[] = [];
  for (const [key, bucket] of buckets) {
    // Cheapest trim wins for the price anchor + default powertrain / length.
    const cheapest = bucket.reduce((a, b) =>
      a.onRoadPriceIls <= b.onRoadPriceIls ? a : b,
    );
    const periodUnits = bucket.reduce((s, r) => s + r.periodUnits, 0);
    const comparisonUnits = bucket[0].comparisonUnits !== undefined
      ? bucket.reduce((s, r) => s + (r.comparisonUnits ?? 0), 0)
      : undefined;
    const ytdUnits = bucket.reduce((s, r) => s + r.ytdUnits, 0);
    const powertrains = Array.from(new Set(bucket.map((r) => r.powertrain))) as Powertrain[];
    // Sum the weekly sparkline arrays element-wise.
    const sparkLen = Math.max(0, ...bucket.map((r) => r.recentWeekly?.length ?? 0));
    const recentWeekly: number[] = Array.from({ length: sparkLen }, (_, i) =>
      bucket.reduce((s, r) => s + (r.recentWeekly?.[i] ?? 0), 0),
    );
    out.push({
      id: key,
      brand: cheapest.brand,
      brandSlug: cheapest.brandSlug,
      brandOrigin: cheapest.brandOrigin,
      model: cheapest.model,
      modelSlug: cheapest.modelSlug,
      segment: cheapest.segment,
      bodyStyle: cheapest.bodyStyle,
      powertrain: cheapest.powertrain as Powertrain,
      lengthMm: cheapest.lengthMm,
      basePriceIls: cheapest.onRoadPriceIls,
      periodUnits,
      comparisonUnits,
      ytdUnits,
      trimCount: bucket.length,
      powertrains,
      recentWeekly,
    });
  }
  return out;
}

/** Derive filter option lists from the hydrated rows. */
export function deriveOptions(rows: TrimRow[]) {
  const brands = Array.from(new Set(rows.map((r) => r.brand))).sort();
  const segments = Array.from(new Set(rows.map((r) => r.segment))).sort();
  const powertrains = Array.from(new Set(rows.map((r) => r.powertrain))) as Powertrain[];
  const origins = Array.from(new Set(rows.map((r) => r.brandOrigin))) as OriginBucket[];
  // Unique brand|model pairs, with a nice display label.
  const modelMap = new Map<string, { key: string; brand: string; model: string }>();
  for (const r of rows) {
    const key = modelKey(r.brand, r.model);
    if (!modelMap.has(key)) modelMap.set(key, { key, brand: r.brand, model: r.model });
  }
  const models = [...modelMap.values()].sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
  );
  const lengths = rows.map((r) => r.lengthMm);
  const prices = rows.map((r) => r.onRoadPriceIls);
  return {
    brands,
    segments,
    powertrains,
    origins,
    models,
    lengthMin: Math.min(...lengths, 3500),
    lengthMax: Math.max(...lengths, 5400),
    priceMin: Math.floor(Math.min(...prices, 60_000) / 10_000) * 10_000,
    priceMax: Math.ceil(Math.max(...prices, 800_000) / 10_000) * 10_000,
  };
}
