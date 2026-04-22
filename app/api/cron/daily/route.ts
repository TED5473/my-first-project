import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Cron endpoint reachable. Wire this endpoint to your preferred persistence layer or queue for daily digest generation.",
    timestamp: new Date().toISOString(),
  });
}
