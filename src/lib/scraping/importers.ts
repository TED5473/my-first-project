/**
 * Importer website scrapers — refresh trim prices, specs and e-range.
 *
 * One adapter per importer; shape is intentionally identical so we can add
 * brands quickly. In production, each adapter is a small Playwright script
 * that hydrates the brand's "דגמים" page and extracts trim cards.
 *
 * The DEMO path reads current Trim records and re-upserts them — useful for
 * end-to-end wiring without Playwright installed.
 */

import { prisma } from "../db";
import type { Powertrain } from "../enums";

export interface ImporterTrim {
  brand: string;
  model: string;
  trim: string;
  powertrain: Powertrain;
  lengthMm: number;
  priceListIls?: number;
  onRoadPriceIls: number;
  eRangeKm?: number;
  batteryKwh?: number;
  power?: number;
  importerUrl: string;
}

type Adapter = () => Promise<ImporterTrim[]>;

const ADAPTERS: Record<string, Adapter> = {
  toyota: async () => [],   // TODO: scrape https://www.toyota.co.il
  hyundai: async () => [],  // TODO: scrape https://www.hyundai.co.il
  kia: async () => [],      // TODO: scrape https://www.kia.co.il
  chery: async () => [],    // TODO: scrape https://www.chery.co.il
  byd: async () => [],      // TODO: scrape https://www.byd.co.il
  jaecoo: async () => [],   // TODO: scrape https://www.jaecoo.co.il
  changan: async () => [],  // TODO: scrape https://www.changan.co.il
  mg: async () => [],       // TODO: scrape https://www.mg.co.il
};

export async function runImportersRefresh(opts: { demo?: boolean } = {}) {
  const run = await prisma.ingestionRun.create({
    data: { source: "IMPORTERS", ok: false },
  });
  try {
    let rows: ImporterTrim[] = [];
    if (opts.demo || process.env.NODE_ENV !== "production") {
      rows = await demoRowsFromTrims();
    } else {
      for (const fn of Object.values(ADAPTERS)) {
        rows.push(...(await fn()));
      }
    }

    let upserted = 0;
    for (const r of rows) {
      const model = await prisma.model.findFirst({
        where: { name: r.model, brand: { name: r.brand } },
      });
      if (!model) continue;
      await prisma.trim.upsert({
        where: { modelId_name: { modelId: model.id, name: r.trim } },
        create: {
          modelId: model.id,
          name: r.trim,
          powertrain: r.powertrain,
          lengthMm: r.lengthMm,
          priceListIls: r.priceListIls ?? 0,
          onRoadPriceIls: r.onRoadPriceIls,
          eRangeKm: r.eRangeKm,
          batteryKwh: r.batteryKwh,
          power: r.power,
          importerUrl: r.importerUrl,
        },
        update: {
          powertrain: r.powertrain,
          lengthMm: r.lengthMm,
          onRoadPriceIls: r.onRoadPriceIls,
          priceListIls: r.priceListIls ?? undefined,
          eRangeKm: r.eRangeKm,
          batteryKwh: r.batteryKwh,
          power: r.power,
          importerUrl: r.importerUrl,
        },
      });
      upserted++;
    }

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

async function demoRowsFromTrims(): Promise<ImporterTrim[]> {
  const trims = await prisma.trim.findMany({
    include: { model: { include: { brand: true } } },
  });
  return trims.map<ImporterTrim>((t) => ({
    brand: t.model.brand.name,
    model: t.model.name,
    trim: t.name,
    powertrain: t.powertrain as Powertrain,
    lengthMm: t.lengthMm,
    priceListIls: t.priceListIls,
    onRoadPriceIls: t.onRoadPriceIls,
    eRangeKm: t.eRangeKm ?? undefined,
    batteryKwh: t.batteryKwh ?? undefined,
    power: t.power ?? undefined,
    importerUrl: t.importerUrl ?? "",
  }));
}
