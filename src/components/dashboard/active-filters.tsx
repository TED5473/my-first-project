"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { FiltersState } from "@/lib/types";
import { formatIls } from "@/lib/utils";
import { ORIGIN_LABELS } from "@/lib/enums";

interface ActiveFiltersProps {
  value: FiltersState;
  options: {
    lengthMin: number;
    lengthMax: number;
    priceMin: number;
    priceMax: number;
  };
  onChange: (next: FiltersState) => void;
}

/**
 * Compact horizontal pill-bar that reflects every active filter and lets the
 * user remove individual chips or clear the whole set. Shown right under the
 * hero header; hidden when no filters are active.
 */
export function ActiveFilters({ value, options, onChange }: ActiveFiltersProps) {
  const pills: { key: string; label: string; onRemove: () => void }[] = [];

  if (value.search.trim()) {
    pills.push({
      key: "search",
      label: `"${value.search.trim()}"`,
      onRemove: () => onChange({ ...value, search: "" }),
    });
  }
  for (const pt of value.powertrains) {
    pills.push({
      key: `pt:${pt}`,
      label: pt,
      onRemove: () =>
        onChange({ ...value, powertrains: value.powertrains.filter((x) => x !== pt) }),
    });
  }
  for (const o of value.origins) {
    pills.push({
      key: `origin:${o}`,
      label: ORIGIN_LABELS[o],
      onRemove: () =>
        onChange({ ...value, origins: value.origins.filter((x) => x !== o) }),
    });
  }
  for (const b of value.brands) {
    pills.push({
      key: `brand:${b}`,
      label: b,
      onRemove: () =>
        onChange({ ...value, brands: value.brands.filter((x) => x !== b) }),
    });
  }
  for (const m of value.models) {
    const [brand, model] = m.split("|");
    pills.push({
      key: `model:${m}`,
      label: `${brand} ${model}`,
      onRemove: () =>
        onChange({ ...value, models: value.models.filter((x) => x !== m) }),
    });
  }
  for (const s of value.segments) {
    pills.push({
      key: `segment:${s}`,
      label: s,
      onRemove: () =>
        onChange({ ...value, segments: value.segments.filter((x) => x !== s) }),
    });
  }

  const lengthTouched =
    value.lengthRange[0] !== options.lengthMin ||
    value.lengthRange[1] !== options.lengthMax;
  if (lengthTouched) {
    pills.push({
      key: "length",
      label: `Length ${value.lengthRange[0]}–${value.lengthRange[1]} mm`,
      onRemove: () =>
        onChange({
          ...value,
          lengthRange: [options.lengthMin, options.lengthMax],
        }),
    });
  }

  const priceTouched =
    value.priceRange[0] !== options.priceMin ||
    value.priceRange[1] !== options.priceMax;
  if (priceTouched) {
    pills.push({
      key: "price",
      label: `Price ${formatIls(value.priceRange[0], { compact: true })} – ${formatIls(value.priceRange[1], { compact: true })}`,
      onRemove: () =>
        onChange({
          ...value,
          priceRange: [options.priceMin, options.priceMax],
        }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
        Active filters
      </span>
      {pills.map((p) => (
        <button
          key={p.key}
          onClick={p.onRemove}
          className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground hover:border-foreground/30 transition-colors"
          title="Remove"
        >
          <span>{p.label}</span>
          <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
        </button>
      ))}
      <button
        onClick={() =>
          onChange({
            ...value,
            search: "",
            powertrains: [],
            origins: [],
            brands: [],
            models: [],
            segments: [],
            lengthRange: [options.lengthMin, options.lengthMax],
            priceRange: [options.priceMin, options.priceMax],
          })
        }
        className="ml-1 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}
