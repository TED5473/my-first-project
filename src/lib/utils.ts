import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Small helper to merge Tailwind class names, shadcn-style. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer shekels → "₪123,456". */
export function formatIls(amount: number, opts: { compact?: boolean } = {}) {
  if (!Number.isFinite(amount)) return "—";
  if (opts.compact) {
    return new Intl.NumberFormat("en-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(amount);
  }
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number, opts: Intl.NumberFormatOptions = {}) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IL", { maximumFractionDigits: 0, ...opts }).format(n);
}

export function formatPct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

/** Slugify a string for stable ids. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Week number (ISO) */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // ISO week starts Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date): Date {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
