"use client";

import * as React from "react";
import { Rocket, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POWERTRAINS, POWERTRAIN_COLORS, type Powertrain } from "@/lib/enums";
import { computeOnRoadPrice } from "@/lib/israel-tax";
import { buildInsights } from "@/lib/insights";
import { formatIls, formatNumber } from "@/lib/utils";
import type { TrimRow } from "@/lib/types";
import { BubbleChart } from "./bubble-chart";
import { cn } from "@/lib/utils";

interface LaunchPanelProps {
  rows: TrimRow[];
  chineseShare: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * On-dashboard Launch Simulator. Lives in a full-screen Dialog so it can
 * overlay the bubble chart without crowding the main layout. Given
 * hypothetical model specs, it:
 *   1. Computes the Israeli on-road price (purchase tax + 17% VAT).
 *   2. Estimates a weekly volume band by 5-nearest-neighbour search in
 *      normalized length × price × powertrain space.
 *   3. Produces a 0-100 "opportunity rating" derived from nearest-
 *      neighbour density (more empty = higher opportunity) and the
 *      insights engine.
 *   4. Overlays a white star on a live copy of the bubble chart so the
 *      user can see exactly where the new bubble lands.
 */
export function LaunchPanel({ rows, chineseShare, open, onOpenChange }: LaunchPanelProps) {
  const [label, setLabel] = React.useState("New Model X");
  const [powertrain, setPowertrain] = React.useState<Powertrain>("PHEV");
  const [lengthMm, setLengthMm] = React.useState(4650);
  const [importerPrice, setImporterPrice] = React.useState(110_000);
  const [eRange, setERange] = React.useState(90);

  const breakdown = React.useMemo(
    () => computeOnRoadPrice(importerPrice, powertrain),
    [importerPrice, powertrain],
  );

  const { estLow, estMid, estHigh, opportunity, nearest } = React.useMemo(
    () => estimate(rows, lengthMm, breakdown.onRoadPriceIls, powertrain),
    [rows, lengthMm, breakdown.onRoadPriceIls, powertrain],
  );

  const insights = React.useMemo(
    () =>
      buildInsights({
        brand: "Your Launch",
        model: label,
        origin: "CHINESE",
        powertrain,
        lengthMm,
        priceIls: breakdown.onRoadPriceIls,
        periodUnits: estMid,
        eRangeKm: eRange,
        chineseShare,
        segment: inferSegment(lengthMm, powertrain),
      }),
    [label, powertrain, lengthMm, breakdown.onRoadPriceIls, estMid, eRange, chineseShare],
  );

  const simulated = {
    lengthMm,
    onRoadPriceIls: breakdown.onRoadPriceIls,
    powertrain,
    label,
    estUnits: estMid,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[calc(100vw-32px)] p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Rocket className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <DialogTitle>Launch Simulator</DialogTitle>
              <DialogDescription>
                Position a hypothetical model against the live Israel market
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 max-h-[80vh]">
          {/* Left: input form + readout */}
          <div className="p-5 border-r border-border overflow-y-auto space-y-4">
            <Field label="Label">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </Field>

            <Field label="Powertrain">
              <Select value={powertrain} onValueChange={(v) => setPowertrain(v as Powertrain)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POWERTRAINS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: POWERTRAIN_COLORS[p] }}
                        />
                        {p}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Length (mm)">
                <Input
                  type="number"
                  value={lengthMm}
                  onChange={(e) => setLengthMm(parseInt(e.target.value || "0", 10))}
                  min={3500}
                  max={5400}
                  step={10}
                />
              </Field>
              <Field label="Importer ₪">
                <Input
                  type="number"
                  value={importerPrice}
                  onChange={(e) => setImporterPrice(parseInt(e.target.value || "0", 10))}
                  min={40_000}
                  max={500_000}
                  step={1000}
                />
              </Field>
            </div>

            {(powertrain === "BEV" || powertrain === "PHEV") && (
              <Field label={powertrain === "BEV" ? "E-range (km)" : "Electric e-range (km)"}>
                <Input
                  type="number"
                  value={eRange}
                  onChange={(e) => setERange(parseInt(e.target.value || "0", 10))}
                  min={20}
                  max={700}
                  step={10}
                />
              </Field>
            )}

            <div className="rounded-xl border border-border bg-secondary/60 p-3 space-y-1 text-sm">
              <Row k="Importer" v={formatIls(breakdown.importerPriceIls)} />
              <Row k="Purchase tax" v={formatIls(breakdown.purchaseTaxIls)} sub />
              <Row k="VAT (17%)" v={formatIls(breakdown.vatIls)} sub />
              <Row k="Plates + delivery" v={formatIls(breakdown.feesIls)} sub />
              <div className="h-px bg-border my-1" />
              <Row k="On-road price" v={formatIls(breakdown.onRoadPriceIls)} strong />
              <Row
                k="Effective tax load"
                v={`${(breakdown.effectiveTaxRate * 100).toFixed(0)}%`}
                sub
              />
            </div>

            <div className="rounded-xl border border-border p-3 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Est. weekly volume band
              </div>
              <div className="font-display text-2xl font-semibold">
                {formatNumber(estMid)} units
              </div>
              <div className="text-xs text-muted-foreground">
                Range {formatNumber(estLow)} – {formatNumber(estHigh)} (5-NN)
              </div>
            </div>

            <OpportunityMeter score={opportunity} />

            {insights.length > 0 && (
              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-3 w-3" /> Strategic insights
                </div>
                {insights.map((i, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "text-[12px] leading-snug",
                      i.tone === "positive"
                        ? "text-emerald-700"
                        : i.tone === "warning"
                          ? "text-amber-700"
                          : "text-muted-foreground",
                    )}
                  >
                    › {i.text}
                  </div>
                ))}
              </div>
            )}

            {nearest.length > 0 && (
              <div className="rounded-xl border border-border p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Nearest competitors
                </div>
                <ul className="text-[12px] space-y-1">
                  {nearest.slice(0, 5).map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        <span className="text-muted-foreground">{n.brand}</span>{" "}
                        <span className="font-medium text-foreground">{n.model}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(n.periodUnits)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: live chart with overlay */}
          <div className="p-3 overflow-y-auto">
            <BubbleChart
              rows={rows}
              groupBy="trim"
              simulated={simulated}
              showOpportunityZones
              showLabels={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function Row({
  k,
  v,
  sub,
  strong,
}: {
  k: string;
  v: string;
  sub?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        sub && "text-xs text-muted-foreground",
        strong && "font-semibold",
      )}
    >
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

function OpportunityMeter({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-emerald-500"
      : score >= 45
        ? "bg-amber-500"
        : "bg-red-500";
  const label =
    score >= 70
      ? "Strong white-space opportunity"
      : score >= 45
        ? "Mixed — crowded segment"
        : "Crowded — differentiation required";
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        <span>Opportunity rating</span>
        <span className="text-foreground font-semibold text-sm">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{label}</div>
    </div>
  );
}

/**
 * 5-nearest-neighbour volume estimate + opportunity score in the unit
 * [length × price × powertrain] space. Distances normalize by dataset
 * extent; powertrain mismatch is penalised.
 */
function estimate(
  rows: TrimRow[],
  lengthMm: number,
  priceIls: number,
  powertrain: Powertrain,
) {
  if (rows.length === 0) {
    return {
      estLow: 0,
      estMid: 0,
      estHigh: 0,
      opportunity: 50,
      nearest: [] as TrimRow[],
    };
  }
  const lMin = Math.min(...rows.map((r) => r.lengthMm));
  const lMax = Math.max(...rows.map((r) => r.lengthMm));
  const pMin = Math.min(...rows.map((r) => r.onRoadPriceIls));
  const pMax = Math.max(...rows.map((r) => r.onRoadPriceIls));

  const dist = (r: TrimRow) => {
    const dl = (r.lengthMm - lengthMm) / Math.max(1, lMax - lMin);
    const dp = (r.onRoadPriceIls - priceIls) / Math.max(1, pMax - pMin);
    const ptPenalty = r.powertrain === powertrain ? 0 : 0.25;
    return Math.sqrt(dl * dl + dp * dp) + ptPenalty;
  };

  const sorted = [...rows].sort((a, b) => dist(a) - dist(b));
  const k = Math.min(5, sorted.length);
  const top = sorted.slice(0, k);
  const avg = top.reduce((s, r) => s + r.periodUnits, 0) / k;

  // Opportunity = 100 × mean-nearest-distance, clamped. Empty neighbourhoods
  // → high score. Dense clusters → low score. Also bump up when the
  // neighbour-powertrain mix is dominated by a different powertrain.
  const meanDist = top.reduce((s, r) => s + dist(r), 0) / k;
  const diffPt = top.filter((r) => r.powertrain !== powertrain).length / k;
  const base = Math.round(Math.min(1, meanDist * 2.5) * 100);
  const bonus = Math.round(diffPt * 20);
  const opportunity = Math.max(5, Math.min(98, base + bonus));

  return {
    estLow: Math.round(avg * 0.55),
    estMid: Math.round(avg),
    estHigh: Math.round(avg * 1.35),
    opportunity,
    nearest: top,
  };
}

function inferSegment(lengthMm: number, pt: Powertrain): string {
  const suffix = /BEV|PHEV|HEV|MHEV/.test(pt) ? "-SUV" : "";
  if (lengthMm < 4200) return `B${suffix || ""}`;
  if (lengthMm < 4500) return `C${suffix || "-SUV"}`;
  if (lengthMm < 4750) return `C-SUV`;
  return `D-SUV`;
}
