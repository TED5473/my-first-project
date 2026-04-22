import { PeriodPreset, PeriodRange } from "./types";

/**
 * Build a PeriodRange from a preset. All math is in Israel time (Asia/Jerusalem
 * is UTC+2/+3). For MVP we use the server's clock — good enough for weekly
 * cadence. In prod wrap with Intl/Temporal + timezone.
 */
export function rangeFromPreset(preset: PeriodPreset, now = new Date()): PeriodRange {
  const end = endOfDay(now);
  let start = new Date(end);

  switch (preset) {
    case "4W":
      start.setDate(start.getDate() - 28);
      return { start: startOfDay(start), end, preset, label: "Last 4 Weeks" };
    case "8W":
      start.setDate(start.getDate() - 56);
      return { start: startOfDay(start), end, preset, label: "Last 8 Weeks" };
    case "12W":
      start.setDate(start.getDate() - 84);
      return { start: startOfDay(start), end, preset, label: "Last 12 Weeks" };
    case "MTD":
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { start, end, preset, label: "Month to Date" };
    case "YTD":
      start = new Date(end.getFullYear(), 0, 1);
      return { start, end, preset, label: `YTD ${end.getFullYear()}` };
    case "ALL":
      start = new Date(2020, 0, 1);
      return { start, end, preset, label: "All-time" };
    case "CUSTOM":
    default:
      start.setDate(start.getDate() - 28);
      return { start: startOfDay(start), end, preset, label: "Custom" };
  }
}

/** For comparison: the same-duration period immediately preceding `r`. */
export function priorPeriod(r: PeriodRange): PeriodRange {
  const ms = r.end.getTime() - r.start.getTime();
  const end = new Date(r.start.getTime() - 1);
  const start = new Date(end.getTime() - ms);
  return { start, end, preset: "CUSTOM", label: `Prior ${r.label}` };
}

/** Same period one year ago, for YoY growth. */
export function yoyPeriod(r: PeriodRange): PeriodRange {
  const start = new Date(r.start);
  const end = new Date(r.end);
  start.setFullYear(start.getFullYear() - 1);
  end.setFullYear(end.getFullYear() - 1);
  return { start, end, preset: "CUSTOM", label: `${r.label} (YoY)` };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "4W", label: "Last 4 Weeks" },
  { value: "8W", label: "Last 8 Weeks" },
  { value: "12W", label: "Last 12 Weeks" },
  { value: "MTD", label: "Month to Date" },
  { value: "YTD", label: "YTD 2026" },
  { value: "ALL", label: "All time" },
  { value: "CUSTOM", label: "Custom…" },
];
