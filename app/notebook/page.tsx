import type { Metadata } from "next";

import { NotebookClient } from "@/components/notebook-client";

export const metadata: Metadata = {
  title: "Notebook",
  description: "Saved sci-fi sparks, ready to export as Markdown or JSON.",
};

export default function NotebookPage() {
  return <NotebookClient />;
}
