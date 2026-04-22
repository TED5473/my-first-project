"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, FileDown, Terminal } from "lucide-react";

export function AdminActions() {
  const [token, setToken] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  async function run(endpoint: string, label: string) {
    setRunning(true);
    setLog((l) => [...l, `→ ${label}…`]);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || "dev-admin-token"}` },
      });
      const json = await res.json().catch(() => ({}));
      setLog((l) => [...l, `  ${res.ok ? "✓" : "✗"} ${res.status}: ${JSON.stringify(json)}`]);
    } catch (e) {
      setLog((l) => [...l, `  ✗ ${(e as Error).message}`]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Admin token
        </div>
        <Input
          type="password"
          placeholder="ADMIN_API_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-1 gap-2">
        <Button
          onClick={() => run("/api/admin/refresh", "Full refresh (I-VIA + importers)")}
          disabled={running}
          className="gap-2"
        >
          <RefreshCw className={running ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Full refresh
        </Button>
        <Button
          onClick={() => run("/api/admin/scrape/ivia", "Scrape I-VIA PDFs")}
          disabled={running}
          variant="outline"
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          I-VIA only
        </Button>
        <Button
          onClick={() => run("/api/admin/scrape/importers", "Scrape importer websites")}
          disabled={running}
          variant="outline"
          className="gap-2"
        >
          <Terminal className="h-4 w-4" />
          Importers only
        </Button>
      </div>

      <pre className="rounded-md border bg-black/40 p-3 text-xs font-mono max-h-48 overflow-auto whitespace-pre-wrap">
        {log.length === 0 ? "$ waiting for action…" : log.join("\n")}
      </pre>
    </div>
  );
}
