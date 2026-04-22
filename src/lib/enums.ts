/**
 * Canonical string unions used across the app. Prisma can't express enums on
 * SQLite, so we store them as strings and validate at the edges.
 */

export const POWERTRAINS = ["BEV", "PHEV", "HEV", "MHEV", "ICE"] as const;
export type Powertrain = (typeof POWERTRAINS)[number];

export const ORIGINS = [
  "CHINESE",
  "KOREAN",
  "JAPANESE",
  "EUROPEAN",
  "AMERICAN",
  "OTHER",
] as const;
export type OriginBucket = (typeof ORIGINS)[number];

export const POWERTRAIN_LABELS: Record<Powertrain, string> = {
  BEV: "BEV (Electric)",
  PHEV: "PHEV",
  HEV: "HEV (Hybrid)",
  MHEV: "Mild Hybrid",
  ICE: "ICE",
};

export const POWERTRAIN_COLORS: Record<Powertrain, string> = {
  BEV: "#34D399",
  PHEV: "#60A5FA",
  HEV: "#F59E0B",
  MHEV: "#A78BFA",
  ICE: "#F87171",
};

export const ORIGIN_LABELS: Record<OriginBucket, string> = {
  CHINESE: "Chinese",
  KOREAN: "Korean",
  JAPANESE: "Japanese",
  EUROPEAN: "European",
  AMERICAN: "American",
  OTHER: "Other",
};

export function isPowertrain(x: unknown): x is Powertrain {
  return typeof x === "string" && (POWERTRAINS as readonly string[]).includes(x);
}
export function isOrigin(x: unknown): x is OriginBucket {
  return typeof x === "string" && (ORIGINS as readonly string[]).includes(x);
}
