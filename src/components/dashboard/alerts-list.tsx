import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  severity: string;
  title: string;
  body: string;
  createdAt: Date;
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly intelligence alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 && (
          <div className="text-sm text-muted-foreground">All quiet on the Mediterranean.</div>
        )}
        {alerts.map((a) => {
          const Icon =
            a.severity === "critical"
              ? OctagonAlert
              : a.severity === "warn"
              ? AlertTriangle
              : Info;
          const tone =
            a.severity === "critical"
              ? "text-red-700 bg-red-50 border-red-200"
              : a.severity === "warn"
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-sky-700 bg-sky-50 border-sky-200";
          return (
            <div
              key={a.id}
              className={cn("rounded-lg border p-3 flex gap-3 items-start", tone)}
            >
              <Icon className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-foreground">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.body}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
