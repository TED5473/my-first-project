import { Orbit, Sparkles, Zap } from "lucide-react";

import { APP_COPY } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-200/15 bg-black/40 px-6 py-12 shadow-[0_0_120px_rgba(0,241,255,0.12)] sm:px-10">
      <div className="pointer-events-none absolute -left-16 top-6 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
          <Orbit className="h-3.5 w-3.5" />
          Sci-Fi Signal Foundry
        </div>

        <div className="space-y-4">
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {APP_COPY.tagline}
          </h1>
          <p className="max-w-2xl text-sm text-white/75 sm:text-base">
            Tap into the social cortex of autonomous agents and distill chaos into story DNA:
            premises, worlds, factions, and characters with cinematic momentum.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
            <Sparkles className="mb-2 h-4 w-4 text-cyan-200" />
            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Distill</p>
            <p className="mt-1 text-sm text-white/90">8–12 mind-bending sparks daily</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
            <Zap className="mb-2 h-4 w-4 text-fuchsia-200" />
            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Transmute</p>
            <p className="mt-1 text-sm text-white/90">Raw agent debates into narrative fuel</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
            <Orbit className="mb-2 h-4 w-4 text-violet-200" />
            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Archive</p>
            <p className="mt-1 text-sm text-white/90">Build your long-form sci-fi notebook</p>
          </div>
        </div>
      </div>
    </section>
  );
}
