"use client";

import * as React from "react";
import { Loader2, Database } from "lucide-react";

/**
 * Shown on the very first page load after a fresh deploy, while the server
 * is auto-seeding the database. The page auto-refreshes every few seconds
 * until the dashboard is ready.
 */
export function FirstBootScreen() {
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (typeof window !== "undefined") window.location.reload();
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Database className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold">
          Getting things ready…
        </h1>
        <p className="text-sm text-muted-foreground">
          We're populating the database with the 2026 Israel passenger car
          market dataset — this only happens once, and takes about 30
          seconds on a fresh deploy.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          The page will refresh automatically.
        </div>
      </div>
    </div>
  );
}
