"use client";

import * as React from "react";
import { SlidersHorizontal, X, Search, LayoutGrid, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FiltersState } from "@/lib/types";
import { POWERTRAINS, POWERTRAIN_COLORS, ORIGINS, ORIGIN_LABELS } from "@/lib/enums";
import { cn, formatIls } from "@/lib/utils";

interface FiltersPanelProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  options: {
    brands: string[];
    segments: string[];
    lengthMin: number;
    lengthMax: number;
    priceMin: number;
    priceMax: number;
    models: { key: string; brand: string; model: string }[];
  };
}

export function FiltersPanel({ value, onChange, options }: FiltersPanelProps) {
  function toggle<K extends keyof FiltersState>(key: K, item: any) {
    const arr = value[key] as any[];
    const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    onChange({ ...value, [key]: next });
  }

  const [modelQuery, setModelQuery] = React.useState("");

  const activeCount =
    value.powertrains.length +
    value.brands.length +
    value.origins.length +
    value.segments.length +
    value.models.length +
    (value.search ? 1 : 0);

  // Filter the list of models by brand scope (if any brands selected) and
  // by the small in-popover search box.
  const filteredModels = React.useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return options.models
      .filter((m) => value.brands.length === 0 || value.brands.includes(m.brand))
      .filter(
        (m) =>
          !q ||
          m.model.toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q),
      );
  }, [options.models, value.brands, modelQuery]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Group-by toggle (Trim vs Model) */}
      <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-[12px]">
        <button
          onClick={() => onChange({ ...value, groupBy: "model" })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors",
            value.groupBy === "model"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="One bubble per model — aggregates its trims"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          By model
        </button>
        <button
          onClick={() => onChange({ ...value, groupBy: "trim" })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors",
            value.groupBy === "trim"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="One bubble per trim"
        >
          <Layers className="h-3.5 w-3.5" />
          By trim
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search brand, model, trim…"
          className="pl-9 w-[240px]"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-0.5 h-5 px-1.5">{activeCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] max-h-[70vh] overflow-y-auto" align="start">
          <div className="space-y-5">
            {/* Powertrains */}
            <Section title="Powertrain">
              <div className="flex flex-wrap gap-1.5">
                {POWERTRAINS.map((pt) => {
                  const on = value.powertrains.includes(pt);
                  return (
                    <button
                      key={pt}
                      onClick={() => toggle("powertrains", pt)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on
                          ? "bg-secondary border-foreground/20"
                          : "hover:border-foreground/20 text-muted-foreground",
                      )}
                      style={on ? { borderColor: POWERTRAIN_COLORS[pt] + "88" } : undefined}
                    >
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ background: POWERTRAIN_COLORS[pt] }}
                      />
                      {pt}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Origins */}
            <Section title="Brand origin">
              <div className="flex flex-wrap gap-1.5">
                {ORIGINS.map((o) => {
                  const on = value.origins.includes(o);
                  return (
                    <button
                      key={o}
                      onClick={() => toggle("origins", o)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on ? "bg-secondary border-foreground/20" : "text-muted-foreground",
                      )}
                    >
                      {ORIGIN_LABELS[o]}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Brands */}
            <Section title={`Brand (${options.brands.length})`}>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {options.brands.map((b) => {
                  const on = value.brands.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => toggle("brands", b)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        on ? "bg-secondary border-foreground/20" : "text-muted-foreground",
                      )}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Models */}
            <Section
              title={`Model (${
                value.models.length ? `${value.models.length}/${filteredModels.length}` : filteredModels.length
              })`}
            >
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder="Filter models…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1">
                {filteredModels.map((m) => {
                  const on = value.models.includes(m.key);
                  return (
                    <label
                      key={m.key}
                      className="flex items-center gap-2 cursor-pointer text-xs py-1 px-2 rounded-md hover:bg-secondary/70"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle("models", m.key)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <span className="text-muted-foreground">{m.brand}</span>
                      <span className="font-medium text-foreground">{m.model}</span>
                    </label>
                  );
                })}
                {filteredModels.length === 0 && (
                  <div className="text-xs text-muted-foreground italic px-2 py-2">
                    No models match.
                  </div>
                )}
              </div>
            </Section>

            {/* Segments */}
            <Section title="Segment">
              <div className="flex flex-wrap gap-1.5">
                {options.segments.map((s) => {
                  const on = value.segments.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggle("segments", s)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        on ? "bg-secondary border-foreground/20" : "text-muted-foreground",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Length */}
            <Section
              title={`Length · ${value.lengthRange[0]}–${value.lengthRange[1]} mm`}
            >
              <Slider
                min={options.lengthMin}
                max={options.lengthMax}
                step={50}
                value={value.lengthRange as unknown as number[]}
                onValueChange={(v) =>
                  onChange({ ...value, lengthRange: [v[0], v[1]] as [number, number] })
                }
              />
            </Section>

            {/* Price */}
            <Section
              title={`On-road price · ${formatIls(value.priceRange[0], {
                compact: true,
              })} – ${formatIls(value.priceRange[1], { compact: true })}`}
            >
              <Slider
                min={options.priceMin}
                max={options.priceMax}
                step={5000}
                value={value.priceRange as unknown as number[]}
                onValueChange={(v) =>
                  onChange({ ...value, priceRange: [v[0], v[1]] as [number, number] })
                }
              />
            </Section>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              powertrains: [],
              brands: [],
              origins: [],
              segments: [],
              models: [],
              search: "",
            })
          }
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
