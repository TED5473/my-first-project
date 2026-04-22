"use client";

import * as React from "react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  Search,
  Upload,
  Save,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatIls, formatNumber } from "@/lib/utils";
import { POWERTRAINS, type Powertrain } from "@/lib/enums";

/** Shape returned by GET /api/admin/trims. */
interface AdminTrim {
  id: string;
  brand: string;
  model: string;
  trim: string;
  segment: string;
  bodyStyle: string;
  powertrain: Powertrain;
  lengthMm: number;
  onRoadPriceIls: number;
  priceListIls: number;
  eRangeKm: number | null;
  combinedKm: number | null;
  batteryKwh: number | null;
  power: number | null;
  sourceSpecs: string | null;
  sourceVolume: string | null;
  importerUrl: string | null;
  updatedAt: string;
  last28Units: number;
}

type EditablePatch = Partial<
  Pick<AdminTrim, "lengthMm" | "onRoadPriceIls" | "eRangeKm" | "powertrain" | "trim">
> & {
  currentMonthlyUnits?: number | null;
};

const SESSION_KEY = "ilcl.admin.pw";

export function AdminDataEditor() {
  const [password, setPassword] = React.useState<string>("");
  const [unlocked, setUnlocked] = React.useState(false);

  // Re-use the password from sessionStorage so refreshes stay unlocked.
  React.useEffect(() => {
    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    if (saved) {
      setPassword(saved);
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) {
    return (
      <Card className="max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold">Password required</div>
              <div className="text-xs text-muted-foreground">
                Set ADMIN_EDITOR_PASSWORD in your Vercel env. Default is{" "}
                <code className="font-mono">admin123</code>.
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!password) return;
              sessionStorage.setItem(SESSION_KEY, password);
              setUnlocked(true);
            }}
            className="flex gap-2"
          >
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit">Unlock</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return <EditorGrid password={password} onLock={() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setPassword("");
  }} />;
}

