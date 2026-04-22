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
import type { TrimRow } from "@/lib/types";
import { formatIls, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BubbleChartProps {
  rows: TrimRow[];
  onSelect?: (row: TrimRow) => void;
  simulated?: {
    lengthMm: number;
    onRoadPriceIls: number;
    powertrain: Powertrain;
    label: string;
    estUnits: number;
  } | null;
  /** Show a text label next to each bubble (model name). Default true. */
  showLabels?: boolean;
}

/**
 * Hero bubble chart — Apple-style light theme.
 *  - X = vehicle length (mm)
 *  - Y = on-road price (₪)
 *  - Z = period sales volume (bubble area)
 *  - Color = powertrain (flat solids, no gradients)
 *  - Labels sit next to every bubble; overlap is reduced by deduplicating
 *    per-model (we label the highest-volume trim only) and nudging labels
 *    above/below the bubble depending on which side has more room.
 */
export function BubbleChart({ rows, onSelect, simulated, showLabels = true }: BubbleChartProps) {
  const [hoverPt, setHoverPt] = React.useState<Powertrain | null>(null);

  // Split rows by powertrain so recharts can color per-series.
  const series = React.useMemo(() => {
    const map = new Map<Powertrain, TrimRow[]>();
    for (const pt of POWERTRAINS) map.set(pt, []);
    for (const r of rows) {
      const bucket = map.get(r.powertrain as Powertrain);
      if (bucket) bucket.push(r);
    }
    return map;
  }, [rows]);

  // Pick one trim per model (highest periodUnits) to label, so the chart
  // doesn't get spammed with duplicate model names.
  const labelSet = React.useMemo(() => {
    const byModel = new Map<string, TrimRow>();
    for (const r of rows) {
      const key = `${r.brand}|${r.model}`;
      const prev = byModel.get(key);
      if (!prev || r.periodUnits > prev.periodUnits) byModel.set(key, r);
    }
    return new Set([...byModel.values()].map((r) => r.id));
  }, [rows]);

  const totalsByPt = React.useMemo(() => {
    const out: Record<Powertrain, number> = {
      BEV: 0,
      PHEV: 0,
      HEV: 0,
      MHEV: 0,
      ICE: 0,
    };
    for (const r of rows) out[r.powertrain as Powertrain] += r.periodUnits;
    return out;
  }, [rows]);

  const grandTotal = Object.values(totalsByPt).reduce((s, n) => s + n, 0);
  const maxBubble = Math.max(1, ...rows.map((r) => r.periodUnits));

  return (
    <div className="w-full h-[580px] relative">
      {/* Soft legend / totals bar */}
      <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1.5 text-xs">
        {POWERTRAINS.map((pt) => {
          const active = !hoverPt || hoverPt === pt;
          return (
            <button
              key={pt}
              onMouseEnter={() => setHoverPt(pt)}
              onMouseLeave={() => setHoverPt(null)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 hover:border-foreground/20 transition-colors"
              style={{
                opacity: active ? 1 : 0.35,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: POWERTRAIN_COLORS[pt] }}
              />
              <span className="font-medium text-foreground">{pt}</span>
              <span className="text-muted-foreground">
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
        <ScatterChart margin={{ top: 32, right: 40, bottom: 52, left: 72 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="0" vertical={false} />

          {/* Segment reference bands (length-based buckets) — very faint */}
          <ReferenceArea x1={3500} x2={4200} fill="rgba(0,0,0,0.015)" />
          <ReferenceArea x1={4550} x2={4800} fill="rgba(0,0,0,0.015)" />

          <XAxis
            type="number"
            dataKey="lengthMm"
            name="Length"
            unit=" mm"
            domain={[3500, 5400]}
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
            dataKey="onRoadPriceIls"
            name="Price"
            domain={[60000, "dataMax + 30000"]}
            tickFormatter={(v: number) => `₪${Math.round(v / 1000)}k`}
            tick={{ fill: "#6e6e73", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            label={{
              value: "On-road Price (₪ incl. tax + VAT)",
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
            range={[80, 2200]}
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
                onClick={(p: any) => onSelect?.(p.payload as TrimRow)}
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
                {data.map((r) => (
                  <Cell key={r.id} />
                ))}
              </Scatter>
            );
          })}

          {simulated && (
            <Scatter
              name="SIMULATED"
              data={[
                {
                  ...simulated,
                  periodUnits: Math.max(simulated.estUnits, 5),
                  brand: "Your Launch",
                  model: simulated.label,
                  trim: "Simulated",
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

/** Flat bubble: solid fill (no gradient) with a thin ring + optional label. */
function FlatBubble(props: any) {
  const { cx, cy, payload, color, fade, showLabel } = props;
  if (!cx || !cy) return <g />;
  // Recharts passes the bubble radius via props.node?.r in some versions;
  // fall back to a scaled sqrt(units) so label offset matches the visual.
  const r = props.node?.r ?? Math.sqrt((props.size ?? 300) / Math.PI);

  // Decide label side: if the bubble is in the top half of the chart, put
  // the label below; otherwise above. Keeps labels inside the plot area.
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
      <circle cx={cx} cy={cy} r={Math.max(1, r * 0.22)} fill={color} />
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
            stroke: "rgba(255,255,255,0.9)",
            strokeWidth: 3,
            strokeLinejoin: "round",
          }}
        >
          {payload.model}
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
  const d: TrimRow & { isSim?: boolean } = payload[0].payload;
  if (d.isSim) {
    return (
      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default">Simulation</Badge>
          <span className="font-semibold">{d.model}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {d.lengthMm} mm · {formatIls(d.onRoadPriceIls)} · est. {formatNumber(d.periodUnits)} units
        </div>
      </div>
    );
  }
  const pt = d.powertrain as Powertrain;
  const color = POWERTRAIN_COLORS[pt];
  const insights = buildInsights(d);

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
          <div className="text-xs text-muted-foreground">{d.trim}</div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: color + "1A", color }}
        >
          {pt}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <Stat label="On-road" value={formatIls(d.onRoadPriceIls)} emphasize />
        <Stat label="Length" value={`${d.lengthMm} mm`} />
        <Stat label="Period units" value={formatNumber(d.periodUnits)} emphasize />
        <Stat label="YTD" value={formatNumber(d.ytdUnits)} />
        {d.eRangeKm ? <Stat label="E-range" value={`${d.eRangeKm} km`} /> : null}
        {d.batteryKwh ? <Stat label="Battery" value={`${d.batteryKwh} kWh`} /> : null}
        {d.power ? <Stat label="Power" value={`${d.power} kW`} /> : null}
      </div>

      {insights.length > 0 && (
        <div className="mt-3 border-t border-border pt-2 space-y-1">
          {insights.map((i, idx) => (
            <div key={idx} className="text-[11px] text-muted-foreground flex gap-1.5">
              <span className="text-primary">›</span>
              <span>{i}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Click for trim matrix
      </div>
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

function buildInsights(d: TrimRow): string[] {
  const out: string[] = [];
  if (d.brandOrigin === "CHINESE" && d.periodUnits > 200) {
    out.push("Chinese brand momentum — strong weekly sell-through.");
  }
  if (d.powertrain === "BEV" && d.eRangeKm && d.eRangeKm < 400) {
    out.push("Range below 400 km — sensitive to winter de-rating in IL.");
  }
  if (d.powertrain === "PHEV" && d.eRangeKm && d.eRangeKm >= 80) {
    out.push("E-range ≥ 80 km — strong corporate-lease eligibility.");
  }
  if (d.onRoadPriceIls < 160_000 && d.bodyStyle === "SUV") {
    out.push("Under ₪160k SUV — core price-war battleground.");
  }
  if (d.powertrain === "ICE" && d.periodUnits < 50) {
    out.push("Low-volume ICE — at EOL risk as green-tax schedule escalates.");
  }
  return out.slice(0, 3);
}
