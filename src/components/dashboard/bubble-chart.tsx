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
  /** Distinct powertrains present; used for the model-level tooltip. */
  powertrains?: Powertrain[];
  lengthMm: number;
  /** For trim view: onRoadPriceIls. For model view: cheapest-trim price. */
  priceIls: number;
  periodUnits: number;
  ytdUnits: number;
  eRangeKm?: number | null;
  batteryKwh?: number | null;
  power?: number | null;
  trimCount?: number;
  /** "trim" or "model", used for tooltip labels. */
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
      batteryKwh: t.batteryKwh,
      power: t.power,
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
    kind: "model",
  };
}

export function BubbleChart({
  rows,
  groupBy,
  onSelect,
  simulated,
  showLabels = true,
}: BubbleChartProps) {
  const [hoverPt, setHoverPt] = React.useState<Powertrain | null>(null);

  const points = React.useMemo(
    () => rows.map((r) => toPoint(r, groupBy)),
    [rows, groupBy],
  );

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
    <div className="w-full h-[580px] relative">
      {hiddenCount > 0 && (
        <div className="absolute top-2 left-2 z-10 text-[11px] text-muted-foreground bg-card/90 border border-border rounded-full px-2.5 py-1">
          Showing length {LENGTH_MIN}–{LENGTH_MAX} mm · {hiddenCount} {groupBy}
          {hiddenCount === 1 ? "" : "s"} outside range
        </div>
      )}

      <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1.5 text-xs">
        {POWERTRAINS.map((pt) => {
          const active = !hoverPt || hoverPt === pt;
          return (
            <button
              key={pt}
              onMouseEnter={() => setHoverPt(pt)}
              onMouseLeave={() => setHoverPt(null)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 hover:border-foreground/20 transition-colors"
              style={{ opacity: active ? 1 : 0.35 }}
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
          <ReferenceArea x1={4400} x2={4550} fill="rgba(0,0,0,0.015)" />
          <ReferenceArea x1={4700} x2={4850} fill="rgba(0,0,0,0.015)" />

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
  const color = POWERTRAIN_COLORS[d.powertrain];
  const pts = d.powertrains && d.powertrains.length > 1 ? d.powertrains : [d.powertrain];

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
        {d.eRangeKm ? <Stat label="E-range" value={`${d.eRangeKm} km`} /> : null}
        {d.batteryKwh ? <Stat label="Battery" value={`${d.batteryKwh} kWh`} /> : null}
        {d.power ? <Stat label="Power" value={`${d.power} kW`} /> : null}
      </div>

      <div
        className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70"
        style={{ borderColor: color }}
      >
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
