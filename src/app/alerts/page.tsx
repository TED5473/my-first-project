import { AlertsList } from "@/components/dashboard/alerts-list";
import { getAlerts, getLatestIngestions } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alerts, runs] = await Promise.all([getAlerts(50), getLatestIngestions(10)]);
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Weekly intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Everything our pipeline flagged in the last few weeks, plus ingestion audit log.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertsList alerts={alerts} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ingestion runs</CardTitle>
            <CardDescription>Last {runs.length} scraping jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {runs.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-medium">{r.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(r.startedAt, { addSuffix: true })} ·{" "}
                    {r.rowsUpserted} rows
                  </div>
                  {r.error && <div className="text-xs text-red-400 mt-1">{r.error}</div>}
                </div>
                <Badge variant={r.ok ? "success" : "danger"}>{r.ok ? "ok" : "failed"}</Badge>
              </div>
            ))}
            {runs.length === 0 && (
              <div className="text-sm text-muted-foreground">No runs yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
