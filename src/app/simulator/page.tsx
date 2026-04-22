import { SimulatorClient } from "@/components/simulator/simulator-client";
import { rangeFromPreset } from "@/lib/periods";
import { getTrimRows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const range = rangeFromPreset("12W");
  const rows = await getTrimRows(range);
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Launch Simulator
        </h1>
        <p className="text-muted-foreground mt-1">
          Position a hypothetical model in Israel's market. Pricing auto-computes the
          on-road price using 2026 purchase-tax tiers + 17% VAT. The volume band is
          estimated from nearest neighbors in length × price space.
        </p>
      </div>
      <SimulatorClient rows={rows} />
    </div>
  );
}
