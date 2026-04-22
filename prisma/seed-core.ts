/**
 * Realistic 2026 Israeli new passenger car seed data.
 *
 * Volumes, prices and spec sheets below are CURATED APPROXIMATIONS based on
 * I-VIA 2024–2025 trends (heavy Chinese + Korean presence, PHEV/HEV
 * dominance, EV ~15–20% share) and public Israeli importer prices. They are
 * good enough for demos but should be overwritten by the scraper on first
 * sync.
 */

import { PrismaClient } from "@prisma/client";
import type { Powertrain, OriginBucket } from "../src/lib/enums";
import { startOfWeek, endOfWeek, isoWeek } from "../src/lib/utils";

interface SeedTrim {
  name: string;
  powertrain: Powertrain;
  lengthMm: number;
  widthMm?: number;
  heightMm?: number;
  wheelbaseMm?: number;
  eRangeKm?: number;
  batteryKwh?: number;
  combinedKm?: number;
  power?: number;
  fwdAwd?: string;
  priceListIls: number;
  onRoadPriceIls: number;
  taxTier?: string;
  importerUrl?: string;
}

interface SeedModel {
  name: string;
  slug: string;
  segment: string;
  bodyStyle: string;
  weeklyAvgUnits: number;
  notes?: string;
  trims: SeedTrim[];
}

interface SeedBrand {
  name: string;
  slug: string;
  country: string;
  origin: OriginBucket;
  importerSite?: string;
  models: SeedModel[];
}

