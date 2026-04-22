"use client";

import * as React from "react";

/**
 * Tiny, dependency-free sparkline. Renders up to N weekly points as a
 * tinted area + line. Momentum (last vs first) controls the color:
 *   up   → emerald
 *   flat → slate
 *   down → red
 *
 * We deliberately avoid Recharts here — the data table can have 100+
 * rows and mounting that many chart instances is expensive.
 */
export function Sparkline({
  values,
  width = 96,
  height = 22,
  strokeWidth = 1.5,
}: {
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (!values || values.length < 2) {
    return (
      <span className="inline-block text-[10px] text-muted-foreground/60">—</span>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 3;
  const innerH = height - padY * 2;

  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = padY + (1 - (v - min) / range) * innerH;
    return [x, y] as [number, number];
  });

  const path = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height} L0,${height} Z`;

  // Momentum = average of last 2 vs average of first 2 (more stable than
  // raw end-points when one week is spiky).
  const head = values.slice(-2).reduce((s, n) => s + n, 0) / Math.min(2, values.length);
  const tail = values.slice(0, 2).reduce((s, n) => s + n, 0) / Math.min(2, values.length);
  const delta = tail > 0 ? (head - tail) / tail : 0;
  const color =
    delta > 0.05 ? "#10b981" : delta < -0.05 ? "#ef4444" : "#64748b";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
      role="img"
      aria-label={`recent weekly sales, ${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(0)}% momentum`}
    >
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r={2}
        fill={color}
      />
    </svg>
  );
}
