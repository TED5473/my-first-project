"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESETS } from "@/lib/periods";
import type { PeriodPreset } from "@/lib/types";

export function PeriodSelector({
  value,
  compare,
}: {
  value: PeriodPreset;
  compare: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(next: Partial<{ period: PeriodPreset; compare: boolean }>) {
    const p = new URLSearchParams(params?.toString());
    if (next.period !== undefined) p.set("period", next.period);
    if (next.compare !== undefined) {
      if (next.compare) p.set("compare", "1");
      else p.delete("compare");
    }
    router.push(`/?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-background/40">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <Select
          value={value}
          onValueChange={(v) => setParam({ period: v as PeriodPreset })}
        >
          <SelectTrigger className="h-8 w-[170px] border-0 bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant={compare ? "default" : "outline"}
        size="sm"
        onClick={() => setParam({ compare: !compare })}
        className="gap-1.5"
      >
        <GitCompareArrows className="h-4 w-4" />
        {compare ? "Comparing prior period" : "Compare"}
      </Button>
    </div>
  );
}
