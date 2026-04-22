import { cookies } from "next/headers";

import { DashboardClient } from "@/components/dashboard-client";
import { COOKIE_NAMES, DEFAULT_SUBMOLTS } from "@/lib/constants";
import type { DashboardSettings } from "@/types/sparks";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasEncryptedToken = Boolean(cookieStore.get(COOKIE_NAMES.encryptedToken));

  const initialSettings: DashboardSettings = {
    apiKey: hasEncryptedToken ? "stored" : "",
    provider: "openai",
    submolts: DEFAULT_SUBMOLTS,
  };

  return <DashboardClient initialDigest={null} initialSettings={initialSettings} />;
}
