import type { FiltersState, TrimRow } from "./types";
import type { Powertrain, OriginBucket } from "./enums";

export const DEFAULT_FILTERS: FiltersState = {
  powertrains: [],
  brands: [],
  origins: [],
  segments: [],
  lengthRange: [3500, 5400],
  priceRange: [60_000, 800_000],
  search: "",
};

export function applyFilters(rows: TrimRow[], f: FiltersState): TrimRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.powertrains.length && !f.powertrains.includes(r.powertrain as Powertrain)) return false;
    if (f.brands.length && !f.brands.includes(r.brand)) return false;
    if (f.origins.length && !f.origins.includes(r.brandOrigin as OriginBucket)) return false;
    if (f.segments.length && !f.segments.includes(r.segment)) return false;
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

/** Derive filter option lists from the hydrated rows. */
export function deriveOptions(rows: TrimRow[]) {
  const brands = Array.from(new Set(rows.map((r) => r.brand))).sort();
  const segments = Array.from(new Set(rows.map((r) => r.segment))).sort();
  const powertrains = Array.from(new Set(rows.map((r) => r.powertrain))) as Powertrain[];
  const origins = Array.from(new Set(rows.map((r) => r.brandOrigin))) as OriginBucket[];
  const lengths = rows.map((r) => r.lengthMm);
  const prices = rows.map((r) => r.onRoadPriceIls);
  return {
    brands,
    segments,
    powertrains,
    origins,
    lengthMin: Math.min(...lengths, 3500),
    lengthMax: Math.max(...lengths, 5400),
    priceMin: Math.floor(Math.min(...prices, 60_000) / 10_000) * 10_000,
    priceMax: Math.ceil(Math.max(...prices, 800_000) / 10_000) * 10_000,
  };
}
