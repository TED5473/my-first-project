"use client";

import * as React from "react";
import {
  CartesianGrid,
  ReferenceArea,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { POWERTRAIN_COLORS, POWERTRAINS, type Powertrain } from "@/lib/enums";
import type { ModelRow, TrimRow } from "@/lib/types";
import { formatIls, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buildInsights, type Insight } from "@/lib/insights";
import { MapPin, Sparkles, Shield, Zap, TrendingDown, TrendingUp, Tag } from "lucide-react";

/** Unified shape the chart actually plots. */
interface BubblePoint {
  id: string;
  brand: string;
  model: string;
  trim?: string;
  segment: string;
  bodyStyle: string;
  brandOrigin: string;
  powertrain: Powertrain;
  powertrains?: Powertrain[];
  lengthMm: number;
  priceIls: number;
  periodUnits: number;
  ytdUnits: number;
  eRangeKm?: number | null;
  combinedKm?: number | null;
  batteryKwh?: number | null;
  power?: number | null;
  trimCount?: number;
  recentWeekly?: number[];
  /** Segment-median price for pricing-context insights. */
  segmentMedianPrice?: number;
  /** Chinese-brand share of the visible market, 0-1. */
  chineseShare?: number;
  kind: "trim" | "model";
}

interface BubbleChartProps {
  /** Either trim rows (groupBy=trim) OR model rows (groupBy=model). */
  rows: TrimRow[] | ModelRow[];
  /** Which shape `rows` is in. */
  groupBy: "trim" | "model";
  onSelect?: (brand: string, model: string) => void;
  simulated?: {
    lengthMm: number;
    onRoadPriceIls: number;
    powertrain: Powertrain;
    label: string;
    estUnits: number;
  } | null;
  showLabels?: boolean;
  /** Show subtle shaded "white-space opportunity" zones? Default true. */
  showOpportunityZones?: boolean;
}

const LENGTH_MIN = 4400;
const LENGTH_MAX = 5000;

function toPoint(r: TrimRow | ModelRow, groupBy: "trim" | "model"): BubblePoint {
  if (groupBy === "trim") {
    const t = r as TrimRow;
    return {
      id: t.id,
      brand: t.brand,
      model: t.model,
      trim: t.trim,
      segment: t.segment,
      bodyStyle: t.bodyStyle,
      brandOrigin: t.brandOrigin,
      powertrain: t.powertrain as Powertrain,
      lengthMm: t.lengthMm,
      priceIls: t.onRoadPriceIls,
      periodUnits: t.periodUnits,
      ytdUnits: t.ytdUnits,
      eRangeKm: t.eRangeKm,
      combinedKm: t.combinedKm,
      batteryKwh: t.batteryKwh,
      power: t.power,
      recentWeekly: t.recentWeekly,
      kind: "trim",
    };
  }
  const m = r as ModelRow;
  return {
    id: m.id,
    brand: m.brand,
    model: m.model,
    segment: m.segment,
    bodyStyle: m.bodyStyle,
    brandOrigin: m.brandOrigin,
    powertrain: m.powertrain,
    powertrains: m.powertrains,
    lengthMm: m.lengthMm,
    priceIls: m.basePriceIls,
    periodUnits: m.periodUnits,
    ytdUnits: m.ytdUnits,
    trimCount: m.trimCount,
    recentWeekly: m.recentWeekly,
    kind: "model",
  };
}

export function BubbleChart({
  rows,
  groupBy,
  onSelect,
  simulated,
  showLabels = true,
  showOpportunityZones = true,
}: BubbleChartProps) {
  const [hoverPt, setHoverPt] = React.useState<Powertrain | null>(null);

  const rawPoints = React.useMemo(
    () => rows.map((r) => toPoint(r, groupBy)),
    [rows, groupBy],
  );

  // Compute segment-median prices + Chinese share, then back-fill the
  // points so the tooltip's insight engine has context per bubble.
  const points = React.useMemo(() => {
    const bySeg = new Map<string, number[]>();
    let chineseUnits = 0;
    let totalUnits = 0;
    for (const p of rawPoints) {
      const arr = bySeg.get(p.segment) ?? [];
      arr.push(p.priceIls);
      bySeg.set(p.segment, arr);
      if (p.brandOrigin === "CHINESE") chineseUnits += p.periodUnits;
      totalUnits += p.periodUnits;
    }
    const segMedian = new Map<string, number>();
    for (const [seg, list] of bySeg) {
      const sorted = [...list].sort((a, b) => a - b);
      segMedian.set(seg, sorted[Math.floor(sorted.length / 2)] ?? 0);
    }
    const chineseShare = totalUnits > 0 ? chineseUnits / totalUnits : 0;
    return rawPoints.map<BubblePoint>((p) => ({
      ...p,
      segmentMedianPrice: segMedian.get(p.segment),
      chineseShare,
    }));
  }, [rawPoints]);

  const visible = React.useMemo(
    () => points.filter((p) => p.lengthMm >= LENGTH_MIN && p.lengthMm <= LENGTH_MAX),
    [points],
  );

  const series = React.useMemo(() => {
    const map = new Map<Powertrain, BubblePoint[]>();
    for (const pt of POWERTRAINS) map.set(pt, []);
    for (const p of visible) {
      const bucket = map.get(p.powertrain);
      if (bucket) bucket.push(p);
    }
    return map;
  }, [visible]);

  // In trim mode: label the highest-volume trim per model only.
  // In model mode: label every bubble (there's one per model already).
  const labelSet = React.useMemo(() => {
    if (groupBy === "model") return new Set(visible.map((p) => p.id));
    const byModel = new Map<string, BubblePoint>();
    for (const p of visible) {
      const k = `${p.brand}|${p.model}`;
      const prev = byModel.get(k);
      if (!prev || p.periodUnits > prev.periodUnits) byModel.set(k, p);
    }
    return new Set([...byModel.values()].map((p) => p.id));
  }, [visible, groupBy]);

  const totalsByPt = React.useMemo(() => {
    const out: Record<Powertrain, number> = {
      BEV: 0,
      PHEV: 0,
      HEV: 0,
      MHEV: 0,
      ICE: 0,
    };
    for (const p of visible) out[p.powertrain] += p.periodUnits;
    return out;
  }, [visible]);

  const grandTotal = Object.values(totalsByPt).reduce((s, n) => s + n, 0);
  const maxBubble = Math.max(1, ...visible.map((p) => p.periodUnits));
  const hiddenCount = points.length - visible.length;

  return (
    <div className="w-full h-[420px] sm:h-[500px] lg:h-[600px] relative">
      {hiddenCount > 0 && (
        <div className="absolute top-2 left-2 z-10 text-[11px] text-muted-foreground bg-card/90 border border-border rounded-full px-2.5 py-1 max-w-[60vw] truncate">
          Showing {LENGTH_MIN}–{LENGTH_MAX} mm · {hiddenCount} {groupBy}
          {hiddenCount === 1 ? "" : "s"} outside
        </div>
      )}

      {/* Legend — wraps and shrinks on mobile */}
      <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs max-w-[60vw] justify-end">
        {POWERTRAINS.map((pt) => {
          const active = !hoverPt || hoverPt === pt;
          return (
            <button
              key={pt}
              onMouseEnter={() => setHoverPt(pt)}
              onMouseLeave={() => setHoverPt(null)}
              className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-border bg-card px-2 sm:px-2.5 py-0.5 sm:py-1 hover:border-foreground/20 transition-colors"
              style={{ opacity: active ? 1 : 0.35 }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: POWERTRAIN_COLORS[pt] }}
              />
              <span className="font-medium text-foreground">{pt}</span>
              <span className="text-muted-foreground hidden sm:inline">
                {formatNumber(totalsByPt[pt])} ·{" "}
                {grandTotal > 0
                  ? Math.round((totalsByPt[pt] / grandTotal) * 100)
                  : 0}
                %
              </span>
            </button>
          );
        })}
      </div>

      <ResponsiveContainer>
        <ScatterChart margin={{ top: 40, right: 16, bottom: 44, left: 56 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="0" vertical={false} />
          {/* Faint segment bands */}
          <ReferenceArea x1={4400} x2={4550} fill="rgba(0,0,0,0.015)" />
          <ReferenceArea x1={4700} x2={4850} fill="rgba(0,0,0,0.015)" />
          {/* White-space opportunity zones — subtle green tint + label */}
          {showOpportunityZones && (
            <>
              <ReferenceArea
                x1={4600}
                x2={4700}
                y1={150000}
                y2={195000}
                fill="#10b981"
                fillOpacity={0.07}
                stroke="#10b981"
                strokeOpacity={0.25}
                strokeDasharray="4 4"
                label={{
                  value: "Opportunity · 4.6–4.7 m · under ₪195k",
                  position: "insideTopLeft",
                  fill: "#047857",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceArea
                x1={4400}
                x2={4500}
                y1={150000}
                y2={180000}
                fill="#2563eb"
                fillOpacity={0.06}
                stroke="#2563eb"
                strokeOpacity={0.22}
                strokeDasharray="4 4"
                label={{
                  value: "White-space · 4.4–4.5 m BEV · ₪150–180k",
                  position: "insideTopRight",
                  fill: "#1d4ed8",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            </>
          )}

          <XAxis
            type="number"
            dataKey="lengthMm"
            name="Length"
            unit=" mm"
            domain={[LENGTH_MIN, LENGTH_MAX]}
            allowDataOverflow
            tick={{ fill: "#6e6e73", fontSize: 11 }}
            stroke="rgba(0,0,0,0.15)"
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            label={{
              value: "Vehicle Length (mm)",
              position: "insideBottom",
              offset: -14,
              fill: "#6e6e73",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="priceIls"
            name="Price"
            domain={[60000, "dataMax + 30000"]}
            tickFormatter={(v: number) => `₪${Math.round(v / 1000)}k`}
            tick={{ fill: "#6e6e73", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            label={{
              value:
                groupBy === "model"
                  ? "On-road Base Price — cheapest trim (₪ incl. tax + VAT)"
                  : "On-road Price (₪ incl. tax + VAT)",
              angle: -90,
              position: "insideLeft",
              offset: -20,
              fill: "#6e6e73",
              fontSize: 12,
            }}
            width={76}
          />
          <ZAxis
            type="number"
            dataKey="periodUnits"
            range={[60, 1800]}
            name="Units"
            domain={[0, maxBubble]}
          />

          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.15)" }}
            content={<RichTooltip />}
          />
          <Legend content={() => null} />

          {POWERTRAINS.map((pt) => {
            const data = series.get(pt) ?? [];
            const fade = hoverPt && hoverPt !== pt;
            const color = POWERTRAIN_COLORS[pt];
            return (
              <Scatter
                key={pt}
                name={pt}
                data={data}
                fill={color}
                fillOpacity={fade ? 0.08 : 0.78}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={fade ? 0.15 : 1}
                onClick={(p: any) => {
                  const d = p.payload as BubblePoint;
                  onSelect?.(d.brand, d.model);
                }}
                style={{ cursor: "pointer" }}
                shape={(props: any) => (
                  <FlatBubble
                    {...props}
                    color={color}
                    fade={!!fade}
                    showLabel={showLabels && labelSet.has(props.payload.id)}
                  />
                )}
              >
                {data.map((p) => (
                  <Cell key={p.id} />
                ))}
              </Scatter>
            );
          })}

          {simulated && (
            <Scatter
              name="SIMULATED"
              data={[
                {
                  lengthMm: simulated.lengthMm,
                  priceIls: simulated.onRoadPriceIls,
                  periodUnits: Math.max(simulated.estUnits, 5),
                  brand: "Your Launch",
                  model: simulated.label,
                  isSim: true,
                },
              ]}
              shape={SimulatedStar}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function FlatBubble(props: any) {
  const { cx, cy, payload, color, fade, showLabel } = props;
  if (!cx || !cy) return <g />;
  const r = props.node?.r ?? Math.sqrt((props.size ?? 300) / Math.PI);

  const plotHeight = props.yAxis?.height ?? 500;
  const plotTop = props.yAxis?.y ?? 0;
  const labelBelow = cy - plotTop < plotHeight * 0.35;
  const labelY = labelBelow ? cy + r + 11 : cy - r - 6;

  return (
    <g opacity={fade ? 0.15 : 1}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={1.75}
      />
      {showLabel && payload?.model && (
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          className="pointer-events-none"
          style={{
            fontSize: 11,
            fontWeight: 500,
            fill: "#1d1d1f",
            paintOrder: "stroke",
            stroke: "rgba(255,255,255,0.92)",
            strokeWidth: 3,
            strokeLinejoin: "round",
          }}
        >
          {payload.brand ? `${payload.brand} ${payload.model}` : payload.model}
        </text>
      )}
    </g>
  );
}

function SimulatedStar(props: any) {
  const { cx, cy } = props;
  if (!cx || !cy) return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill="rgba(0,0,0,0.04)" />
      <circle cx={cx} cy={cy} r={11} fill="#ffffff" stroke="#1d1d1f" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={4} fill="#0038B8" />
    </g>
  );
}

function RichTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: BubblePoint & { isSim?: boolean } = payload[0].payload;
  if (d.isSim) {
    return (
      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default">Simulation</Badge>
          <span className="font-semibold">{d.model}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {d.lengthMm} mm · {formatIls(d.priceIls)} · est.{" "}
          {formatNumber(d.periodUnits)} units
        </div>
      </div>
    );
  }
  const pts = d.powertrains && d.powertrains.length > 1 ? d.powertrains : [d.powertrain];

  const insights = buildInsights({
    brand: d.brand,
    model: d.model,
    origin: d.brandOrigin as any,
    powertrain: d.powertrain,
    lengthMm: d.lengthMm,
    priceIls: d.priceIls,
    periodUnits: d.periodUnits,
    trimCount: d.trimCount,
    eRangeKm: d.eRangeKm ?? null,
    combinedKm: d.combinedKm ?? null,
    segmentMedianPrice: d.segmentMedianPrice,
    chineseShare: d.chineseShare,
    powertrains: d.powertrains,
    recentWeekly: d.recentWeekly,
    segment: d.segment,
  });

  const rangeKm =
    d.powertrain === "BEV"
      ? d.eRangeKm ?? d.combinedKm
      : d.combinedKm ?? d.eRangeKm;

  return (
    <div className="rounded-2xl border border-border bg-popover p-4 shadow-xl max-w-sm text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {d.brand} · {d.segment} · {d.bodyStyle}
          </div>
          <div className="font-display text-[15px] font-semibold leading-tight text-foreground">
            {d.model}
          </div>
          {d.kind === "trim" && d.trim && (
            <div className="text-xs text-muted-foreground">{d.trim}</div>
          )}
          {d.kind === "model" && d.trimCount ? (
            <div className="text-xs text-muted-foreground">
              {d.trimCount} trim{d.trimCount === 1 ? "" : "s"} · aggregated
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          {pts.map((p) => (
            <span
              key={p}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: POWERTRAIN_COLORS[p] + "1A",
                color: POWERTRAIN_COLORS[p],
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <Stat
          label={d.kind === "model" ? "Base price" : "On-road"}
          value={formatIls(d.priceIls)}
          emphasize
        />
        <Stat label="Length" value={`${d.lengthMm} mm`} />
        <Stat label="Period units" value={formatNumber(d.periodUnits)} emphasize />
        <Stat label="YTD" value={formatNumber(d.ytdUnits)} />
        {rangeKm ? (
          <Stat
            label={d.powertrain === "BEV" ? "E-range" : "Combined"}
            value={`${formatNumber(rangeKm)} km`}
          />
        ) : null}
        {d.powertrain === "PHEV" && d.eRangeKm ? (
          <Stat label="Electric only" value={`${d.eRangeKm} km`} />
        ) : null}
        {d.batteryKwh ? <Stat label="Battery" value={`${d.batteryKwh} kWh`} /> : null}
        {d.power ? <Stat label="Power" value={`${d.power} kW`} /> : null}
      </div>

      {insights.length > 0 && (
        <div className="mt-3 border-t border-border pt-2 space-y-1.5">
          {insights.map((i, idx) => (
            <InsightRow key={idx} insight={i} />
          ))}
        </div>
      )}

      <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Click for trim matrix
      </div>
    </div>
  );
}

const INSIGHT_ICONS = {
  "trend-up": TrendingUp,
  "trend-down": TrendingDown,
  sparkle: Sparkles,
  map: MapPin,
  shield: Shield,
  zap: Zap,
  price: Tag,
} as const;

function InsightRow({ insight }: { insight: Insight }) {
  const Icon = INSIGHT_ICONS[insight.icon];
  const tone =
    insight.tone === "positive"
      ? "text-emerald-700"
      : insight.tone === "warning"
        ? "text-amber-700"
        : insight.tone === "opportunity"
          ? "text-blue-700"
          : "text-muted-foreground";
  return (
    <div className={`flex gap-1.5 items-start text-[11px] leading-snug ${tone}`}>
      <Icon className="h-3 w-3 mt-0.5 shrink-0" />
      <span>{insight.text}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
      <span className={emphasize ? "font-semibold text-foreground" : "text-foreground/90"}>
        {value}
      </span>
    </div>
  );
}