function EditorGrid({ password, onLock }: { password: string; onLock: () => void }) {
  const [rows, setRows] = React.useState<AdminTrim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [pending, setPending] = React.useState<Record<string, EditablePatch>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trims", {
        headers: { Authorization: `Bearer ${password}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Unauthorized — wrong password?");
        onLock();
        return;
      }
      if (!res.ok) throw new Error(`GET /api/admin/trims → ${res.status}`);
      const data = (await res.json()) as { trims: AdminTrim[] };
      setRows(data.trims);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, [password, onLock]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.brand} ${r.model} ${r.trim} ${r.segment} ${r.powertrain}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const patch = (id: string, next: Partial<EditablePatch>) => {
    setPending((p) => ({
      ...p,
      [id]: { ...(p[id] ?? {}), ...next },
    }));
  };

  const save = async (row: AdminTrim) => {
    const body = pending[row.id];
    if (!body || Object.keys(body).length === 0) return;
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/admin/trims/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`PATCH failed: ${res.status} — ${msg}`);
      }
      setPending((p) => {
        const cp = { ...p };
        delete cp[row.id];
        return cp;
      });
      await load();
      showToast(`Saved ${row.brand} ${row.model} ${row.trim}`);
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`);
    } finally {
      setSavingId(null);
    }
  };

  const refreshIvia = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/refresh-ivia", {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error(`refresh → ${res.status}`);
      const data = await res.json();
      showToast(`I-VIA refresh: ${data?.rows ?? 0} rows`);
      await load();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "brand",
      "model",
      "trim",
      "segment",
      "powertrain",
      "lengthMm",
      "onRoadPriceIls",
      "eRangeKm",
      "combinedKm",
      "last28Units",
      "sourceSpecs",
      "sourceVolume",
      "updatedAt",
    ];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const row = headers.map((h) => {
        const v = (r as any)[h];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      });
      lines.push(row.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "il-carlens-admin.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      showToast("CSV looks empty");
      return;
    }
    const headers = parseCsvLine(lines[0]);
    const idx = (name: string) => headers.indexOf(name);
    const idxId = idx("id");
    if (idxId < 0) {
      showToast("CSV needs an 'id' column");
      return;
    }

    const mapped: { id: string; patch: EditablePatch }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const id = cols[idxId];
      if (!id) continue;
      const patch: EditablePatch = {};
      const num = (h: string) => {
        const j = idx(h);
        if (j < 0) return undefined;
        const v = cols[j];
        if (v === "" || v === undefined) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      const len = num("lengthMm");
      if (len != null) patch.lengthMm = len;
      const price = num("onRoadPriceIls");
      if (price != null) patch.onRoadPriceIls = price;
      const eRange = num("eRangeKm");
      if (eRange != null) patch.eRangeKm = eRange;
      const volUnits = num("last28Units");
      if (volUnits != null) patch.currentMonthlyUnits = volUnits; // treat last28 ≈ monthly
      const ptJ = idx("powertrain");
      if (ptJ >= 0 && cols[ptJ] && (POWERTRAINS as readonly string[]).includes(cols[ptJ])) {
        patch.powertrain = cols[ptJ] as Powertrain;
      }
      const trimJ = idx("trim");
      if (trimJ >= 0 && cols[trimJ]) patch.trim = cols[trimJ];

      if (Object.keys(patch).length > 0) mapped.push({ id, patch });
    }

    if (mapped.length === 0) {
      showToast("No editable columns found in CSV");
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const m of mapped) {
      try {
        const res = await fetch(`/api/admin/trims/${m.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${password}`,
          },
          body: JSON.stringify(m.patch),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    await load();
    showToast(`Imported ${ok} row${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand / model / trim…"
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={refreshIvia}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh from I-VIA
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importCsv(f);
                e.target.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs h-8 hover:bg-secondary">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </span>
          </label>
          <Button size="sm" variant="ghost" className="gap-1.5 ml-auto" onClick={onLock}>
            <Lock className="h-3.5 w-3.5" /> Lock
          </Button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border-b border-emerald-200">
            <Check className="h-3.5 w-3.5" />
            {toast}
          </div>
        )}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-800 text-xs border-b border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/70">
                <tr>
                  <th className="px-3 py-2 text-left">Brand · Model</th>
                  <th className="px-3 py-2 text-left">Trim</th>
                  <th className="px-3 py-2 text-left">Powertrain</th>
                  <th className="px-3 py-2 text-right">Length mm</th>
                  <th className="px-3 py-2 text-right">On-road ₪</th>
                  <th className="px-3 py-2 text-right">E-range km</th>
                  <th className="px-3 py-2 text-right">28-day units</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Last updated</th>
                  <th className="px-3 py-2 text-right">Save</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const p = pending[r.id] ?? {};
                  const dirty = Object.keys(p).length > 0;
                  const current = {
                    lengthMm: p.lengthMm ?? r.lengthMm,
                    onRoadPriceIls: p.onRoadPriceIls ?? r.onRoadPriceIls,
                    eRangeKm: p.eRangeKm ?? r.eRangeKm,
                    powertrain: p.powertrain ?? r.powertrain,
                    trim: p.trim ?? r.trim,
                    currentMonthlyUnits:
                      p.currentMonthlyUnits ?? r.last28Units,
                  };
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-t border-border",
                        dirty && "bg-amber-50/60",
                      )}
                    >
                      <td className="px-3 py-2 align-middle">
                        <div className="text-xs text-muted-foreground">{r.brand}</div>
                        <div className="font-medium">{r.model}</div>
                        <div className="text-[10px] text-muted-foreground">{r.segment} · {r.bodyStyle}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Input
                          value={current.trim}
                          onChange={(e) => patch(r.id, { trim: e.target.value })}
                          className="h-8 text-xs w-[180px]"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Select
                          value={current.powertrain}
                          onValueChange={(v) =>
                            patch(r.id, { powertrain: v as Powertrain })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-[96px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POWERTRAINS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Input
                          type="number"
                          value={current.lengthMm}
                          onChange={(e) =>
                            patch(r.id, {
                              lengthMm: parseInt(e.target.value || "0", 10),
                            })
                          }
                          className="h-8 text-xs tabular-nums text-right w-[90px]"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Input
                          type="number"
                          value={current.onRoadPriceIls}
                          onChange={(e) =>
                            patch(r.id, {
                              onRoadPriceIls: parseInt(e.target.value || "0", 10),
                            })
                          }
                          className="h-8 text-xs tabular-nums text-right w-[110px]"
                        />
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatIls(current.onRoadPriceIls)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Input
                          type="number"
                          value={current.eRangeKm ?? ""}
                          placeholder="—"
                          onChange={(e) =>
                            patch(r.id, {
                              eRangeKm:
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value, 10),
                            })
                          }
                          className="h-8 text-xs tabular-nums text-right w-[80px]"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Input
                          type="number"
                          value={current.currentMonthlyUnits ?? ""}
                          onChange={(e) =>
                            patch(r.id, {
                              currentMonthlyUnits:
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value, 10),
                            })
                          }
                          className="h-8 text-xs tabular-nums text-right w-[96px]"
                        />
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          last 28d
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium"
                          title={`Specs: ${r.sourceSpecs ?? "—"} · Volume: ${r.sourceVolume ?? "—"}`}
                        >
                          {r.sourceSpecs ?? "—"} / {r.sourceVolume ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleDateString("en-IL")}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Button
                          size="sm"
                          disabled={!dirty || savingId === r.id}
                          onClick={() => save(r)}
                          className="gap-1.5"
                        >
                          <Save className={cn("h-3.5 w-3.5", savingId === r.id && "animate-spin")} />
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-border flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5" />
          <div>
            Updates are written straight to the production database. When you
            edit the "28-day units" column, we store the new value as this
            week's snapshot so the charts refresh within a few seconds. Use
            "Refresh from I-VIA" to run the demo scraper (or the real Playwright
            pipeline once it's wired).
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === ",") {
        out.push(cur);
        cur = "";
      } else if (c === '"') {
        inQuotes = true;
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}
