import type { Metadata } from "next";

import { SettingsClient } from "@/components/settings-client";
import { DEFAULT_SUBMOLTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure Moltbook API credentials, watched submolts, and LLM provider.",
};

export default function SettingsPage() {
  return (
    <SettingsClient
      initialSettings={{
        provider: "openai",
        submolts: DEFAULT_SUBMOLTS,
      }}
    />
  );
}
