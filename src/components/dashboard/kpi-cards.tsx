import {
  TrendingUp,
  TrendingDown,
  Battery,
  Zap,
  Flag,
  Banknote,
  Trophy,
  Gauge,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiBundle } from "@/lib/types";
import { formatIls, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Apple-style KPI tiles: white surface, soft shadow, subtle tinted icon chip. */
export function KpiCards({ k }: { k: KpiBundle }) {
  const items = [
    {
      label: "Total units",
      sub: k.periodLabel,
      value: formatNumber(k.totalUnits),
      icon: Gauge,
      tint: "bg-blue-50 text-blue-600",
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
    },
    {
      label: "PHEV share",
      sub: "of period volume",
      value: `${(k.phevShare * 100).toFixed(1)}%`,
      icon: Zap,
      tint: "bg-blue-50 text-blue-600",
    },
    {
      label: "Chinese brand share",
      sub: "of period volume",
      value: `${(k.chineseShare * 100).toFixed(1)}%`,
      icon: Flag,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      label: "Avg on-road price",
      sub: "volume-weighted",
      value: formatIls(k.avgOnRoadPrice, { compact: true }),
      icon: Banknote,
      tint: "bg-violet-50 text-violet-600",
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
              <div className={cn("font-display text-[28px] font-semibold leading-none mt-1 truncate", it.tone)}>
                {it.value}
              </div>
              <div className="text-[12px] text-muted-foreground truncate">{it.sub}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
