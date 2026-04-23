"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  X,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TrimRow } from "@/lib/types";
import { cn, formatIls, formatNumber, formatPct } from "@/lib/utils";
import { POWERTRAIN_COLORS, type Powertrain } from "@/lib/enums";
import { exportCsv, exportXlsx, exportPdf } from "@/lib/export";
import { Sparkline } from "./sparkline";
import { SourcePill } from "./source-pill";

type SortKey =
  | "brand"
  | "model"
  | "trim"
  | "segment"
  | "powertrain"
  | "lengthMm"
  | "rangeKm"
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

  // Table-scoped filters. These stack on top of the global filter bar so the
  // user can drill into specific models/trims without narrowing the charts
  // above. Keyed by "Brand|Model" and trim id.
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [selectedTrims, setSelectedTrims] = React.useState<string[]>([]);

  // Build option lists from the incoming rows. Scoped (i.e. the Trim list is
  // clipped to whatever models are currently selected, so the user never
  // sees a trim that can't possibly match).
  const { modelOptions, trimOptions } = React.useMemo(() => {
    const modelMap = new Map<string, { key: string; brand: string; model: string; count: number }>();
    for (const r of rows) {
      const key = `${r.brand}|${r.model}`;
      const entry = modelMap.get(key);
      if (entry) entry.count++;
      else modelMap.set(key, { key, brand: r.brand, model: r.model, count: 1 });
    }
    const scopedRowsForTrims =
      selectedModels.length === 0
        ? rows
        : rows.filter((r) => selectedModels.includes(`${r.brand}|${r.model}`));
    const trimList = scopedRowsForTrims.map((r) => ({
      id: r.id,
      label: `${r.brand} ${r.model} — ${r.trim}`,
      brand: r.brand,
      model: r.model,
      trim: r.trim,
    }));
    return {
      modelOptions: [...modelMap.values()].sort(
        (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
      ),
      trimOptions: trimList.sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [rows, selectedModels]);

  // Drop any previously-selected trims that can no longer match the new
  // model scope. We do this inside an effect rather than mutating during
  // render.
  React.useEffect(() => {
    if (selectedTrims.length === 0) return;
    const allowed = new Set(trimOptions.map((t) => t.id));
    const next = selectedTrims.filter((id) => allowed.has(id));
    if (next.length !== selectedTrims.length) setSelectedTrims(next);
  }, [trimOptions, selectedTrims]);

  const filteredRows = React.useMemo(() => {
    if (selectedModels.length === 0 && selectedTrims.length === 0) return rows;
    return rows.filter((r) => {
      if (
        selectedModels.length &&
        !selectedModels.includes(`${r.brand}|${r.model}`)
      ) {
        return false;
      }
      if (selectedTrims.length && !selectedTrims.includes(r.id)) return false;
      return true;
    });
  }, [rows, selectedModels, selectedTrims]);

  const tableScopedCount = selectedModels.length + selectedTrims.length;

  // Derived "display range" per trim — BEV shows e-range, others show combined.
  const rangeOf = React.useCallback((r: TrimRow) => {
    if (r.powertrain === "BEV") return r.eRangeKm ?? r.combinedKm ?? null;
    return r.combinedKm ?? r.eRangeKm ?? null;
  }, []);

  const sorted = React.useMemo(() => {
    const cp = [...filteredRows];
    cp.sort((a, b) => {
      const av = sort.key === "rangeKm" ? rangeOf(a) : (a[sort.key] as any);
      const bv = sort.key === "rangeKm" ? rangeOf(b) : (b[sort.key] as any);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return cp;
  }, [filteredRows, sort, rangeOf]);

  function toggleSort(k: SortKey) {
    setSort((s) =>
      s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" },
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card card-elevated">
      <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
        <div>
          <div className="font-display font-semibold">Models & trims</div>
          <div className="text-xs text-muted-foreground">
            {selectedModels.length === 0 && selectedTrims.length === 0
              ? `${formatNumber(rows.length)} trims · ${periodLabel}`
              : `${formatNumber(filteredRows.length)} / ${formatNumber(rows.length)} trims · ${periodLabel}`}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <TableFilterPopover
            label="Model"
            placeholder="Filter models…"
            options={modelOptions.map((m) => ({
              key: m.key,
              primary: m.model,
              secondary: m.brand,
              meta: `${m.count} trim${m.count === 1 ? "" : "s"}`,
            }))}
            selected={selectedModels}
            onChange={setSelectedModels}
          />
          <TableFilterPopover
            label="Trim"
            placeholder="Filter trims…"
            options={trimOptions.map((t) => ({
              key: t.id,
              primary: t.trim,
              secondary: `${t.brand} ${t.model}`,
            }))}
            selected={selectedTrims}
            onChange={setSelectedTrims}
            disabled={trimOptions.length === 0}
          />
          {tableScopedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                setSelectedModels([]);
                setSelectedTrims([]);
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <span className="mx-1 h-5 w-px bg-border hidden sm:inline-block" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportCsv(filteredRows)}
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportXlsx(filteredRows)}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPdf()}>
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/70">
            <tr>
              <Th k="brand" label="Brand" sort={sort} onSort={toggleSort} />
              <Th k="model" label="Model" sort={sort} onSort={toggleSort} />
              <Th k="trim" label="Trim" sort={sort} onSort={toggleSort} />
              <Th k="segment" label="Segment" sort={sort} onSort={toggleSort} />
              <Th k="powertrain" label="Pwt" sort={sort} onSort={toggleSort} />
              <Th k="lengthMm" label="Length" right sort={sort} onSort={toggleSort} />
              <Th k="rangeKm" label="Range" right sort={sort} onSort={toggleSort} />
              <Th k="onRoadPriceIls" label="On-road ₪" right sort={sort} onSort={toggleSort} />
              <Th k="periodUnits" label={"Period"} right sort={sort} onSort={toggleSort} />
              {comparison ? <th className="px-3 py-2 text-right">Δ vs prior</th> : null}
              <Th k="ytdUnits" label="YTD" right sort={sort} onSort={toggleSort} />
              <th className="px-3 py-2 text-right">4-wk trend</th>
              <th className="px-3 py-2 text-right">Source</th>
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
                  className="border-t border-border hover:bg-secondary/40 cursor-pointer transition-colors"
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
                  <td className="px-3 py-2 text-right tabular-nums text-xs">
                    {(() => {
                      const km = rangeOf(r);
                      if (km == null) return <span className="text-muted-foreground">—</span>;
                      return (
                        <span>
                          {formatNumber(km)}
                          <span className="text-muted-foreground"> km</span>
                          {r.powertrain === "PHEV" && r.eRangeKm ? (
                            <span className="block text-[10px] text-muted-foreground">
                              {r.eRangeKm} km EV
                            </span>
                          ) : null}
                        </span>
                      );
                    })()}
                  </td>
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
                  <td className="px-3 py-2 text-right">
                    <Sparkline values={r.recentWeekly ?? []} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <SourcePill
                      specs={r.sourceSpecs ?? null}
                      volume={r.sourceVolume ?? null}
                      updatedAt={r.updatedAt}
                      importerUrl={r.importerUrl ?? undefined}
                    />
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={comparison ? 13 : 12} className="px-3 py-10 text-center text-muted-foreground">
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

interface FilterOption {
  key: string;
  primary: string;
  secondary?: string;
  meta?: string;
}

/**
 * Reusable multi-select popover used by the Models & trims table.
 * Shows a count chip when anything is selected, supports an in-popover
 * search box, and "Select all / Clear" shortcuts. We don't extract this
 * to `components/ui` yet because the data table is its only consumer —
 * if we reuse it elsewhere we'll lift it then.
 */
function TableFilterPopover({
  label,
  placeholder,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.primary.toLowerCase().includes(q) ||
        (o.secondary ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else onChange([...selected, key]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          title={
            disabled
              ? `Pick a model first to narrow the trim list`
              : `Filter by ${label.toLowerCase()}`
          }
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {label}
          {selected.length > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[320px] p-0 overflow-hidden"
      >
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
            <span>
              {selected.length} / {options.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                className="hover:text-foreground disabled:opacity-40"
                disabled={filtered.length === 0}
                onClick={() =>
                  onChange(Array.from(new Set([...selected, ...filtered.map((o) => o.key)])))
                }
              >
                Select all
              </button>
              <span>·</span>
              <button
                className="hover:text-foreground disabled:opacity-40"
                disabled={selected.length === 0}
                onClick={() => onChange([])}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <div className="max-h-[260px] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground italic">
              No matches.
            </div>
          )}
          {filtered.map((o) => {
            const on = selected.includes(o.key);
            return (
              <button
                key={o.key}
                onClick={() => toggle(o.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-secondary/70",
                  on && "bg-secondary/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    on
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-medium text-foreground">{o.primary}</span>
                  {o.secondary && (
                    <span className="text-muted-foreground"> · {o.secondary}</span>
                  )}
                </span>
                {o.meta && (
                  <span className="text-[10px] text-muted-foreground">{o.meta}</span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
