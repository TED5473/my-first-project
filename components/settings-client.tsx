"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import { clearApiKeyAction, saveApiKeyAction } from "@/lib/actions";
import { DEFAULT_SUBMOLTS, LLM_PROVIDERS } from "@/lib/constants";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { settingsSchema, type DashboardSettings, type LlmProvider } from "@/types/sparks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

type SettingsClientProps = {
  initialSettings: DashboardSettings;
};

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [tokenInput, setTokenInput] = useState("");
  const [provider, setProvider] = useState<LlmProvider>(initialSettings.provider);
  const [submoltsInput, setSubmoltsInput] = useState(initialSettings.submolts.join(", "));

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DashboardSettings;
      if (parsed.provider) {
        setProvider(parsed.provider);
      }
      if (parsed.submolts?.length) {
        setSubmoltsInput(parsed.submolts.join(", "));
      }
    } catch {
      // Ignore malformed local data.
    }
  }, []);

  const parsedSubmolts = useMemo(
    () =>
      submoltsInput
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => (entry.startsWith("m/") ? entry : `m/${entry}`)),
    [submoltsInput],
  );

  return (
    <>
      <div className="space-y-6 pb-20 md:pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <KeyRound className="h-5 w-5 text-cyan-200" />
              Moltbook API Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Bearer token</Label>
              <Input
                id="token"
                type="password"
                autoComplete="off"
                placeholder="moltbook_xxx"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  startTransition(async () => {
                    const token = tokenInput.trim();
                    const response = await saveApiKeyAction({ token });

                    if (response.success) {
                      const raw = localStorage.getItem(STORAGE_KEYS.settings);
                      const cached = raw ? (JSON.parse(raw) as DashboardSettings) : null;
                      localStorage.setItem(
                        STORAGE_KEYS.settings,
                        JSON.stringify({
                          provider: cached?.provider ?? provider,
                          submolts: cached?.submolts ?? parsedSubmolts ?? DEFAULT_SUBMOLTS,
                          apiKey: token,
                        } satisfies DashboardSettings),
                      );
                    }

                    toast({
                      title: response.success ? "Token saved securely" : "Token was not saved",
                      description: response.message,
                    });
                  });
                }}
                disabled={isPending || tokenInput.trim().length < 8}
              >
                <ShieldCheck className="h-4 w-4" />
                Save encrypted cookie
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  startTransition(async () => {
                    const response = await clearApiKeyAction();
                    toast({ title: "Token removed", description: response.message });
                  });
                }}
                disabled={isPending}
              >
                Clear secure token
              </Button>
            </div>

            <p className="text-xs text-white/60">
              Token is encrypted server-side before storing in an HTTP-only cookie for convenience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-fuchsia-200" />
              Spark generation preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LLM provider</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as LlmProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry === "xai" ? "Grok / xAI" : entry.charAt(0).toUpperCase() + entry.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submolts">Submolts to watch (comma separated)</Label>
              <Textarea
                id="submolts"
                rows={4}
                value={submoltsInput}
                onChange={(event) => setSubmoltsInput(event.target.value)}
                placeholder="m/general, m/philosophy, m/science"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_SUBMOLTS.map((submolt) => (
                <button
                  key={submolt}
                  type="button"
                  onClick={() => {
                    if (!parsedSubmolts.includes(submolt)) {
                      setSubmoltsInput((previous) =>
                        previous.trim().length ? `${previous}, ${submolt}` : submolt,
                      );
                    }
                  }}
                  className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/75 hover:border-cyan-200/60"
                >
                  + {submolt}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                const normalized: DashboardSettings = {
                  provider,
                  submolts: parsedSubmolts.length ? parsedSubmolts : DEFAULT_SUBMOLTS,
                  apiKey: undefined,
                };

                const validated = settingsSchema.safeParse(normalized);

                if (!validated.success) {
                  toast({
                    title: "Settings invalid",
                    description: "Please provide at least one valid submolt.",
                  });
                  return;
                }

                localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(validated.data));
                toast({
                  title: "Settings saved",
                  description: "Dashboard preferences updated successfully.",
                });
              }}
            >
              Save local preferences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Vercel daily cron note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/75">
            <p>
              Add a cron job in Vercel to ping <code>/api/cron/daily</code> every 24 hours. The
              endpoint is included for extension and can be wired to background generation.
            </p>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-cyan-100">
{`{
  "crons": [{ "path": "/api/cron/daily", "schedule": "0 10 * * *" }]
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
