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
}

/**
 * The hero bubble chart: X=length, Y=on-road price, Z=period volume,
 * colored by powertrain. Presentation-ready with:
 *  - Segment reference bands (subtle vertical bands at length breakpoints)
 *  - Per-powertrain legend with totals
 *  - Rich tooltip (brand, model, trim, specs, strategic tags)
 *  - Click opens the trim drawer via onSelect.
 */
export function BubbleChart({ rows, onSelect, simulated }: BubbleChartProps) {
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
    <div className="w-full h-[560px] relative">
      {/* Soft legend / totals bar (double-duty with Recharts Legend) */}
      <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-2 text-xs">
        {POWERTRAINS.map((pt) => {
          const active = !hoverPt || hoverPt === pt;
          return (
            <button
              key={pt}
              onMouseEnter={() => setHoverPt(pt)}
              onMouseLeave={() => setHoverPt(null)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 glass hover:border-white/20 transition-colors"
              style={{
                opacity: active ? 1 : 0.35,
                borderColor: active ? POWERTRAIN_COLORS[pt] + "66" : undefined,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: POWERTRAIN_COLORS[pt] }}
              />
              <span className="font-medium">{pt}</span>
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
        <ScatterChart margin={{ top: 24, right: 32, bottom: 48, left: 64 }}>
          <defs>
            {POWERTRAINS.map((pt) => (
              <radialGradient key={pt} id={`grad-${pt}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={POWERTRAIN_COLORS[pt]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={POWERTRAIN_COLORS[pt]} stopOpacity={0.35} />
              </radialGradient>
            ))}
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" />

          {/* Segment reference bands (length-based buckets) */}
          <ReferenceArea x1={3500} x2={4200} fill="rgba(255,255,255,0.02)" />
          <ReferenceArea x1={4200} x2={4550} fill="rgba(255,255,255,0.035)" />
          <ReferenceArea x1={4550} x2={4800} fill="rgba(255,255,255,0.02)" />
          <ReferenceArea x1={4800} x2={5400} fill="rgba(255,255,255,0.035)" />

          <XAxis
            type="number"
            dataKey="lengthMm"
            name="Length"
            unit=" mm"
            domain={[3500, 5400]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            stroke="rgba(255,255,255,0.2)"
            label={{
              value: "Vehicle Length (mm)",
              position: "insideBottom",
              offset: -12,
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="onRoadPriceIls"
            name="Price"
            domain={[60000, "dataMax + 30000"]}
            tickFormatter={(v: number) => `₪${Math.round(v / 1000)}k`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            stroke="rgba(255,255,255,0.2)"
            label={{
              value: "On-road Price (₪ incl. tax + VAT)",
              angle: -90,
              position: "insideLeft",
              offset: -24,
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            }}
            width={72}
          />
          <ZAxis
            type="number"
            dataKey="periodUnits"
            range={[80, 2200]}
            name="Units"
            domain={[0, maxBubble]}
          />

          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
            content={<RichTooltip />}
          />

          <Legend content={() => null} />

          {POWERTRAINS.map((pt) => {
            const data = series.get(pt) ?? [];
            const fade = hoverPt && hoverPt !== pt;
            return (
              <Scatter
                key={pt}
                name={pt}
                data={data}
                fill={`url(#grad-${pt})`}
                stroke={POWERTRAIN_COLORS[pt]}
                strokeWidth={1.25}
                opacity={fade ? 0.15 : 0.92}
                onClick={(p: any) => onSelect?.(p.payload as TrimRow)}
                style={{ cursor: "pointer" }}
              >
                {data.map((r) => (
                  <Cell key={r.id} fill={`url(#grad-${pt})`} />
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

function SimulatedStar(props: any) {
  const { cx, cy } = props;
  if (!cx || !cy) return <g />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={24} fill="rgba(255,255,255,0.06)" />
      <circle cx={cx} cy={cy} r={12} fill="#fff" opacity={0.9} />
      <circle cx={cx} cy={cy} r={4} fill="#0038B8" />
    </g>
  );
}

function RichTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: TrimRow & { isSim?: boolean } = payload[0].payload;
  if (d.isSim) {
    return (
      <div className="rounded-lg border bg-popover/95 backdrop-blur-md p-3 shadow-2xl max-w-xs">
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
    <div className="rounded-xl border bg-popover/95 backdrop-blur-md p-4 shadow-2xl max-w-sm text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {d.brand} · {d.segment} · {d.bodyStyle}
          </div>
          <div className="font-display text-base font-semibold leading-tight">
            {d.model}
          </div>
          <div className="text-xs text-muted-foreground">{d.trim}</div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: color + "22", color }}
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
        <div className="mt-3 border-t border-white/10 pt-2 space-y-1">
          {insights.map((i, idx) => (
            <div key={idx} className="text-[11px] text-muted-foreground flex gap-1.5">
              <span className="text-primary">›</span>
              <span>{i}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
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
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className={emphasize ? "font-semibold text-foreground" : "text-foreground/90"}>
        {value}
      </span>
    </div>
  );
}

/** Strategic Israel-specific nudges shown in the tooltip. */
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
