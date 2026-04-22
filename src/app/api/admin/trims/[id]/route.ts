import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/auth";
import { z } from "zod";
import { startOfWeek, endOfWeek, isoWeek } from "@/lib/utils";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  lengthMm: z.number().int().min(3000).max(6000).optional(),
  onRoadPriceIls: z.number().int().min(30_000).max(900_000).optional(),
  eRangeKm: z.number().int().min(0).max(1000).nullable().optional(),
  combinedKm: z.number().int().min(0).max(2000).nullable().optional(),
  powertrain: z.enum(["BEV", "PHEV", "HEV", "MHEV", "ICE"]).optional(),
  name: z.string().min(1).max(120).optional(), // trim name
  /** Monthly volume override — we persist as this week's snapshot. */
  currentMonthlyUnits: z.number().int().min(0).max(20_000).nullable().optional(),
});

/**
 * PATCH /api/admin/trims/:id
 *   Partial update for a Trim row. When a new monthly volume is supplied
 *   we write (or overwrite) this-week's SalesSnapshot with units = value/4.33
 *   so the dashboard picks up the change immediately.
 *   Marks `sourceSpecs = MANUAL` on the trim so the dashboard tooltip
 *   reflects the fact the row was edited by a human.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const { currentMonthlyUnits, ...trimPatch } = data;

  const existing = await prisma.trim.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "trim not found" }, { status: 404 });

  const updated = await prisma.trim.update({
    where: { id },
    data: {
      ...trimPatch,
      sourceSpecs: "MANUAL",
    },
  });

  if (currentMonthlyUnits != null) {
    const now = new Date();
    const s = startOfWeek(now);
    const e = endOfWeek(now);
    const weeklyUnits = Math.round(currentMonthlyUnits / 4.33);
    const existingSnap = await prisma.salesSnapshot.findFirst({
      where: {
        trimId: id,
        periodType: "WEEK",
        periodStart: s,
      },
    });
    if (existingSnap) {
      await prisma.salesSnapshot.update({
        where: { id: existingSnap.id },
        data: { units: weeklyUnits, source: "MANUAL" },
      });
    } else {
      await prisma.salesSnapshot.create({
        data: {
          modelId: updated.modelId,
          trimId: id,
          periodType: "WEEK",
          periodStart: s,
          periodEnd: e,
          year: s.getFullYear(),
          weekOfYear: isoWeek(s),
          units: weeklyUnits,
          source: "MANUAL",
        },
      });
    }
    // Also stamp the volume source for this trim.
    await prisma.trim.update({
      where: { id },
      data: { sourceVolume: "MANUAL" },
    });
  }

  return NextResponse.json({ ok: true, id: updated.id });
}
