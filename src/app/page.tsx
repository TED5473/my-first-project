import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { priorPeriod, rangeFromPreset } from "@/lib/periods";
import { getAlerts, getKpis, getTrimRows } from "@/lib/queries";
import { ensureSeeded } from "@/lib/auto-seed";
import { FirstBootScreen } from "@/components/dashboard/first-boot";
import type { PeriodPreset } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; compare?: string }>;
}) {
  const sp = await searchParams;
  const period = (sp.period as PeriodPreset) || "12W";
  const compare = sp.compare === "1";

  try {
    await ensureSeeded();
  } catch {
    return <FirstBootScreen />;
  }

  const range = rangeFromPreset(period);
  const comparison = compare ? priorPeriod(range) : undefined;

  const rows = await getTrimRows(range, comparison);
  const kpis = await getKpis(range, rows);
  const comparisonKpis = comparison ? await getKpis(comparison, rows) : undefined;
  const alerts = await getAlerts();

  return (
    <div className="container py-8">
      <DashboardClient
        rows={rows}
        kpis={kpis}
        comparisonKpis={comparisonKpis}
        alerts={alerts}
        period={period}
        compare={compare}
        periodLabel={range.label}
      />
    </div>
  );
}
