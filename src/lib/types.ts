import type { Powertrain, OriginBucket } from "./enums";

/** A flattened trim record hydrated with brand + model + aggregated period sales. */
export interface TrimRow {
  id: string;
  brand: string;
  brandSlug: string;
  brandOrigin: OriginBucket;
  model: string;
  modelSlug: string;
  trim: string;
  segment: string;
  bodyStyle: string;
  powertrain: Powertrain;
  lengthMm: number;
  onRoadPriceIls: number;
  priceListIls: number;
  eRangeKm: number | null;
  batteryKwh: number | null;
  power: number | null;
  /** Units sold in the selected period (aggregated). */
  periodUnits: number;
  /** Units in the comparison period, if comparing. */
  comparisonUnits?: number;
  /** Year-to-date units across the selected year. */
  ytdUnits: number;
  /** Importer URL (for citations). */
  importerUrl?: string | null;
}

export type PeriodPreset =
  | "4W"
  | "8W"
  | "12W"
  | "MTD"
  | "YTD"
  | "ALL"
  | "CUSTOM";

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  preset: PeriodPreset;
}

export interface FiltersState {
  powertrains: Powertrain[];
  brands: string[];
  origins: OriginBucket[];
  segments: string[];
  /** Selected "Brand · Model" tokens (e.g. "Toyota|RAV4"). Empty = all. */
  models: string[];
  lengthRange: [number, number];
  priceRange: [number, number];
  search: string;
  /** View mode for the charts + table:
   *   - "model": one data point per model, aggregating its trims.
   *   - "trim":  one data point per trim (current behaviour). */
  groupBy: "model" | "trim";
}

/** Aggregated "per-model" row used by charts when groupBy === "model".
 *  Price on Y-axis is the cheapest trim's on-road price; units are the
 *  sum across the model's trims. */
export interface ModelRow {
  id: string; // `${brand}|${model}`
  brand: string;
  brandSlug: string;
  brandOrigin: OriginBucket;
  model: string;
  modelSlug: string;
  segment: string;
  bodyStyle: string;
  /** Powertrain of the cheapest trim — used for bubble color. */
  powertrain: Powertrain;
  /** Cheapest trim's length (reasonable proxy; usually all trims of a model share length). */
  lengthMm: number;
  /** Cheapest trim's on-road price — the "base price" anchor. */
  basePriceIls: number;
  /** Sum of period units across all trims of this model. */
  periodUnits: number;
  comparisonUnits?: number;
  ytdUnits: number;
  /** Number of trims in this model (post-filter). */
  trimCount: number;
  /** Distinct powertrains present in this model, for the tooltip. */
  powertrains: Powertrain[];
}

export interface KpiBundle {
  totalUnits: number;
  yoyGrowthPct: number;
  evShare: number;
  phevShare: number;
  chineseShare: number;
  avgOnRoadPrice: number;
  topBrand: { name: string; units: number } | null;
  topModel: { name: string; brand: string; units: number } | null;
  periodLabel: string;
}
