"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SparkGrid } from "@/components/spark-grid";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import type { DailyDigest, Spark } from "@/types/sparks";

function loadDigests(): DailyDigest[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEYS.digests);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as DailyDigest[];
  } catch {
    return [];
  }
}

export function ArchiveClient() {
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const cached = loadDigests();
    setDigests(cached);
    if (cached.length) {
      setSelectedDate((current) => current || cached[0].date);
    }
  }, []);

  const selectedDigest = useMemo(
    () => digests.find((item) => item.date === selectedDate) ?? null,
    [digests, selectedDate],
  );

  return (
    <>
      <div className="space-y-6 pb-20 md:pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <CalendarDays className="h-5 w-5 text-cyan-200" />
              Digest Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
              <div className="space-y-2">
                <p className="text-sm text-white/70">Choose digest date</p>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  max={digests[0]?.date}
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                {selectedDigest
                  ? `Showing ${selectedDigest.sparks.length} sparks generated on ${format(new Date(selectedDigest.date), "PPP")}.`
                  : "No digest selected yet."}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Available digests</p>
              <div className="flex flex-wrap gap-2">
                {digests.map((digest) => (
                  <button
                    key={digest.date}
                    type="button"
                    onClick={() => setSelectedDate(digest.date)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      digest.date === selectedDate
                        ? "border-cyan-200/60 bg-cyan-500/20 text-cyan-50"
                        : "border-white/15 bg-black/30 text-white/70 hover:border-white/40"
                    }`}
                  >
                    {digest.date}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-fuchsia-200" />
              {selectedDigest ? `Sparks for ${selectedDigest.date}` : "No digest selected"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDigest ? (
              <SparkGrid
                sparks={selectedDigest.sparks}
                onSaveSpark={(spark: Spark) => {
                  const existing = localStorage.getItem(STORAGE_KEYS.notebook);
                  const parsed: Array<Spark & { savedAt?: string }> = existing
                    ? (JSON.parse(existing) as Array<Spark & { savedAt?: string }>)
                    : [];
                  const alreadySaved = parsed.some((item) => item.id === spark.id);

                  if (!alreadySaved) {
                    localStorage.setItem(
                      STORAGE_KEYS.notebook,
                      JSON.stringify([{ ...spark, savedAt: new Date().toISOString() }, ...parsed]),
                    );
                  }

                  toast({
                    title: alreadySaved ? "Already saved" : "Saved to notebook",
                    description: alreadySaved
                      ? "This spark already exists in your notebook."
                      : `${spark.title} is ready in Notebook.`,
                  });
                }}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center text-white/70">
                Generate your first daily digest on the dashboard, then revisit it here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
