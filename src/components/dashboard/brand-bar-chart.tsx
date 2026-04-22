"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { TrimRow } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface BrandBarChartProps {
  rows: TrimRow[];
  /** Cap how many brands to render (top N by volume). Default 12. */
  topN?: number;
  /** "trim" = stack each trim separately (fine-grained). "model" = stack
   *  per model only (trims collapsed into one segment). */
  splitBy: "trim" | "model";
}

/**
 * Vertical bar chart of period sales volume, one bar per brand, stacked by
 * trim or by model depending on splitBy. Each segment gets a color from
 * the brand's hue scale so segments read as "sub-units of the brand".
 */
export function BrandBarChart({ rows, topN = 12, splitBy }: BrandBarChartProps) {
  const { data, trimKeys, trimColors, trimLabels } = React.useMemo(() => {
    // Step 1: aggregate by brand, keep per-segment buckets (segment = trim
    //   or model depending on splitBy).
    const byBrand = new Map<
      string,
      { total: number; trims: Map<string, { units: number; label: string }> }
    >();
    for (const r of rows) {
      const brand = byBrand.get(r.brand) ?? {
        total: 0,
        trims: new Map(),
      };
      brand.total += r.periodUnits;
      const segKey =
        splitBy === "trim"
          ? `${r.brand}__${r.id}`
          : `${r.brand}__${r.model}`;
      const label =
        splitBy === "trim" ? `${r.model} — ${r.trim}` : r.model;
      const prev = brand.trims.get(segKey);
      brand.trims.set(segKey, {
        units: (prev?.units ?? 0) + r.periodUnits,
        label,
      });
      byBrand.set(r.brand, brand);
    }

    // Step 2: pick top N brands.
    const topBrands = [...byBrand.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, topN);

    // Step 3: collect every trim key we need and assign a color per brand.
    //   Each brand gets a distinct hue; trims within a brand vary in
    //   lightness so stacks read cleanly.
    const brandHue: Record<string, number> = {};
    const hueSteps = [210, 150, 30, 280, 0, 330, 190, 60, 260, 100, 20, 240, 170, 50, 300];
    topBrands.forEach(([brand], i) => {
      brandHue[brand] = hueSteps[i % hueSteps.length];
    });

    const trimKeys: string[] = [];
    const trimColors: Record<string, string> = {};
    const trimLabels: Record<string, string> = {};

    // Build a row per brand. Each row has `brand` + one numeric field per
    // trim-key present in that brand. Missing keys remain 0.
    const data = topBrands.map(([brand, info]) => {
      const row: Record<string, number | string> = { brand, total: info.total };
      const sortedTrims = [...info.trims.entries()].sort((a, b) => b[1].units - a[1].units);
      sortedTrims.forEach(([key, { units, label }], idx) => {
        row[key] = units;
        if (!trimKeys.includes(key)) trimKeys.push(key);
        trimLabels[key] = label;
        const hue = brandHue[brand];
        // lightness between 40 and 72, depending on trim order
        const lightness = 40 + Math.min(idx, 5) * 6;
        trimColors[key] = `hsl(${hue} 72% ${lightness}%)`;
      });
      return row;
    });

    return { data, trimKeys, trimColors, trimLabels };
  }, [rows, topN]);

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 24, right: 24, bottom: 44, left: 56 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis
            dataKey="brand"
            tick={{ fill: "#1d1d1f", fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fill: "#6e6e73", fontSize: 11 }}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            tickLine={false}
            label={{
              value: "Units (period)",
              angle: -90,
              position: "insideLeft",
              offset: -4,
              fill: "#6e6e73",
              fontSize: 12,
            }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={(p: any) => <BarTooltip {...p} trimLabels={trimLabels} />}
          />
          {trimKeys.map((k) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="brand"
              fill={trimColors[k]}
              stroke="#ffffff"
              strokeWidth={1}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={trimColors[k]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarTooltip({ active, payload, label, trimLabels }: any) {
  if (!active || !payload?.length) return null;
  // Payload contains one entry per visible trim segment in this bar. Filter
  // to non-zero and sort by contribution.
  const rows = payload
    .filter((p: any) => (p.value ?? 0) > 0)
    .sort((a: any, b: any) => b.value - a.value);
  const total = rows.reduce((s: number, p: any) => s + p.value, 0);

  return (
    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg max-w-[320px] text-sm">
      <div className="font-semibold text-foreground mb-1">{label}</div>
      <div className="text-xs text-muted-foreground mb-2">
        {formatNumber(total)} units in period
      </div>
      <div className="space-y-1">
        {rows.slice(0, 10).map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ background: p.color }}
            />
            <span className="flex-1 truncate text-foreground">
              {trimLabels[p.dataKey] ?? p.dataKey}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatNumber(p.value)}
            </span>
          </div>
        ))}
        {rows.length > 10 && (
          <div className="text-[11px] text-muted-foreground pt-1">
            + {rows.length - 10} more trims
          </div>
        )}
      </div>
    </div>
  );
}
