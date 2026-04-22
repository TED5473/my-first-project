"use client";

import * as React from "react";
import { ArrowUpDown, ArrowDown, ArrowUp, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrimRow } from "@/lib/types";
import { cn, formatIls, formatNumber, formatPct } from "@/lib/utils";
import { POWERTRAIN_COLORS, type Powertrain } from "@/lib/enums";
import { exportCsv, exportXlsx, exportPdf } from "@/lib/export";

type SortKey =
  | "brand"
  | "model"
  | "trim"
  | "segment"
  | "powertrain"
  | "lengthMm"
  | "onRoadPriceIls"
  | "periodUnits"
  | "ytdUnits";

interface Props {
  rows: TrimRow[];
  onSelect?: (r: TrimRow) => void;
  comparison: boolean;
  periodLabel: string;
}

export function DataTable({ rows, onSelect, comparison, periodLabel }: Props) {
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "periodUnits",
    dir: "desc",
  });

  const sorted = React.useMemo(() => {
    const cp = [...rows];
    cp.sort((a, b) => {
      const av = a[sort.key] as any;
      const bv = b[sort.key] as any;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return cp;
  }, [rows, sort]);

  function toggleSort(k: SortKey) {
    setSort((s) =>
      s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" },
    );
  }

  return (
    <div className="rounded-xl border bg-card/60">
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div>
          <div className="font-display font-semibold">Models & trims</div>
          <div className="text-xs text-muted-foreground">
            {formatNumber(rows.length)} trims · {periodLabel}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCsv(rows)}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportXlsx(rows)}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPdf()}>
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/30">
            <tr>
              <Th k="brand" label="Brand" sort={sort} onSort={toggleSort} />
              <Th k="model" label="Model" sort={sort} onSort={toggleSort} />
              <Th k="trim" label="Trim" sort={sort} onSort={toggleSort} />
              <Th k="segment" label="Segment" sort={sort} onSort={toggleSort} />
              <Th k="powertrain" label="Pwt" sort={sort} onSort={toggleSort} />
              <Th k="lengthMm" label="Length" right sort={sort} onSort={toggleSort} />
              <Th k="onRoadPriceIls" label="On-road ₪" right sort={sort} onSort={toggleSort} />
              <Th k="periodUnits" label={"Period"} right sort={sort} onSort={toggleSort} />
              {comparison ? <th className="px-3 py-2 text-right">Δ vs prior</th> : null}
              <Th k="ytdUnits" label="YTD" right sort={sort} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const color = POWERTRAIN_COLORS[r.powertrain as Powertrain];
              const delta =
                comparison && (r.comparisonUnits ?? 0) > 0
                  ? ((r.periodUnits - (r.comparisonUnits ?? 0)) / (r.comparisonUnits ?? 1)) * 100
                  : null;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect?.(r)}
                  className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2 font-medium">{r.brand}</td>
                  <td className="px-3 py-2">{r.model}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.trim}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.segment}</td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      style={{ borderColor: color + "66", color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {r.powertrain}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.lengthMm.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatIls(r.onRoadPriceIls)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumber(r.periodUnits)}
                  </td>
                  {comparison ? (
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular-nums text-xs",
                        delta == null
                          ? "text-muted-foreground"
                          : delta >= 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {delta == null ? "—" : formatPct(delta, 0)}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {formatNumber(r.ytdUnits)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={comparison ? 10 : 9} className="px-3 py-10 text-center text-muted-foreground">
                  No trims match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  k,
  label,
  sort,
  onSort,
  right,
}: {
  k: SortKey;
  label: string;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  right?: boolean;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "px-3 py-2 select-none cursor-pointer",
        right ? "text-right" : "text-left",
      )}
      onClick={() => onSort(k)}
    >
      <span className={cn("inline-flex items-center gap-1", active && "text-foreground")}>
        {label}
        <Icon className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );
}
