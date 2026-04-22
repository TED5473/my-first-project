"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeroSearchProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

/**
 * Prominent hero search box — lives next to the period selector in the
 * dashboard header. Instantly filters the bubble chart + bar chart +
 * table (via FiltersState.search, which the applyFilters helper already
 * honours). Debouncing isn't needed here because the downstream work is
 * purely in-memory and O(rows).
 */
export function HeroSearch({ value, onChange, className }: HeroSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search brand, model, trim…"
        className="pl-9 pr-9 h-10 w-full sm:w-[320px] text-[14px]"
        aria-label="Search models"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
