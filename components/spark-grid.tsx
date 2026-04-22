"use client";

import { SparkCard } from "@/components/spark-card";
import type { Spark } from "@/types/sparks";

type SparkGridProps = {
  sparks: Spark[];
  onSaveSpark: (spark: Spark) => void;
};

export function SparkGrid({ sparks, onSaveSpark }: SparkGridProps) {
  if (!sparks.length) {
    return (
      <div className="rounded-2xl border border-white/15 bg-black/30 px-6 py-12 text-center text-white/75">
        No sparks generated yet. Run <span className="font-semibold text-cyan-100">Generate Today’s Sparks</span>
        to pull fresh ideas from Moltbook.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {sparks.map((spark) => (
        <SparkCard key={spark.id} spark={spark} onSave={onSaveSpark} />
      ))}
    </div>
  );
}
