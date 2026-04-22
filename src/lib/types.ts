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
  lengthRange: [number, number];
  priceRange: [number, number];
  search: string;
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
