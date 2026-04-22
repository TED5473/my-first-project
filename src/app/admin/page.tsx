import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminActions } from "@/components/admin/admin-actions";
import { getLatestIngestions } from "@/lib/queries";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const runs = await getLatestIngestions(20);
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Trigger a manual refresh of the pipeline, or inspect recent ingestion runs.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline controls</CardTitle>
            <CardDescription>Admin token required in production.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminActions />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>Last 20 scraping jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-medium">{r.source}</div>
                  <div className="text-xs text-muted-foreground">
                    Started {formatDistanceToNow(r.startedAt, { addSuffix: true })} ·{" "}
                    {r.rowsUpserted} rows
                  </div>
                  {r.error && <div className="text-xs text-red-400 mt-1">{r.error}</div>}
                </div>
                <Badge variant={r.ok ? "success" : "danger"}>{r.ok ? "ok" : "failed"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
