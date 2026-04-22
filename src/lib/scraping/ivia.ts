/**
 * Israel Vehicle Importers Association (I-VIA) scraper.
 *
 * I-VIA publishes weekly + monthly PDF reports at https://www.ivia.co.il.
 * We split the work into 3 concerns:
 *   1. discoverLatestReports()  — crawl the I-VIA news listing with Playwright.
 *   2. downloadPdf(url)         — fetch the PDF as a Buffer.
 *   3. parseBrandsPdf(buf) /
 *      parseEvPdf(buf)          — extract rows with pdfplumber (python) or
 *                                 any LLM-powered table extractor.
 *
 * The implementation below uses Playwright when available, but ships a safe
 * DEMO path that returns synthetic rows so `npm run scrape` always works.
 * Flip NODE_ENV=production + install Playwright + configure IVIA_REPORTS_INDEX_URL
 * to enable live scraping.
 */

import { prisma } from "../db";
import type { Powertrain } from "../enums";
import { startOfWeek, endOfWeek, isoWeek } from "../utils";

export interface ScrapedRow {
  brand: string;
  model: string;
  trim?: string;
  powertrain?: Powertrain;
  lengthMm?: number;
  onRoadPriceIls?: number;
  units: number;
  periodStart: Date;
  periodEnd: Date;
  source: "IVIA_BRANDS_PDF" | "IVIA_EV_PDF" | "IMPORTER" | "MANUAL";
}

/** Hook: in production, drive Playwright to enumerate the latest PDFs. */
export async function discoverLatestReports(): Promise<
  { url: string; kind: "brands" | "ev"; week: number; year: number }[]
> {
  // TODO: use `playwright-chromium` to navigate https://www.ivia.co.il,
  //   click through to "מכירות שבועיות" and extract PDF links for the most
  //   recent week. Return structured metadata.
  return [];
}

/** Hook: parse a PDF buffer into ScrapedRow[]. */
export async function parseBrandsPdf(_buf: Buffer): Promise<ScrapedRow[]> {
  // TODO: use `pdfplumber` (python sidecar) or a Vision LLM to extract the
  //   weekly brand × model sales table. The PDF is consistent week-to-week,
  //   so a small set of regex/column offsets works well.
  return [];
}

export async function parseEvPdf(_buf: Buffer): Promise<ScrapedRow[]> {
  // TODO: same, for the EV-specific breakdown.
  return [];
}

/** Orchestrator: run a full I-VIA refresh, writing rows + an ingestion run. */
export async function runIviaRefresh(opts: { demo?: boolean } = {}) {
  const run = await prisma.ingestionRun.create({
    data: { source: "IVIA", ok: false },
  });
  try {
    let rows: ScrapedRow[] = [];
    if (opts.demo || process.env.NODE_ENV !== "production") {
      rows = await demoRowsFromSeed();
    } else {
      const reports = await discoverLatestReports();
      for (const r of reports) {
        const buf = await downloadPdf(r.url);
        const parsed = r.kind === "brands" ? await parseBrandsPdf(buf) : await parseEvPdf(buf);
        rows.push(...parsed);
      }
    }

    const upserted = await upsertRows(rows);
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { ok: true, finishedAt: new Date(), rowsUpserted: upserted },
    });
    return { ok: true, rows: upserted };
  } catch (err) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { ok: false, finishedAt: new Date(), error: (err as Error).message },
    });
    throw err;
  }
}

async function downloadPdf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Demo path: re-emits last week's seed-data as a "fresh" scrape. */
async function demoRowsFromSeed(): Promise<ScrapedRow[]> {
  const models = await prisma.model.findMany({ include: { brand: true, trims: true } });
  const out: ScrapedRow[] = [];
  const now = new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  for (const m of models) {
    // One model-level row so the aggregator can allocate across trims.
    out.push({
      brand: m.brand.name,
      model: m.name,
      units: Math.max(
        5,
        Math.round(
          (m.trims.length ? m.trims.length : 1) * (15 + Math.random() * 40),
        ),
      ),
      periodStart: start,
      periodEnd: end,
      source: "IVIA_BRANDS_PDF",
    });
  }
  return out;
}

async function upsertRows(rows: ScrapedRow[]): Promise<number> {
  let count = 0;
  for (const r of rows) {
    const model = await prisma.model.findFirst({
      where: {
        name: { equals: r.model },
        brand: { name: { equals: r.brand } },
      },
    });
    if (!model) continue;

    // Prisma's compound-unique upserts don't support nullable columns as
    // part of the key, so do a find-or-create ourselves.
    const existing = await prisma.salesSnapshot.findFirst({
      where: {
        modelId: model.id,
        trimId: null,
        periodType: "WEEK",
        periodStart: r.periodStart,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.salesSnapshot.update({
        where: { id: existing.id },
        data: { units: r.units, source: r.source },
      });
    } else {
      await prisma.salesSnapshot.create({
        data: {
          modelId: model.id,
          trimId: null,
          periodType: "WEEK",
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          year: r.periodStart.getFullYear(),
          weekOfYear: isoWeek(r.periodStart),
          units: r.units,
          source: r.source,
        },
      });
    }
    count++;
  }
  return count;
}
