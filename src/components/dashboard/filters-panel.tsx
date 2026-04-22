"use client";

import * as React from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";
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
  };
}

export function FiltersPanel({ value, onChange, options }: FiltersPanelProps) {
  function toggle<K extends keyof FiltersState>(key: K, item: any) {
    const arr = value[key] as any[];
    const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    onChange({ ...value, [key]: next });
  }

  const activeCount =
    value.powertrains.length +
    value.brands.length +
    value.origins.length +
    value.segments.length +
    (value.search ? 1 : 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
