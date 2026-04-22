"use client";

import type { TrimRow } from "./types";

/** Minimal CSV export — no external dep. */
export function exportCsv(rows: TrimRow[], filename = "il-carlens.csv") {
  const headers = [
    "brand",
    "model",
    "trim",
    "segment",
    "bodyStyle",
    "powertrain",
    "lengthMm",
    "onRoadPriceIls",
    "priceListIls",
    "eRangeKm",
    "batteryKwh",
    "power",
    "periodUnits",
    "ytdUnits",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = (r as any)[h];
          if (v == null) return "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export async function exportXlsx(rows: TrimRow[], filename = "il-carlens.xlsx") {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Brand: r.brand,
      Model: r.model,
      Trim: r.trim,
      Segment: r.segment,
      Body: r.bodyStyle,
      Powertrain: r.powertrain,
      "Length (mm)": r.lengthMm,
      "On-road ₪": r.onRoadPriceIls,
      "List ₪": r.priceListIls,
      "E-range km": r.eRangeKm ?? "",
      "Battery kWh": r.batteryKwh ?? "",
      "Power kW": r.power ?? "",
      "Period units": r.periodUnits,
      "YTD units": r.ytdUnits,
    })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, worksheet, "IL CarLens");
  XLSX.writeFile(wb, filename);
}

/** "PDF" export: triggers browser print — works well on any PC and preserves charts. */
export function exportPdf() {
  if (typeof window !== "undefined") window.print();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
