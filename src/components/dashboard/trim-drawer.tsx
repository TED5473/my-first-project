"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { TrimRow } from "@/lib/types";
import { formatIls, formatNumber } from "@/lib/utils";
import { POWERTRAIN_COLORS, type Powertrain } from "@/lib/enums";
import { ExternalLink } from "lucide-react";

interface Props {
  rows: TrimRow[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  focus: TrimRow | null;
}

/**
 * Shows the full trim matrix for the focused model — useful for sales reps
 * comparing trims while pricing a deal.
 */
export function TrimDrawer({ rows, open, onOpenChange, focus }: Props) {
  const trims = focus ? rows.filter((r) => r.brand === focus.brand && r.model === focus.model) : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{focus?.brand}</Badge>
            <DialogTitle>{focus?.model} — trim matrix</DialogTitle>
          </div>
          <DialogDescription>
            {focus?.segment} · {focus?.bodyStyle} · {trims.length} trims
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-2">Trim</th>
                <th className="text-left py-2">Pwt</th>
                <th className="text-right py-2">Length</th>
                <th className="text-right py-2">On-road</th>
                <th className="text-right py-2">Range</th>
                <th className="text-right py-2">kW</th>
                <th className="text-right py-2">Period</th>
                <th className="text-right py-2">YTD</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {trims.map((t) => {
                const color = POWERTRAIN_COLORS[t.powertrain as Powertrain];
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="py-2">{t.trim}</td>
                    <td className="py-2">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px]"
                        style={{ borderColor: color + "66", color }}
                      >
                        {t.powertrain}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{t.lengthMm} mm</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {formatIls(t.onRoadPriceIls)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">
                      {(() => {
                        const km =
                          t.powertrain === "BEV"
                            ? t.eRangeKm ?? t.combinedKm
                            : t.combinedKm ?? t.eRangeKm;
                        if (km == null) return "—";
                        return (
                          <span>
                            {formatNumber(km)}
                            <span className="text-muted-foreground"> km</span>
                            {t.powertrain === "PHEV" && t.eRangeKm ? (
                              <span className="block text-[10px] text-muted-foreground">
                                {t.eRangeKm} km EV
                              </span>
                            ) : null}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2 text-right tabular-nums">{t.power ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(t.periodUnits)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatNumber(t.ytdUnits)}
                    </td>
                    <td className="py-2 text-right">
                      {t.importerUrl && (
                        <a
                          href={t.importerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
