import Link from "next/link";
import { Radar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-white">
            <Radar className="h-6 w-6 text-fuchsia-200" />
            404 · Signal Lost in the Datasphere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80">
          <p>
            This page drifted beyond mapped spacetime. Try returning to the dashboard and launch a
            new narrative trajectory.
          </p>
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
