import {
  TrendingUp,
  TrendingDown,
  Battery,
  Zap,
  Flag,
  Banknote,
  Trophy,
  Gauge,
  ArrowUp,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiBundle } from "@/lib/types";
import { formatIls, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Apple-style KPI tiles. When a prior-period bundle is passed we overlay
 * a green/red delta chip in the corner of the most relevant tiles so
 * Current-vs-Previous comparison becomes self-evident.
 */
export function KpiCards({
  k,
  prior,
}: {
  k: KpiBundle;
  prior?: KpiBundle;
}) {
  // Compute a delta chip vs the prior period for each applicable tile.
  const deltaPct = (cur: number, prev: number) => {
    if (!prev) return null;
    return ((cur - prev) / prev) * 100;
  };
  const deltaAbs = (cur: number, prev: number) => cur - prev;

  const items = [
    {
      label: "Total units",
      sub: k.periodLabel,
      value: formatNumber(k.totalUnits),
      icon: Gauge,
      tint: "bg-blue-50 text-blue-600",
      delta: prior
        ? {
            pct: deltaPct(k.totalUnits, prior.totalUnits),
            label: `vs ${formatNumber(prior.totalUnits)} prior`,
          }
        : undefined,
    },
    {
      label: "YoY growth",
      sub: "vs same window last year",
      value: `${k.yoyGrowthPct >= 0 ? "+" : ""}${k.yoyGrowthPct.toFixed(1)}%`,
      icon: k.yoyGrowthPct >= 0 ? TrendingUp : TrendingDown,
      tint: k.yoyGrowthPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
      tone: k.yoyGrowthPct >= 0 ? "text-emerald-700" : "text-red-700",
    },
    {
      label: "BEV share",
      sub: "of period volume",
      value: `${(k.evShare * 100).toFixed(1)}%`,
      icon: Battery,
      tint: "bg-emerald-50 text-emerald-600",
      delta: prior
        ? {
            ppt: deltaAbs(k.evShare, prior.evShare) * 100,
            label: `vs ${(prior.evShare * 100).toFixed(1)}% prior`,
          }
        : undefined,
    },
    {
      label: "PHEV share",
      sub: "of period volume",
      value: `${(k.phevShare * 100).toFixed(1)}%`,
      icon: Zap,
      tint: "bg-blue-50 text-blue-600",
      delta: prior
        ? {
            ppt: deltaAbs(k.phevShare, prior.phevShare) * 100,
            label: `vs ${(prior.phevShare * 100).toFixed(1)}% prior`,
          }
        : undefined,
    },
    {
      label: "Chinese brand share",
      sub: "of period volume",
      value: `${(k.chineseShare * 100).toFixed(1)}%`,
      icon: Flag,
      tint: "bg-amber-50 text-amber-600",
      delta: prior
        ? {
            ppt: deltaAbs(k.chineseShare, prior.chineseShare) * 100,
            label: `vs ${(prior.chineseShare * 100).toFixed(1)}% prior`,
          }
        : undefined,
    },
    {
      label: "Avg on-road price",
      sub: "volume-weighted",
      value: formatIls(k.avgOnRoadPrice, { compact: true }),
      icon: Banknote,
      tint: "bg-violet-50 text-violet-600",
      delta: prior
        ? {
            pct: deltaPct(k.avgOnRoadPrice, prior.avgOnRoadPrice),
            label: `vs ${formatIls(prior.avgOnRoadPrice, { compact: true })} prior`,
          }
        : undefined,
    },
    {
      label: "Top brand",
      sub: k.topBrand ? `${formatNumber(k.topBrand.units)} units` : "—",
      value: k.topBrand?.name ?? "—",
      icon: Trophy,
      tint: "bg-sky-50 text-sky-600",
    },
    {
      label: "Top model",
      sub: k.topModel ? `${k.topModel.brand} · ${formatNumber(k.topModel.units)} units` : "—",
      value: k.topModel?.name ?? "—",
      icon: Trophy,
      tint: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => {
        const Icon = it.icon;
        const d = (it as any).delta as
          | { pct?: number | null; ppt?: number; label: string }
          | undefined;
        return (
          <Card key={it.label}>
            <CardContent className="relative p-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {it.label}
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full",
                    it.tint,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div
                className={cn(
                  "font-display text-[28px] font-semibold leading-none mt-1 truncate",
                  it.tone,
                )}
              >
                {it.value}
              </div>
              <div className="text-[12px] text-muted-foreground truncate">{it.sub}</div>
              {d && <DeltaChip pct={d.pct ?? null} ppt={d.ppt} label={d.label} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** Small green/red/gray pill that sits at the bottom of a KPI card when
 *  period comparison is active. Handles both percent-change and
 *  percentage-point deltas. */
function DeltaChip({
  pct,
  ppt,
  label,
}: {
  pct: number | null;
  ppt?: number;
  label: string;
}) {
  const v = ppt ?? pct;
  if (v == null || !Number.isFinite(v)) return null;
  const positive = v > 0.1;
  const negative = v < -0.1;
  const Icon = positive ? ArrowUp : negative ? ArrowDown : ArrowRight;
  const tone = positive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : negative
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-secondary text-muted-foreground border-border";
  const formatted = ppt != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)} pp` : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  return (
    <div
      className={cn(
        "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium self-start",
        tone,
      )}
      title={label}
    >
      <Icon className="h-3 w-3" />
      {formatted}
    </div>
  );
}
