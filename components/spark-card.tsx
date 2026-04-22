"use client";

import { ExternalLink, NotebookPen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Spark } from "@/types/sparks";

type SparkCardProps = {
  spark: Spark;
  onSave: (spark: Spark) => void;
};

export function SparkCard({ spark, onSave }: SparkCardProps) {
  return (
    <Card className="group h-full border-white/15 bg-black/45 transition hover:border-cyan-200/35 hover:bg-black/55 hover:shadow-[0_0_45px_rgba(0,241,255,0.18)]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.18em]">
            {spark.sourceSubmolt}
          </Badge>
          <a
            href={spark.sourcePostUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-100/80 hover:text-cyan-100"
          >
            Source <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <CardTitle className="text-xl leading-tight text-white">{spark.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-cyan-100/95">{spark.premise}</p>
        <p className="text-sm leading-relaxed text-white/80">{spark.blurb}</p>
        <div className="flex flex-wrap gap-1.5">
          {spark.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-white/5">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onSave(spark);
          }}
        >
          <NotebookPen className="h-4 w-4" />
          Save to Novel Notebook
        </Button>
      </CardFooter>
    </Card>
  );
}
