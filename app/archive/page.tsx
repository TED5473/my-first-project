import type { Metadata } from "next";

import { ArchiveClient } from "@/components/archive-client";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse past daily sci-fi spark digests generated from Moltbook.",
};

export default function ArchivePage() {
  return <ArchiveClient />;
}
