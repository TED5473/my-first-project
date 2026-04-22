"use client";

import * as React from "react";
import { BubbleChart } from "./bubble-chart";
import { BrandBarChart } from "./brand-bar-chart";
import { KpiCards } from "./kpi-cards";
import { PeriodSelector } from "./period-selector";
import { FiltersPanel } from "./filters-panel";
import { DataTable } from "./data-table";
import { TrimDrawer } from "./trim-drawer";
import { AlertsList } from "./alerts-list";
import { aggregateByModel, applyFilters, deriveOptions, DEFAULT_FILTERS } from "@/lib/filters";
import type { FiltersState, KpiBundle, TrimRow, PeriodPreset } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Presentation } from "lucide-react";

interface DashboardClientProps {
  rows: TrimRow[];
  kpis: KpiBundle;
  comparisonKpis?: KpiBundle;
  alerts: { id: string; severity: string; title: string; body: string; createdAt: Date }[];
  period: PeriodPreset;
  compare: boolean;
  periodLabel: string;
}

/**
 * The composable, fully-interactive dashboard. All filtering happens on the
 * client against the pre-hydrated rows; the period selector triggers a
 * server roundtrip via search params.
 */
export function DashboardClient({
  rows,
  kpis,
  comparisonKpis,
  alerts,
  period,
  compare,
  periodLabel,
}: DashboardClientProps) {
  const [filters, setFilters] = React.useState<FiltersState>(() => {
    const opts = deriveOptions(rows);
    return {
      ...DEFAULT_FILTERS,
      lengthRange: [opts.lengthMin, opts.lengthMax],
      priceRange: [opts.priceMin, opts.priceMax],
    };
  });
  const options = React.useMemo(() => deriveOptions(rows), [rows]);
  const filtered = React.useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const aggregated = React.useMemo(() => aggregateByModel(filtered), [filtered]);

  const [focus, setFocus] = React.useState<TrimRow | null>(null);
  const [open, setOpen] = React.useState(false);

  function onSelect(r: TrimRow) {
    setFocus(r);
    setOpen(true);
  }

  /** Bubble chart invokes this with (brand, model) — we pick any matching
   *  trim to populate the drawer (which shows the full model trim matrix). */
  function onSelectModel(brand: string, model: string) {
    const match = filtered.find((r) => r.brand === brand && r.model === model)
      ?? rows.find((r) => r.brand === brand && r.model === model);
    if (match) {
      setFocus(match);
      setOpen(true);
    }
  }

  async function onRefresh() {
    await fetch("/api/admin/refresh", { method: "POST" });
    window.location.reload();
  }

  // Recompute "live" KPIs using the filtered subset, so the numbers above the
  // chart always reflect what the user sees.
  const liveKpis = React.useMemo<KpiBundle>(() => {
    const total = filtered.reduce((s, r) => s + r.periodUnits, 0);
    const ev = filtered.filter((r) => r.powertrain === "BEV").reduce((s, r) => s + r.periodUnits, 0);
    const ph = filtered.filter((r) => r.powertrain === "PHEV").reduce((s, r) => s + r.periodUnits, 0);
    const cn = filtered.filter((r) => r.brandOrigin === "CHINESE").reduce((s, r) => s + r.periodUnits, 0);
    const priceSum = filtered.reduce((s, r) => s + r.periodUnits * r.onRoadPriceIls, 0);
    const brandMap = new Map<string, number>();
    const modelMap = new Map<string, { name: string; brand: string; units: number }>();
    for (const r of filtered) {
      brandMap.set(r.brand, (brandMap.get(r.brand) ?? 0) + r.periodUnits);
      const mk = `${r.brand}|${r.model}`;
      const prev = modelMap.get(mk);
      modelMap.set(mk, { name: r.model, brand: r.brand, units: (prev?.units ?? 0) + r.periodUnits });
    }
    const topBrand = [...brandMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const topModel = [...modelMap.values()].sort((a, b) => b.units - a.units)[0] ?? null;
    return {
      totalUnits: total,
      yoyGrowthPct: kpis.yoyGrowthPct, // keep global YoY — filters distort per-trim YoY
      evShare: total ? ev / total : 0,
      phevShare: total ? ph / total : 0,
      chineseShare: total ? cn / total : 0,
      avgOnRoadPrice: total ? priceSum / total : 0,
      topBrand: topBrand ? { name: topBrand[0], units: topBrand[1] } : null,
      topModel,
      periodLabel,
    };
  }, [filtered, kpis.yoyGrowthPct, periodLabel]);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <section className="relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-4 gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              Live data · I-VIA Week {isoWeek(new Date())}
            </Badge>
            <h1 className="font-display text-[40px] md:text-[52px] font-semibold tracking-tight leading-[1.05] text-foreground">
              Israel Passenger Car Market,
              <br />
              <span className="text-primary">at a glance.</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl text-[17px]">
              Weekly updated intelligence for product, pricing and sales leaders — powered
              by I-VIA reports and live importer pricing.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodSelector value={period} compare={compare} />
            <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.print()}
            >
              <Presentation className="h-4 w-4" />
              Export deck
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <KpiCards k={liveKpis} />

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FiltersPanel value={filters} onChange={setFilters} options={options} />
        <div className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length} trims · {liveKpis.totalUnits.toLocaleString()} units in view
        </div>
      </div>

      {/* Hero bubble chart */}
      <Card className="overflow-visible">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Market Positioning — Length × On-road Price × Volume</CardTitle>
              <CardDescription>
                Hover for specs & strategic insights · Click a bubble for the trim matrix
              </CardDescription>
            </div>
            {comparisonKpis && (
              <Badge variant="secondary" className="gap-1.5">
                Δ vs prior: {((kpis.totalUnits - comparisonKpis.totalUnits) / Math.max(1, comparisonKpis.totalUnits) * 100).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <BubbleChart
            rows={filters.groupBy === "model" ? aggregated : filtered}
            groupBy={filters.groupBy}
            onSelect={onSelectModel}
          />
        </CardContent>
      </Card>

      {/* Brand sales volume, stacked by model or trim */}
      <Card className="overflow-visible">
        <CardHeader className="pb-0">
          <CardTitle>Sales Volume by Brand</CardTitle>
          <CardDescription>
            Bar height is total period units per brand · Each segment is{" "}
            {filters.groupBy === "model" ? "a model" : "a trim"} colored on the
            brand's hue · Hover for the full breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandBarChart rows={filtered} splitBy={filters.groupBy} />
        </CardContent>
      </Card>

      {/* Table + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            rows={filtered}
            onSelect={onSelect}
            comparison={compare}
            periodLabel={periodLabel}
          />
        </div>
        <div>
          <AlertsList alerts={alerts} />
        </div>
      </div>

      <TrimDrawer rows={rows} focus={focus} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
