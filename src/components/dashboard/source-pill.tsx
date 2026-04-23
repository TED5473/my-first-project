"use client";

import * as React from "react";
import { MapPin, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps a raw source code to a human label + tone. Cartube is the default
 *  and is rendered as the pin-and-text affordance the product spec calls for:
 *  "📍 cartube.co.il". MANUAL rows mean a human edited the row in
 *  /admin/data; they keep their cartube heritage but flag the override. */
export function SourcePill({
  specs,
  volume,
  updatedAt,
  importerUrl,
  size = "sm",
}: {
  specs?: string | null;
  volume?: string | null;
  updatedAt?: string;
  importerUrl?: string | null;
  size?: "xs" | "sm";
}) {
  const s = (specs ?? "CARTUBE").toUpperCase();
  const v = (volume ?? "CARTUBE").toUpperCase();
  const isManual = s === "MANUAL" || v === "MANUAL";
  const updated = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-IL")
    : null;
  const title = [
    `Specs: ${s === "CARTUBE" ? "cartube.co.il" : s}${
      importerUrl ? ` (${safeHost(importerUrl)})` : ""
    }`,
    `Volume: ${v === "CARTUBE" ? "cartube.co.il" : v}`,
    updated ? `Last updated: ${updated}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const base =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : "text-[11px] px-2 py-0.5 gap-1";

  if (isManual) {
    return (
      <span
        title={title}
        className={cn(
          "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium whitespace-nowrap",
          base,
        )}
      >
        <Pencil className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        Manual override
      </span>
    );
  }

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/10 text-primary font-medium whitespace-nowrap",
        base,
      )}
    >
      <MapPin className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      cartube.co.il
    </span>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
