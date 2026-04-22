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

export function KpiCards({ k }: { k: KpiBundle }) {
  const items = [
    {
      label: "Total units",
      sub: k.periodLabel,
      value: formatNumber(k.totalUnits),
      icon: Gauge,
      accent: "from-primary/30 to-primary/0",
    },
    {
      label: "YoY growth",
      sub: "vs same window last year",
      value: `${k.yoyGrowthPct >= 0 ? "+" : ""}${k.yoyGrowthPct.toFixed(1)}%`,
      icon: k.yoyGrowthPct >= 0 ? TrendingUp : TrendingDown,
      accent:
        k.yoyGrowthPct >= 0
          ? "from-emerald-500/30 to-emerald-500/0"
          : "from-red-500/30 to-red-500/0",
      tone: k.yoyGrowthPct >= 0 ? "text-emerald-300" : "text-red-300",
    },
    {
      label: "BEV share",
      sub: "of period volume",
      value: `${(k.evShare * 100).toFixed(1)}%`,
      icon: Battery,
      accent: "from-emerald-400/30 to-emerald-400/0",
    },
    {
      label: "PHEV share",
      sub: "of period volume",
      value: `${(k.phevShare * 100).toFixed(1)}%`,
      icon: Zap,
      accent: "from-sky-400/30 to-sky-400/0",
    },
    {
      label: "Chinese brand share",
      sub: "of period volume",
      value: `${(k.chineseShare * 100).toFixed(1)}%`,
      icon: Flag,
      accent: "from-amber-500/30 to-amber-500/0",
    },
    {
      label: "Avg on-road price",
      sub: "volume-weighted",
      value: formatIls(k.avgOnRoadPrice, { compact: true }),
      icon: Banknote,
      accent: "from-violet-500/30 to-violet-500/0",
    },
    {
      label: "Top brand",
      sub: k.topBrand ? `${formatNumber(k.topBrand.units)} units` : "—",
      value: k.topBrand?.name ?? "—",
      icon: Trophy,
      accent: "from-primary/30 to-primary/0",
    },
    {
      label: "Top model",
      sub: k.topModel ? `${k.topModel.brand} · ${formatNumber(k.topModel.units)} units` : "—",
      value: k.topModel?.name ?? "—",
      icon: Trophy,
      accent: "from-rose-500/30 to-rose-500/0",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="group">
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
                it.accent,
              )}
            />
            <CardContent className="relative p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {it.label}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground/70" />
              </div>
              <div className={cn("font-display text-2xl font-semibold truncate", it.tone)}>
                {it.value}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
