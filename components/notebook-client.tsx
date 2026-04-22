"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, FileJson, NotebookTabs } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";
import type { NotebookItem } from "@/types/sparks";

type ExportFormat = "markdown" | "json";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toMarkdown(items: NotebookItem[]): string {
  return items
    .map((item) => {
      const tags = item.tags.join(" ");
      return `## ${item.title}\n\n**Premise:** ${item.premise}\n\n${item.blurb}\n\nTags: ${tags}\n\nSource: ${item.sourcePostUrl} (${item.sourceSubmolt})\nSaved: ${item.savedAt}\n`;
    })
    .join("\n---\n\n");
}

export function NotebookClient() {
  const [items, setItems] = useState<NotebookItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.notebook);

    if (!raw) {
      return;
    }

    try {
      setItems(JSON.parse(raw) as NotebookItem[]);
    } catch {
      // Ignore malformed notebook data
    }
  }, []);

  const hasItems = items.length > 0;

  const stats = useMemo(() => {
    const tagSet = new Set(items.flatMap((item) => item.tags));
    return {
      total: items.length,
      tags: tagSet.size,
    };
  }, [items]);

  const exportNotebook = (formatType: ExportFormat) => {
    if (!hasItems) {
      return;
    }

    if (formatType === "markdown") {
      downloadFile(
        `sci-fi-notebook-${new Date().toISOString().slice(0, 10)}.md`,
        toMarkdown(items),
        "text/markdown;charset=utf-8",
      );
      return;
    }

    downloadFile(
      `sci-fi-notebook-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(items, null, 2),
      "application/json;charset=utf-8",
    );
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    setItems(filtered);
    localStorage.setItem(STORAGE_KEYS.notebook, JSON.stringify(filtered));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-white">
            <NotebookTabs className="h-5 w-5 text-cyan-200" />
            Novel Notebook
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-white/80">
          <span className="rounded-lg border border-white/15 bg-black/30 px-3 py-1">
            Saved sparks: {stats.total}
          </span>
          <span className="rounded-lg border border-white/15 bg-black/30 px-3 py-1">
            Unique tags: {stats.tags}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => exportNotebook("markdown")} disabled={!hasItems}>
              <Download className="h-4 w-4" />
              Export Markdown
            </Button>
            <Button variant="outline" onClick={() => exportNotebook("json")} disabled={!hasItems}>
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasItems ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="bg-black/45">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl text-white">{item.title}</CardTitle>
                <p className="text-sm text-cyan-100/90">{item.premise}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/80">{item.blurb}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-white/55">
                  Saved {format(new Date(item.savedAt), "PPpp")} · {item.sourceSubmolt}
                </p>
                <div className="flex gap-2">
                  <a
                    className={cn(
                      "inline-flex items-center rounded-lg border border-cyan-200/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-50 hover:bg-cyan-500/20",
                    )}
                    href={item.sourcePostUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source post
                  </a>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:border-white/45"
                  >
                    Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-14 text-center text-white/70">
            Your notebook is empty. Save sparks from the dashboard or archive to start building your
            next saga.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