const BRANDS: SeedBrand[] = [
  {
    name: "Toyota",
    slug: "toyota",
    country: "Japan",
    origin: "JAPANESE",
    importerSite: "https://www.toyota.co.il",
    models: [
      {
        name: "Corolla",
        slug: "corolla",
        segment: "C",
        bodyStyle: "Sedan",
        weeklyAvgUnits: 320,
        trims: [
          {
            name: "1.8 Hybrid Luxury",
            powertrain: "HEV",
            lengthMm: 4630,
            widthMm: 1780,
            heightMm: 1435,
            wheelbaseMm: 2700,
            power: 103,
            priceListIls: 89_000,
            onRoadPriceIls: 169_900,
            taxTier: "15",
            importerUrl: "https://www.toyota.co.il/corolla",
          },
          {
            name: "1.8 Hybrid Executive",
            powertrain: "HEV",
            lengthMm: 4630,
            power: 103,
            priceListIls: 99_000,
            onRoadPriceIls: 189_900,
            taxTier: "14",
            importerUrl: "https://www.toyota.co.il/corolla",
          },
        ],
      },
      {
        name: "RAV4",
        slug: "rav4",
        segment: "J-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 180,
        trims: [
          {
            name: "2.5 Hybrid AWD",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 163,
            fwdAwd: "AWD",
            priceListIls: 135_000,
            onRoadPriceIls: 239_900,
            importerUrl: "https://www.toyota.co.il/rav4",
          },
          {
            name: "2.5 PHEV AWD",
            powertrain: "PHEV",
            lengthMm: 4600,
            batteryKwh: 18.1,
            eRangeKm: 75,
            power: 225,
            fwdAwd: "AWD",
            priceListIls: 175_000,
            onRoadPriceIls: 279_900,
          },
        ],
      },
      {
        name: "Yaris Cross",
        slug: "yaris-cross",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 140,
        trims: [
          {
            name: "1.5 Hybrid",
            powertrain: "HEV",
            lengthMm: 4180,
            power: 85,
            priceListIls: 82_000,
            onRoadPriceIls: 149_900,
          },
        ],
      },
    ],
  },
  {
    name: "Hyundai",
    slug: "hyundai",
    country: "Korea",
    origin: "KOREAN",
    importerSite: "https://www.hyundai.co.il",
    models: [
      {
        name: "Tucson",
        slug: "tucson",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 230,
        trims: [
          {
            name: "1.6 HEV Inspire",
            powertrain: "HEV",
            lengthMm: 4500,
            power: 169,
            priceListIls: 118_000,
            onRoadPriceIls: 209_900,
          },
          {
            name: "1.6 PHEV AWD Inspire",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 13.8,
            eRangeKm: 62,
            power: 195,
            fwdAwd: "AWD",
            priceListIls: 145_000,
            onRoadPriceIls: 249_900,
          },
        ],
      },
      {
        name: "Ioniq 5",
        slug: "ioniq-5",
        segment: "D-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 95,
        trims: [
          {
            name: "77.4 kWh RWD",
            powertrain: "BEV",
            lengthMm: 4655,
            batteryKwh: 77.4,
            eRangeKm: 507,
            power: 168,
            fwdAwd: "RWD",
            priceListIls: 170_000,
            onRoadPriceIls: 249_900,
          },
          {
            name: "77.4 kWh AWD N Line",
            powertrain: "BEV",
            lengthMm: 4655,
            batteryKwh: 77.4,
            eRangeKm: 481,
            power: 239,
            fwdAwd: "AWD",
            priceListIls: 195_000,
            onRoadPriceIls: 289_900,
          },
        ],
      },
      {
        name: "Kona",
        slug: "kona",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 120,
        trims: [
          {
            name: "Electric 64 kWh",
            powertrain: "BEV",
            lengthMm: 4355,
            batteryKwh: 64.8,
            eRangeKm: 454,
            power: 160,
            priceListIls: 125_000,
            onRoadPriceIls: 189_900,
          },
          {
            name: "1.6 HEV",
            powertrain: "HEV",
            lengthMm: 4355,
            power: 104,
            priceListIls: 95_000,
            onRoadPriceIls: 179_900,
          },
        ],
      },
    ],
  },
  {
    name: "Kia",
    slug: "kia",
    country: "Korea",
    origin: "KOREAN",
    importerSite: "https://www.kia.co.il",
    models: [
      {
        name: "Sportage",
        slug: "sportage",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 170,
        trims: [
          {
            name: "1.6 HEV",
            powertrain: "HEV",
            lengthMm: 4540,
            power: 169,
            priceListIls: 120_000,
            onRoadPriceIls: 214_900,
          },
          {
            name: "1.6 PHEV AWD",
            powertrain: "PHEV",
            lengthMm: 4540,
            batteryKwh: 13.8,
            eRangeKm: 60,
            power: 195,
            fwdAwd: "AWD",
            priceListIls: 148_000,
            onRoadPriceIls: 254_900,
          },
        ],
      },
      {
        name: "EV6",
        slug: "ev6",
        segment: "D-SUV",
        bodyStyle: "Crossover",
        weeklyAvgUnits: 70,
        trims: [
          {
            name: "77.4 kWh GT-Line AWD",
            powertrain: "BEV",
            lengthMm: 4695,
            batteryKwh: 77.4,
            eRangeKm: 480,
            power: 239,
            fwdAwd: "AWD",
            priceListIls: 200_000,
            onRoadPriceIls: 299_900,
          },
        ],
      },
      {
        name: "Niro",
        slug: "niro",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 85,
        trims: [
          {
            name: "EV 64 kWh",
            powertrain: "BEV",
            lengthMm: 4420,
            batteryKwh: 64.8,
            eRangeKm: 460,
            power: 150,
            priceListIls: 130_000,
            onRoadPriceIls: 194_900,
          },
        ],
      },
    ],
  },
  {
    name: "Chery",
    slug: "chery",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.chery.co.il",
    models: [
      {
        name: "Tiggo 8 Pro",
        slug: "tiggo-8-pro",
        segment: "D-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 220,
        trims: [
          {
            name: "1.5T PHEV",
            powertrain: "PHEV",
            lengthMm: 4722,
            batteryKwh: 19.4,
            eRangeKm: 96,
            power: 240,
            priceListIls: 125_000,
            onRoadPriceIls: 199_900,
          },
        ],
      },
      {
        name: "Tiggo 7 Pro",
        slug: "tiggo-7-pro",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 260,
        trims: [
          {
            name: "1.5T PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4520,
            batteryKwh: 18.3,
            eRangeKm: 93,
            power: 205,
            priceListIls: 108_000,
            onRoadPriceIls: 174_900,
          },
          {
            name: "1.6T DCT",
            powertrain: "ICE",
            lengthMm: 4520,
            power: 137,
            priceListIls: 78_000,
            onRoadPriceIls: 154_900,
          },
        ],
      },
    ],
  },
  {
    name: "BYD",
    slug: "byd",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.byd.co.il",
    models: [
      {
        name: "Atto 3",
        slug: "atto-3",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 160,
        trims: [
          {
            name: "Extended Range",
            powertrain: "BEV",
            lengthMm: 4455,
            batteryKwh: 60.5,
            eRangeKm: 420,
            power: 150,
            priceListIls: 115_000,
            onRoadPriceIls: 169_900,
          },
        ],
      },
      {
        name: "Seal",
        slug: "seal",
        segment: "D",
        bodyStyle: "Sedan",
        weeklyAvgUnits: 110,
        trims: [
          {
            name: "Design AWD",
            powertrain: "BEV",
            lengthMm: 4800,
            batteryKwh: 82.5,
            eRangeKm: 520,
            power: 390,
            fwdAwd: "AWD",
            priceListIls: 180_000,
            onRoadPriceIls: 254_900,
          },
        ],
      },
      {
        name: "Dolphin",
        slug: "dolphin",
        segment: "B",
        bodyStyle: "Hatchback",
        weeklyAvgUnits: 140,
        trims: [
          {
            name: "Extended Range",
            powertrain: "BEV",
            lengthMm: 4290,
            batteryKwh: 60.5,
            eRangeKm: 427,
            power: 150,
            priceListIls: 99_000,
            onRoadPriceIls: 149_900,
          },
        ],
      },
    ],
  },
  {
    name: "Geely",
    slug: "geely",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.geely.co.il",
    models: [
      {
        name: "Geometry C",
        slug: "geometry-c",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 95,
        trims: [
          {
            name: "Premium 70 kWh",
            powertrain: "BEV",
            lengthMm: 4432,
            batteryKwh: 70,
            eRangeKm: 500,
            power: 150,
            priceListIls: 118_000,
            onRoadPriceIls: 169_900,
          },
        ],
      },
    ],
  },
  {
    name: "MG",
    slug: "mg",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.mg.co.il",
    models: [
      {
        name: "MG4",
        slug: "mg4",
        segment: "C",
        bodyStyle: "Hatchback",
        weeklyAvgUnits: 130,
        trims: [
          {
            name: "Luxury 64 kWh",
            powertrain: "BEV",
            lengthMm: 4287,
            batteryKwh: 64,
            eRangeKm: 450,
            power: 150,
            priceListIls: 100_000,
            onRoadPriceIls: 149_900,
          },
        ],
      },
      {
        name: "HS",
        slug: "hs",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 80,
        trims: [
          {
            name: "PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4670,
            batteryKwh: 16.6,
            eRangeKm: 75,
            power: 190,
            priceListIls: 110_000,
            onRoadPriceIls: 179_900,
          },
        ],
      },
    ],
  },
  {
    name: "Changan",
    slug: "changan",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.changan.co.il",
    models: [
      {
        name: "UNI-T",
        slug: "uni-t",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 60,
        trims: [
          {
            name: "1.5T Turbo",
            powertrain: "ICE",
            lengthMm: 4515,
            power: 138,
            priceListIls: 70_000,
            onRoadPriceIls: 139_900,
          },
        ],
      },
    ],
  },
  {
    name: "Jaecoo",
    slug: "jaecoo",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.jaecoo.co.il",
    models: [
      {
        name: "J7",
        slug: "j7",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 140,
        trims: [
          {
            name: "PHEV SHS Premium",
            powertrain: "PHEV",
            lengthMm: 4700,
            batteryKwh: 18.3,
            eRangeKm: 106,
            power: 204,
            priceListIls: 118_000,
            onRoadPriceIls: 189_900,
          },
        ],
      },
    ],
  },
  {
    name: "Tesla",
    slug: "tesla",
    country: "USA",
    origin: "AMERICAN",
    importerSite: "https://www.tesla.com/he_IL",
    models: [
      {
        name: "Model Y",
        slug: "model-y",
        segment: "D-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 180,
        trims: [
          {
            name: "Long Range AWD",
            powertrain: "BEV",
            lengthMm: 4751,
            batteryKwh: 78.1,
            eRangeKm: 533,
            power: 378,
            fwdAwd: "AWD",
            priceListIls: 200_000,
            onRoadPriceIls: 269_900,
          },
          {
            name: "Performance",
            powertrain: "BEV",
            lengthMm: 4751,
            batteryKwh: 78.1,
            eRangeKm: 514,
            power: 393,
            fwdAwd: "AWD",
            priceListIls: 225_000,
            onRoadPriceIls: 299_900,
          },
        ],
      },
      {
        name: "Model 3",
        slug: "model-3",
        segment: "D",
        bodyStyle: "Sedan",
        weeklyAvgUnits: 120,
        trims: [
          {
            name: "Long Range AWD",
            powertrain: "BEV",
            lengthMm: 4720,
            batteryKwh: 78.1,
            eRangeKm: 629,
            power: 324,
            fwdAwd: "AWD",
            priceListIls: 195_000,
            onRoadPriceIls: 259_900,
          },
        ],
      },
    ],
  },
  {
    name: "Skoda",
    slug: "skoda",
    country: "Czech Republic",
    origin: "EUROPEAN",
    importerSite: "https://www.skoda.co.il",
    models: [
      {
        name: "Octavia",
        slug: "octavia",
        segment: "C",
        bodyStyle: "Sedan",
        weeklyAvgUnits: 100,
        trims: [
          {
            name: "1.5 TSI MHEV",
            powertrain: "MHEV",
            lengthMm: 4689,
            power: 110,
            priceListIls: 90_000,
            onRoadPriceIls: 179_900,
          },
        ],
      },
      {
        name: "Kodiaq",
        slug: "kodiaq",
        segment: "D-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 55,
        trims: [
          {
            name: "1.4 TSI iV PHEV",
            powertrain: "PHEV",
            lengthMm: 4758,
            batteryKwh: 25.7,
            eRangeKm: 120,
            power: 150,
            priceListIls: 180_000,
            onRoadPriceIls: 289_900,
          },
        ],
      },
    ],
  },
  {
    name: "Volkswagen",
    slug: "volkswagen",
    country: "Germany",
    origin: "EUROPEAN",
    importerSite: "https://www.volkswagen.co.il",
    models: [
      {
        name: "ID.4",
        slug: "id-4",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 60,
        trims: [
          {
            name: "Pro 77 kWh",
            powertrain: "BEV",
            lengthMm: 4584,
            batteryKwh: 77,
            eRangeKm: 522,
            power: 210,
            priceListIls: 190_000,
            onRoadPriceIls: 259_900,
          },
        ],
      },
      {
        name: "Tiguan",
        slug: "tiguan",
        segment: "C-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 45,
        trims: [
          {
            name: "1.5 eTSI MHEV",
            powertrain: "MHEV",
            lengthMm: 4539,
            power: 110,
            priceListIls: 140_000,
            onRoadPriceIls: 239_900,
          },
        ],
      },
    ],
  },
  {
    name: "Mazda",
    slug: "mazda",
    country: "Japan",
    origin: "JAPANESE",
    importerSite: "https://www.mazda.co.il",
    models: [
      {
        name: "CX-30",
        slug: "cx-30",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 70,
        trims: [
          {
            name: "2.0 e-Skyactiv G MHEV",
            powertrain: "MHEV",
            lengthMm: 4395,
            power: 110,
            priceListIls: 105_000,
            onRoadPriceIls: 194_900,
          },
        ],
      },
    ],
  },
  {
    name: "Renault",
    slug: "renault",
    country: "France",
    origin: "EUROPEAN",
    importerSite: "https://www.renault.co.il",
    models: [
      {
        name: "Captur",
        slug: "captur",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 55,
        trims: [
          {
            name: "E-Tech Full Hybrid",
            powertrain: "HEV",
            lengthMm: 4239,
            power: 107,
            priceListIls: 95_000,
            onRoadPriceIls: 174_900,
          },
        ],
      },
    ],
  },
  {
    name: "Suzuki",
    slug: "suzuki",
    country: "Japan",
    origin: "JAPANESE",
    importerSite: "https://www.suzuki.co.il",
    models: [
      {
        name: "Swift",
        slug: "swift",
        segment: "B",
        bodyStyle: "Hatchback",
        weeklyAvgUnits: 90,
        trims: [
          {
            name: "1.2 MHEV",
            powertrain: "MHEV",
            lengthMm: 3860,
            power: 61,
            priceListIls: 65_000,
            onRoadPriceIls: 109_900,
          },
        ],
      },
      {
        name: "Vitara",
        slug: "vitara",
        segment: "B-SUV",
        bodyStyle: "SUV",
        weeklyAvgUnits: 75,
        trims: [
          {
            name: "1.5 Full Hybrid",
            powertrain: "HEV",
            lengthMm: 4175,
            power: 85,
            priceListIls: 90_000,
            onRoadPriceIls: 164_900,
          },
        ],
      },
    ],
  },
];

