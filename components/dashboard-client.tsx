"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Clock3, RefreshCw, Sparkles } from "lucide-react";

import { Hero } from "@/components/hero";
import { SparkGrid } from "@/components/spark-grid";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateTodaySparksAction, saveApiKeyAction } from "@/lib/actions";
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
  const [settings, setSettings] = useState<DashboardSettings>(initialSettings);
  const [quickApiKey, setQuickApiKey] = useState("");
  const [hasEncryptedToken, setHasEncryptedToken] = useState(
    initialSettings.apiKey === "stored",
  );

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

  useEffect(() => {
    const cachedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    if (!cachedSettings) {
      return;
    }

    try {
      const parsed = JSON.parse(cachedSettings) as DashboardSettings;
      setSettings((current) => ({ ...current, ...parsed }));
      if (parsed.apiKey?.trim()) {
        setQuickApiKey(parsed.apiKey.trim());
      }
    } catch {
      // Ignore malformed local data and continue with defaults.
    }
  }, []);

  const activeSubmolts = useMemo(
    () => (settings.submolts.length ? settings.submolts : DEFAULT_SUBMOLTS),
    [settings.submolts],
  );

  const persistApiKey = async (token: string) => {
    const response = await saveApiKeyAction({ token });

    if (!response.success) {
      return response;
    }

    setHasEncryptedToken(true);
    const cachedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    const parsed = cachedSettings ? (JSON.parse(cachedSettings) as DashboardSettings) : {};

    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({
        ...parsed,
        provider: settings.provider,
        submolts: activeSubmolts,
        apiKey: token,
      } satisfies DashboardSettings),
    );

    return response;
  };

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
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                  One-time Moltbook key setup
                </p>
                <Input
                  type="password"
                  value={quickApiKey}
                  onChange={(event) => setQuickApiKey(event.target.value)}
                  placeholder="Paste your Moltbook API key here"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isPending || quickApiKey.trim().length < 8}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await persistApiKey(quickApiKey.trim());
                      toast({
                        title: result.success ? "API key saved" : "Could not save API key",
                        description: result.message,
                      });
                    });
                  }}
                >
                  Save key and unlock generation
                </Button>
                <p className="text-xs text-white/55">
                  {hasEncryptedToken
                    ? "Secure key cookie is active."
                    : "No secure key found yet. Save once, then generate instantly."}
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const token = quickApiKey.trim();

                    if (!hasEncryptedToken && !token) {
                      toast({
                        title: "Moltbook key required",
                        description:
                          "Paste your Moltbook API key above once, then click Generate again.",
                      });
                      return;
                    }

                    if (token) {
                      const saved = await persistApiKey(token);
                      if (!saved.success) {
                        toast({
                          title: "Generation failed",
                          description: saved.message,
                        });
                        return;
                      }
                    }

                    const response = await generateTodaySparksAction({
                      provider: settings.provider,
                      submolts: activeSubmolts,
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
                {activeSubmolts.join(", ")}
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
