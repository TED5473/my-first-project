"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Clock3, RefreshCw, Sparkles } from "lucide-react";

import { Hero } from "@/components/hero";
import { SparkGrid } from "@/components/spark-grid";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateTodaySparksAction } from "@/lib/actions";
import { APP_COPY, DEFAULT_SUBMOLTS } from "@/lib/constants";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { toast } from "@/components/ui/use-toast";
import type { DailyDigest, DashboardSettings, Spark } from "@/types/sparks";

type DashboardClientProps = {
  initialDigest: DailyDigest | null;
  initialSettings: DashboardSettings;
};

function upsertDigest(digest: DailyDigest): DailyDigest[] {
  const existing = localStorage.getItem(STORAGE_KEYS.digests);
  const parsed: DailyDigest[] = existing ? (JSON.parse(existing) as DailyDigest[]) : [];

  const deduped = parsed.filter((entry) => entry.date !== digest.date);
  const updated = [digest, ...deduped].sort((a, b) => b.date.localeCompare(a.date));

  localStorage.setItem(STORAGE_KEYS.digests, JSON.stringify(updated));

  return updated;
}

function pushNotebook(spark: Spark) {
  const existing = localStorage.getItem(STORAGE_KEYS.notebook);
  const parsed = existing ? (JSON.parse(existing) as Spark[]) : [];

  const alreadySaved = parsed.some((item) => item.id === spark.id);
  if (alreadySaved) {
    return false;
  }

  localStorage.setItem(
    STORAGE_KEYS.notebook,
    JSON.stringify([
      { ...spark, savedAt: new Date().toISOString() },
      ...parsed,
    ]),
  );

  return true;
}

export function DashboardClient({ initialDigest, initialSettings }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [digest, setDigest] = useState<DailyDigest | null>(initialDigest);

  const settings = useMemo<DashboardSettings>(() => {
    if (typeof window === "undefined") {
      return initialSettings;
    }

    const cached = localStorage.getItem(STORAGE_KEYS.settings);
    if (!cached) {
      return initialSettings;
    }

    return {
      ...initialSettings,
      ...(JSON.parse(cached) as DashboardSettings),
    };
  }, [initialSettings]);

  const updatedAtLabel = digest?.updatedAt
    ? format(new Date(digest.updatedAt), "PPpp")
    : "Not generated today";

  useEffect(() => {
    const cachedDigests = localStorage.getItem(STORAGE_KEYS.digests);
    if (!cachedDigests) {
      return;
    }

    try {
      const parsed = JSON.parse(cachedDigests) as DailyDigest[];
      if (parsed.length && !digest) {
        setDigest(parsed[0]);
      }
    } catch {
      // Ignore malformed local data and continue with server defaults.
    }
  }, [digest]);

  return (
    <>
      <div className="space-y-8 pb-20 md:pb-8">
        <Hero />

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-white">
                <Sparkles className="h-5 w-5 text-cyan-200" />
                Today&apos;s Sci-Fi Sparks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SparkGrid
                sparks={digest?.sparks ?? []}
                onSaveSpark={(spark) => {
                  const saved = pushNotebook(spark);
                  toast({
                    title: saved ? "Saved to notebook" : "Already in notebook",
                    description: saved
                      ? `${spark.title} is now in your novel notebook.`
                      : "This spark was already saved.",
                  });
                }}
              />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-white">Generation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="lg"
                className="w-full"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const response = await generateTodaySparksAction({
                      provider: settings.provider,
                      submolts: settings.submolts.length
                        ? settings.submolts
                        : DEFAULT_SUBMOLTS,
                    });

                    if (!response.success) {
                      toast({
                        title: "Generation failed",
                        description: response.message,
                      });
                      return;
                    }

                    setDigest(response.digest);
                    upsertDigest(response.digest);

                    toast({
                      title: "Fresh sparks generated",
                      description: `Captured ${response.digest.sparks.length} ideas from the agent internet.`,
                    });
                  });
                }}
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Agents are whispering...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Today&apos;s Sparks
                  </>
                )}
              </Button>

              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">
                <p className="flex items-center gap-2 text-white/90">
                  <Clock3 className="h-4 w-4 text-cyan-200" />
                  Last updated: {updatedAtLabel}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/55">
                  Auto-refreshes every 24h
                </p>
              </div>

              <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100/90">
                Using <span className="font-semibold uppercase">{settings.provider}</span> over
                {" "}
                {(settings.submolts.length ? settings.submolts : DEFAULT_SUBMOLTS).join(", ")}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Toaster />
      <p className="sr-only">{APP_COPY.loading}</p>
    </>
  );
}
