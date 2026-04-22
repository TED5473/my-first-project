"use client";

import * as React from "react";
import { BubbleChart } from "@/components/dashboard/bubble-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { POWERTRAINS, POWERTRAIN_COLORS, type Powertrain } from "@/lib/enums";
import { computeOnRoadPrice } from "@/lib/israel-tax";
import { formatIls, formatNumber } from "@/lib/utils";
import type { TrimRow } from "@/lib/types";
import { Rocket } from "lucide-react";

/** Estimate weekly units by picking the 5 nearest neighbors in normalized
 *  length × price space and averaging their periodUnits, with a penalty if
 *  the candidate is outside their powertrain's cluster. */
function estimateUnits(
  rows: TrimRow[],
  lengthMm: number,
  priceIls: number,
  powertrain: Powertrain,
) {
  if (rows.length === 0) return { mid: 0, low: 0, high: 0 };
  const lMin = Math.min(...rows.map((r) => r.lengthMm));
  const lMax = Math.max(...rows.map((r) => r.lengthMm));
  const pMin = Math.min(...rows.map((r) => r.onRoadPriceIls));
  const pMax = Math.max(...rows.map((r) => r.onRoadPriceIls));
  const norm = (r: TrimRow) => {
    const dl = (r.lengthMm - lengthMm) / Math.max(1, lMax - lMin);
    const dp = (r.onRoadPriceIls - priceIls) / Math.max(1, pMax - pMin);
    const ptPenalty = r.powertrain === powertrain ? 0 : 0.25;
    return Math.sqrt(dl * dl + dp * dp) + ptPenalty;
  };
  const sorted = [...rows].sort((a, b) => norm(a) - norm(b));
  const k = Math.min(5, sorted.length);
  const top = sorted.slice(0, k);
  const avg = top.reduce((s, r) => s + r.periodUnits, 0) / k;
  return {
    mid: Math.round(avg),
    low: Math.round(avg * 0.55),
    high: Math.round(avg * 1.35),
  };
}

export function SimulatorClient({ rows }: { rows: TrimRow[] }) {
  const [label, setLabel] = React.useState("New Model X");
  const [powertrain, setPowertrain] = React.useState<Powertrain>("PHEV");
  const [lengthMm, setLengthMm] = React.useState(4600);
  const [importerPrice, setImporterPrice] = React.useState(110_000);

  const breakdown = React.useMemo(
    () => computeOnRoadPrice(importerPrice, powertrain),
    [importerPrice, powertrain],
  );
  const estimate = React.useMemo(
    () => estimateUnits(rows, lengthMm, breakdown.onRoadPriceIls, powertrain),
    [rows, lengthMm, breakdown.onRoadPriceIls, powertrain],
  );

  const simulated = {
    lengthMm,
    onRoadPriceIls: breakdown.onRoadPriceIls,
    powertrain,
    label,
    estUnits: estimate.mid,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> Simulation inputs
          </CardTitle>
          <CardDescription>Sliders & values below feed the bubble chart in real time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Field label="Importer price (pre-tax, ₪)">
            <Input
              type="number"
              value={importerPrice}
              onChange={(e) => setImporterPrice(parseInt(e.target.value || "0", 10))}
              min={40_000}
              max={500_000}
              step={1000}
            />
          </Field>

          <div className="rounded-lg border p-3 bg-secondary/30 space-y-1 text-sm">
            <Row k="Importer price" v={formatIls(breakdown.importerPriceIls)} />
            <Row k="Purchase tax" v={formatIls(breakdown.purchaseTaxIls)} sub />
            <Row k="VAT (17%)" v={formatIls(breakdown.vatIls)} sub />
            <Row k="Plates + delivery" v={formatIls(breakdown.feesIls)} sub />
            <div className="h-px bg-white/10 my-1" />
            <Row k="On-road price" v={formatIls(breakdown.onRoadPriceIls)} strong />
            <Row
              k="Effective tax load"
              v={`${(breakdown.effectiveTaxRate * 100).toFixed(0)}%`}
              sub
            />
          </div>

          <div className="rounded-lg border p-3 bg-gradient-to-br from-primary/10 to-transparent space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Volume band · last 12 weeks
            </div>
            <div className="font-display text-2xl font-semibold">
              {formatNumber(estimate.mid)} units
            </div>
            <div className="text-xs text-muted-foreground">
              Range {formatNumber(estimate.low)} – {formatNumber(estimate.high)} (5-NN)
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Positioning Matrix
            <Badge variant="default">Simulation overlay</Badge>
          </CardTitle>
          <CardDescription>
            The white star shows your hypothetical car. Hover existing bubbles to see the nearest competitors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BubbleChart rows={rows} groupBy="trim" simulated={simulated} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Row({ k, v, sub, strong }: { k: string; v: string; sub?: boolean; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between ${sub ? "text-xs text-muted-foreground" : ""} ${
        strong ? "font-semibold" : ""
      }`}
    >
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
