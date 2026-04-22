import type { Powertrain, OriginBucket } from "./enums";

/**
 * Israel-specific strategic insights for the bubble-chart tooltip.
 * The caller feeds in per-bubble data + aggregate context (segment means,
 * powertrain share, Chinese brand share, etc.) and receives up to three
 * short, action-oriented lines phrased for sales/product managers.
 *
 * Keep this file free of React / Recharts so it can be unit-tested and
 * reused by the Launch Simulator opportunity rating.
 */

export interface InsightInput {
  brand: string;
  model: string;
  origin: OriginBucket;
  powertrain: Powertrain;
  lengthMm: number;
  priceIls: number;
  periodUnits: number;
  trimCount?: number;
  eRangeKm?: number | null;
  combinedKm?: number | null;
  /** Segment median/mean price for pricing context. */
  segmentMedianPrice?: number;
  /** Segment median length — used to flag "short/long for segment" calls. */
  segmentMedianLength?: number;
  /** 0-1 share of Chinese brands in the period (for "momentum" language). */
  chineseShare?: number;
  /** Distinct powertrains present across a model's trims. */
  powertrains?: Powertrain[];
  /** Recent weekly units; last 4 vs previous 4 → "gaining / losing momentum". */
  recentWeekly?: number[];
  /** Segment label for phrasing ("C-SUV", etc.) */
  segment?: string;
}

export interface Insight {
  tone: "positive" | "neutral" | "warning" | "opportunity";
  icon: "trend-up" | "trend-down" | "sparkle" | "map" | "shield" | "zap" | "price";
  text: string;
}

export function buildInsights(d: InsightInput): Insight[] {
  const out: Insight[] = [];

  // --- Tel Aviv parking penalty: > 4,800 mm = outside typical street slots.
  if (d.lengthMm > 4800) {
    out.push({
      tone: "warning",
      icon: "map",
      text: "Over 4.80 m — high parking-penalty risk in Tel Aviv, Ramat Gan, Herzliya.",
    });
  }
  if (d.lengthMm > 4900) {
    out.push({
      tone: "warning",
      icon: "map",
      text: "Over 4.90 m — Israel-wide narrow-street & underground-parking friction.",
    });
  }

  // --- Length sweet spots (C-SUV / D-SUV PHEV & HEV)
  if (
    d.lengthMm >= 4480 &&
    d.lengthMm <= 4560 &&
    (d.powertrain === "PHEV" || d.powertrain === "HEV")
  ) {
    out.push({
      tone: "positive",
      icon: "sparkle",
      text: "Sweet spot — 4.50 m PHEV/HEV is where Israeli families buy in volume.",
    });
  }

  // --- E-range thresholds for IL winter + corporate lease
  if (d.powertrain === "BEV" && d.eRangeKm != null) {
    if (d.eRangeKm < 380) {
      out.push({
        tone: "warning",
        icon: "zap",
        text: `E-range ${d.eRangeKm} km — below 380 km triggers winter-derate concerns in IL.`,
      });
    } else if (d.eRangeKm >= 480) {
      out.push({
        tone: "positive",
        icon: "zap",
        text: `E-range ${d.eRangeKm} km — comfortable for Tel Aviv → Eilat without charging anxiety.`,
      });
    }
  }
  if (d.powertrain === "PHEV" && d.eRangeKm != null) {
    if (d.eRangeKm >= 80) {
      out.push({
        tone: "positive",
        icon: "zap",
        text: `E-range ${d.eRangeKm} km ≥ 80 — qualifies for the top IL corporate-lease tier.`,
      });
    } else if (d.eRangeKm < 55) {
      out.push({
        tone: "warning",
        icon: "zap",
        text: `E-range ${d.eRangeKm} km — below the sweet spot; many fleets require ≥ 60 km.`,
      });
    }
  }

  // --- Pricing vs segment median
  if (d.segmentMedianPrice && d.segmentMedianPrice > 0) {
    const gap = (d.priceIls - d.segmentMedianPrice) / d.segmentMedianPrice;
    const segLabel = d.segment ? `${d.segment} median` : "segment median";
    if (gap <= -0.08) {
      out.push({
        tone: "positive",
        icon: "price",
        text: `${(Math.abs(gap) * 100).toFixed(0)}% below ${segLabel} — aggressive price play.`,
      });
    } else if (gap >= 0.12) {
      out.push({
        tone: "warning",
        icon: "price",
        text: `+${(gap * 100).toFixed(0)}% vs ${segLabel} — equipment justification required.`,
      });
    }
  }

  // --- Chinese momentum language
  if (d.origin === "CHINESE" && d.periodUnits > 800) {
    out.push({
      tone: "positive",
      icon: "trend-up",
      text: "Chinese-brand momentum — out-running Korean/Japanese peers at this price point.",
    });
  } else if (d.origin !== "CHINESE" && d.chineseShare != null && d.chineseShare > 0.35) {
    out.push({
      tone: "warning",
      icon: "trend-down",
      text: "Chinese brands hold 35%+ of IL market — expect continued price pressure.",
    });
  }

  // --- Momentum from sparkline
  if (d.recentWeekly && d.recentWeekly.length >= 8) {
    const last4 = d.recentWeekly.slice(-4).reduce((s, n) => s + n, 0);
    const prev4 = d.recentWeekly.slice(-8, -4).reduce((s, n) => s + n, 0);
    if (prev4 > 0) {
      const delta = (last4 - prev4) / prev4;
      if (delta >= 0.2) {
        out.push({
          tone: "positive",
          icon: "trend-up",
          text: `+${Math.round(delta * 100)}% in last 4 weeks — accelerating into the spring push.`,
        });
      } else if (delta <= -0.2) {
        out.push({
          tone: "warning",
          icon: "trend-down",
          text: `${Math.round(delta * 100)}% in last 4 weeks — deceleration, check inventory + pricing.`,
        });
      }
    }
  }

  // --- ICE-at-risk (green-tax schedule escalates each year)
  if (d.powertrain === "ICE" && d.periodUnits < 100) {
    out.push({
      tone: "warning",
      icon: "shield",
      text: "Low-volume ICE — green-tax escalation makes price parity harder each year.",
    });
  }

  // --- Full-range model tag (trimCount + diverse powertrains)
  if (d.trimCount != null && d.trimCount >= 4 && d.powertrains && d.powertrains.length >= 2) {
    out.push({
      tone: "neutral",
      icon: "sparkle",
      text: `${d.trimCount} trims across ${d.powertrains.join(" / ")} — full-range lineup flexibility.`,
    });
  }

  return dedupe(out).slice(0, 3);
}

function dedupe(list: Insight[]): Insight[] {
  const seen = new Set<string>();
  return list.filter((i) => {
    if (seen.has(i.text)) return false;
    seen.add(i.text);
    return true;
  });
}