// --- helper: synthetic weekly snapshots across the last 52 weeks ---
function generateWeeklySnapshots(
  weeklyAvg: number,
  now: Date,
  weeks: number,
  yearJitter = 1,
): { periodStart: Date; periodEnd: Date; units: number; year: number; weekOfYear: number }[] {
  const out: { periodStart: Date; periodEnd: Date; units: number; year: number; weekOfYear: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7 * i);
    const start = startOfWeek(d);
    const end = endOfWeek(d);
    // Seasonality: strong end-of-quarter & end-of-year pushes
    const month = start.getMonth();
    const seasonal =
      month === 11 ? 1.6 : month === 2 || month === 5 || month === 8 ? 1.25 : month === 0 ? 0.55 : 1;
    const jitter = 0.8 + Math.random() * 0.4;
    const units = Math.max(0, Math.round(weeklyAvg * seasonal * jitter * yearJitter));
    out.push({
      periodStart: start,
      periodEnd: end,
      units,
      year: start.getFullYear(),
      weekOfYear: isoWeek(start),
    });
  }
  return out;
}

/**
 * Runs the full seed against the provided (or a new) PrismaClient.
 * Safe to call from the Next.js server runtime as well as the CLI.
 */
export async function runSeed(client?: PrismaClient) {
  const prisma = client ?? new PrismaClient();
  console.log("→ Seeding IL CarLens database…");
  // Start clean
  await prisma.salesSnapshot.deleteMany();
  await prisma.trim.deleteMany();
  await prisma.model.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.ingestionRun.deleteMany();

  const now = new Date();
  let trimCount = 0;
  let snapshotCount = 0;

  for (const b of BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        name: b.name,
        slug: b.slug,
        country: b.country,
        origin: b.origin,
        importerSite: b.importerSite,
      },
    });

    for (const m of b.models) {
      const model = await prisma.model.create({
        data: {
          brandId: brand.id,
          name: m.name,
          slug: m.slug,
          segment: m.segment,
          bodyStyle: m.bodyStyle,
          notes: m.notes ?? null,
        },
      });

      const createdTrims = [] as { id: string; weight: number }[];
      for (const t of m.trims) {
        const trim = await prisma.trim.create({
          data: {
            modelId: model.id,
            name: t.name,
            powertrain: t.powertrain,
            lengthMm: t.lengthMm,
            widthMm: t.widthMm,
            heightMm: t.heightMm,
            wheelbaseMm: t.wheelbaseMm,
            eRangeKm: t.eRangeKm,
            batteryKwh: t.batteryKwh,
            combinedKm: t.combinedKm,
            power: t.power,
            fwdAwd: t.fwdAwd,
            priceListIls: t.priceListIls,
            onRoadPriceIls: t.onRoadPriceIls,
            taxTier: t.taxTier,
            importerUrl: t.importerUrl,
          },
        });
        createdTrims.push({ id: trim.id, weight: 1 / m.trims.length });
        trimCount++;
      }

      // Current year: full avg. Prior year: slightly lower.
      const snapshotsThisYear = generateWeeklySnapshots(m.weeklyAvgUnits, now, 52, 1);
      const priorNow = new Date(now);
      priorNow.setFullYear(priorNow.getFullYear() - 1);
      const snapshotsPriorYear = generateWeeklySnapshots(m.weeklyAvgUnits, priorNow, 52, 0.85);
      const all = [...snapshotsThisYear, ...snapshotsPriorYear];

      for (const s of all) {
        // split model-level weekly units across trims by equal weight
        for (const t of createdTrims) {
          const portion = Math.round(s.units * t.weight);
          if (portion <= 0) continue;
          await prisma.salesSnapshot.create({
            data: {
              modelId: model.id,
              trimId: t.id,
              periodType: "WEEK",
              periodStart: s.periodStart,
              periodEnd: s.periodEnd,
              year: s.year,
              weekOfYear: s.weekOfYear,
              units: portion,
              source: "SEED",
            },
          });
          snapshotCount++;
        }
      }
    }
    console.log(`  ✓ ${b.name} — ${b.models.length} models`);
  }

  // Alerts
  await prisma.alert.createMany({
    data: [
      {
        severity: "critical",
        title: "Chery Tiggo 7 Pro overtakes Tucson in C-SUV PHEV",
        body: "Chery Tiggo 7 Pro PHEV crossed Hyundai Tucson PHEV on a 4-week rolling basis with a 14% price advantage. Consider pricing response or equipment bundle.",
      },
      {
        severity: "warn",
        title: "BYD Atto 3 inventory tightening",
        body: "Delivery windows slipped from 2 to 5 weeks across 3 importer branches. EV segment demand remains elevated.",
      },
      {
        severity: "info",
        title: "I-VIA week 16 report published",
        body: "Weekly report ingested successfully. EV share 19.3%, PHEV share 27.8%, Chinese brand share 34.2%.",
      },
    ],
  });

  await prisma.ingestionRun.create({
    data: {
      source: "SEED",
      ok: true,
      finishedAt: new Date(),
      rowsUpserted: trimCount + snapshotCount,
    },
  });

  console.log(`✓ Seed complete. trims=${trimCount} snapshots=${snapshotCount}`);
  if (!client) await prisma.$disconnect();
}
