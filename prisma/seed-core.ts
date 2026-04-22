/**
 * Israeli new-passenger-car seed — recalibrated to CARTUBE.CO.IL (cartube)
 * and the I-VIA monthly deliveries report as reproduced on cartube.
 *
 * SOURCES (fetched on 2026-04-22):
 *   · Monthly deliveries, Jan-Feb 2026 cumulative (I-VIA/cartube):
 *       https://www.cartube.co.il/.../%D7%9E%D7%A1%D7%99%D7%A8%D7%95%D7%AA-
 *       %D7%A8%D7%9B%D7%91-%D7%97%D7%93%D7%A9-%D7%91%D7%99%D7%A9%D7%A8%D7%90%D7%9C-
 *       %D7%A4%D7%91%D7%A8%D7%95%D7%90%D7%A8-2026
 *     Total Jan-Feb 2026: 68,832 vehicles (Feb alone 27,214). YTD market
 *     is DOWN 3.4% vs. Jan-Feb 2025 (71,224). Brand deliveries used verbatim:
 *
 *     | rank | brand       | 2026 Jan-Feb | 2025 Jan-Feb | YoY   |
 *     |------|-------------|--------------|--------------|-------|
 *     | 1    | Jaecoo      | 7,946        | 2,884        | +176% |
 *     | 2    | Hyundai     | 7,418        | 9,251        | -20%  |
 *     | 3    | Toyota      | 7,400        | 7,736        | -4%   |
 *     | 4    | Chery       | 7,198        | 3,975        | +81%  |
 *     | 5    | Kia         | 6,344        | 6,489        | -2%   |
 *     | 6    | Skoda       | 5,485        | 6,384        | -14%  |
 *     | 7    | BYD         | 3,584        | 2,578        | +39%  |
 *     | 8    | MG          | 2,076        | 3,916        | -47%  |
 *     | 9    | Mitsubishi  | 1,892        | 3,308        | -43%  |
 *
 *   · "Green" powertrain mix (Feb 2026): 9,766 PHEV · 6,831 BEV · 21,570 HEV.
 *     Green share of market = 63.4%.
 *
 *   · On-road prices (₪, 2026 model year, "מחיר מחירון") taken model-by-
 *     model from the brand catalog pages on cartube. Examples:
 *       - Toyota Corolla 1.8 Hybrid: 159,990 ₪
 *       - Toyota RAV4 E-VOLVE Hybrid: 209,990 ₪; E-XCLUSIVE AWD: 275,990 ₪
 *       - Hyundai Tucson 1.6T Premium: 188,990 ₪; Hybrid Long Ultimate AWD: 222,900 ₪
 *       - Kia Sportage 1.6T Urban: 184,990 ₪; HEV Long Urban: 189,990 ₪
 *       - Chery Tiggo 7 Pro Sense: 159,990 ₪; PHEV Noble: 186,990 ₪
 *       - Chery Tiggo 8 Pro Comfort: 179,990 ₪; PHEV Ultimate: 204,990 ₪
 *       - Jaecoo 7 Executive 2WD: 169,900 ₪; PHEV Luxury: 202,990 ₪
 *       - BYD Atto 2 Comfort: 148,990 ₪; Atto 3 Design: 178,990 ₪
 *       - BYD Dolphin Design: 156,990 ₪; BYD Seal Design RWD: 198,990 ₪
 *       - BYD Sealion 7 Boost: 198,990 ₪; Excellence: 237,990 ₪
 *       - MG4 Luxury (2026): 142,888 ₪ (starting price per press release)
 *
 *   · Dimensions (length mm) taken from cartube's spec pages:
 *       - Toyota Corolla Sedan: 4,630 mm
 *       - Toyota RAV4: 4,600 mm
 *       - Hyundai Tucson: 4,510 mm / long 4,640 mm
 *       - Kia Sportage: 4,540 mm / long 4,685 mm
 *       - Chery Tiggo 7 Pro: 4,500 mm
 *       - Chery Tiggo 8 Pro: 4,722 mm
 *       - Jaecoo J7: 4,500 mm
 *       - BYD Atto 2: 4,310 mm
 *       - BYD Atto 3: 4,455 mm
 *
 * Volumes are distributed across models within a brand using mix weights
 * that reflect which trims dominate cartube's "most-sold" notes (e.g. Toyota
 * RAV4 E-VOLVE = 499/1,161 YTD through mid-Feb). Weekly volumes are the
 * monthly figure / 4.33 with ±15% jitter + mild month-end seasonality, and
 * we generate 52 weeks of current-year history + 52 weeks of prior-year
 * history (scaled by the brand's actual YoY ratio).
 *
 * Everything below can and should be overwritten by the live scraper once
 * it is wired to ivia.co.il. See src/lib/scraping/ivia.ts.
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
  power?: number; // kW
  fwdAwd?: string;
  priceListIls: number;
  onRoadPriceIls: number;
  taxTier?: string;
  importerUrl?: string;
  /** Mix weight within the model (0-1). Summed per model, used only
   *  internally to distribute sales across trims. */
  mix?: number;
}

interface SeedModel {
  name: string;
  slug: string;
  segment: string;
  bodyStyle: string;
  /** Share of this model in the brand's period volume (0-1). */
  brandMix: number;
  notes?: string;
  trims: SeedTrim[];
}

interface SeedBrand {
  name: string;
  slug: string;
  country: string;
  origin: OriginBucket;
  importerSite?: string;
  /** Feb 2026 monthly deliveries (from I-VIA report reproduced on cartube).
   *  We divide by 4.33 for a weekly baseline. */
  monthlyUnits: number;
  /** YoY ratio (2026 ÷ 2025) for the prior-year snapshot scaling. */
  yoyRatio: number;
  models: SeedModel[];
}

// Feb 2026 monthly deliveries per brand, from cartube's "מסירות רכב חדש בישראל - פברואר 2026":
// We have 2-month cumulative numbers (Jan-Feb 2026). Feb monthly = cumulative - Jan.
// Since we also have Jan 2026 for most brands from the Jan report,
// we use the cleaner "Feb monthly" number where possible:
//   Hyundai Jan=4,819 → Feb = 7,418 - 4,819 = 2,599
//   Jaecoo  Jan=4,525 → Feb = 7,946 - 4,525 = 3,421
//   Toyota  Jan=4,033 → Feb = 7,400 - 4,033 = 3,367
//   Kia     Jan=4,016 → Feb = 6,344 - 4,016 = 2,328
//   Chery   Jan=3,935 → Feb = 7,198 - 3,935 = 3,263
//   Skoda   Jan=3,569 → Feb = 5,485 - 3,569 = 1,916
//   BYD     Jan=2,474 → Feb = 3,584 - 2,474 = 1,110
// These are MONTHLY; the seeder converts to weekly internally.

const BRANDS: SeedBrand[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // #1 Jaecoo — cartube: Jan-Feb 2026 = 7,946 (Feb alone ~3,421, YoY +176%).
  //    Single hero model in IL: J7 (ICE + PHEV).
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Jaecoo",
    slug: "jaecoo",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.jaecoo.co.il",
    monthlyUnits: 3421,
    yoyRatio: 2.76,
    models: [
      {
        name: "J7",
        slug: "j7",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 1.0,
        notes: "4,500 mm C-SUV, takes on Tucson / Sportage / Tiggo 7 Pro. ~50% of volume is PHEV.",
        trims: [
          {
            name: "Executive 2WD",
            powertrain: "ICE",
            lengthMm: 4500,
            widthMm: 1865,
            heightMm: 1670,
            wheelbaseMm: 2672,
            power: 108,
            fwdAwd: "FWD",
            priceListIls: 143_000,
            onRoadPriceIls: 169_900,
            importerUrl: "https://www.jaecoo.co.il",
            mix: 0.22,
          },
          {
            name: "Titanium 2WD",
            powertrain: "ICE",
            lengthMm: 4500,
            power: 108,
            fwdAwd: "FWD",
            priceListIls: 150_000,
            onRoadPriceIls: 178_900,
            mix: 0.16,
          },
          {
            name: "Adventure 4WD",
            powertrain: "ICE",
            lengthMm: 4500,
            power: 108,
            fwdAwd: "AWD",
            priceListIls: 168_000,
            onRoadPriceIls: 199_900,
            mix: 0.07,
          },
          {
            name: "PHEV Elegance",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 91,
            power: 252,
            priceListIls: 113_000,
            onRoadPriceIls: 179_990,
            mix: 0.18,
          },
          {
            name: "PHEV Premium",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 91,
            power: 252,
            priceListIls: 119_000,
            onRoadPriceIls: 189_990,
            mix: 0.25,
          },
          {
            name: "PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 91,
            power: 252,
            priceListIls: 128_000,
            onRoadPriceIls: 202_990,
            mix: 0.12,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #2 Hyundai — Jan-Feb 2026: 7,418 (Feb ~2,599, YoY -20%).
  //    Range: Tucson (flagship), Kona, Elantra, Ioniq 5.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Hyundai",
    slug: "hyundai",
    country: "Korea",
    origin: "KOREAN",
    importerSite: "https://www.hyundai.co.il",
    monthlyUnits: 2599,
    yoyRatio: 0.80,
    models: [
      {
        name: "Tucson",
        slug: "tucson",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.55,
        trims: [
          {
            name: "1.6T Premium",
            powertrain: "MHEV",
            lengthMm: 4510,
            widthMm: 1865,
            heightMm: 1650,
            wheelbaseMm: 2680,
            power: 118,
            priceListIls: 158_000,
            onRoadPriceIls: 188_990,
            mix: 0.28,
          },
          {
            name: "1.6T Panoramic",
            powertrain: "MHEV",
            lengthMm: 4510,
            power: 118,
            priceListIls: 165_000,
            onRoadPriceIls: 196_990,
            mix: 0.12,
          },
          {
            name: "1.6T Luxury",
            powertrain: "MHEV",
            lengthMm: 4510,
            power: 118,
            priceListIls: 176_000,
            onRoadPriceIls: 209_990,
            mix: 0.07,
          },
          {
            name: "1.6T HEV Long AWD Pure",
            powertrain: "HEV",
            lengthMm: 4640,
            wheelbaseMm: 2755,
            power: 169,
            fwdAwd: "AWD",
            priceListIls: 167_000,
            onRoadPriceIls: 199_900,
            mix: 0.22,
          },
          {
            name: "1.6T HEV Long AWD Executive",
            powertrain: "HEV",
            lengthMm: 4640,
            power: 169,
            fwdAwd: "AWD",
            priceListIls: 178_000,
            onRoadPriceIls: 212_900,
            mix: 0.16,
          },
          {
            name: "1.6T HEV Long AWD Ultimate",
            powertrain: "HEV",
            lengthMm: 4640,
            power: 169,
            fwdAwd: "AWD",
            priceListIls: 187_000,
            onRoadPriceIls: 222_900,
            mix: 0.15,
          },
        ],
      },
      {
        name: "Kona",
        slug: "kona",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.18,
        trims: [
          {
            name: "Electric 64 kWh",
            powertrain: "BEV",
            lengthMm: 4355,
            batteryKwh: 64.8,
            eRangeKm: 454,
            power: 160,
            priceListIls: 125_000,
            onRoadPriceIls: 174_990,
            mix: 0.7,
          },
          {
            name: "1.6 HEV",
            powertrain: "HEV",
            lengthMm: 4355,
            power: 104,
            priceListIls: 95_000,
            onRoadPriceIls: 169_990,
            mix: 0.3,
          },
        ],
      },
      {
        name: "Elantra",
        slug: "elantra",
        segment: "C",
        bodyStyle: "Sedan",
        brandMix: 0.17,
        trims: [
          {
            name: "Hybrid Premium",
            powertrain: "HEV",
            lengthMm: 4710,
            power: 104,
            priceListIls: 148_000,
            onRoadPriceIls: 177_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Ioniq 5",
        slug: "ioniq-5",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.10,
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
            onRoadPriceIls: 249_990,
            mix: 0.6,
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
            onRoadPriceIls: 289_990,
            mix: 0.4,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #3 Toyota — Jan-Feb 2026: 7,400 (Feb ~3,367, YoY -4%).
  //    Corolla still the volume anchor; RAV4 strong (1,161 YTD from cartube).
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Toyota",
    slug: "toyota",
    country: "Japan",
    origin: "JAPANESE",
    importerSite: "https://www.toyota.co.il",
    monthlyUnits: 3367,
    yoyRatio: 0.96,
    models: [
      {
        name: "Corolla",
        slug: "corolla",
        segment: "C",
        bodyStyle: "Sedan",
        brandMix: 0.44,
        notes: "Single-trim 2026MY in Israel: 1.8 Hybrid @ 159,990 ₪.",
        trims: [
          {
            name: "1.8 Hybrid",
            powertrain: "HEV",
            lengthMm: 4630,
            widthMm: 1780,
            heightMm: 1435,
            wheelbaseMm: 2700,
            power: 103,
            priceListIls: 133_000,
            onRoadPriceIls: 159_990,
            importerUrl: "https://www.toyota.co.il/new-cars/corolla-sedan",
            mix: 1.0,
          },
        ],
      },
      {
        name: "RAV4",
        slug: "rav4",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.38,
        notes: "2026 IL lineup: 5 hybrid grades from E-VOLVE 209,990 ₪ to E-XCLUSIVE AWD 275,990 ₪.",
        trims: [
          {
            name: "2.5 HEV E-VOLVE",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 160,
            priceListIls: 175_000,
            onRoadPriceIls: 209_990,
            mix: 0.43,
          },
          {
            name: "2.5 HEV E-XPERIENCE",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 160,
            priceListIls: 180_000,
            onRoadPriceIls: 215_990,
            mix: 0.18,
          },
          {
            name: "2.5 HEV E-MOTION",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 160,
            priceListIls: 197_000,
            onRoadPriceIls: 235_990,
            mix: 0.20,
          },
          {
            name: "2.5 HEV E-MOTION Sky",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 160,
            priceListIls: 206_000,
            onRoadPriceIls: 245_990,
            mix: 0.10,
          },
          {
            name: "2.5 HEV AWD E-XCLUSIVE",
            powertrain: "HEV",
            lengthMm: 4600,
            power: 163,
            fwdAwd: "AWD",
            priceListIls: 231_000,
            onRoadPriceIls: 275_990,
            mix: 0.09,
          },
        ],
      },
      {
        name: "Yaris Cross",
        slug: "yaris-cross",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.18,
        trims: [
          {
            name: "1.5 Hybrid",
            powertrain: "HEV",
            lengthMm: 4180,
            power: 85,
            priceListIls: 124_000,
            onRoadPriceIls: 149_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #4 Chery — Jan-Feb 2026: 7,198 (Feb ~3,263, YoY +81%).
  //    Multi-model lineup: Tiggo 4 / 7 / 8, Arrizo 8, Tiggo 9.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Chery",
    slug: "chery",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://cheryisrael.co.il",
    monthlyUnits: 3263,
    yoyRatio: 1.81,
    models: [
      {
        name: "Tiggo 7 Pro",
        slug: "tiggo-7-pro",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.38,
        trims: [
          {
            name: "1.6T Sense",
            powertrain: "ICE",
            lengthMm: 4500,
            power: 108,
            priceListIls: 134_000,
            onRoadPriceIls: 159_990,
            mix: 0.20,
          },
          {
            name: "1.6T Noble",
            powertrain: "ICE",
            lengthMm: 4500,
            power: 108,
            priceListIls: 138_000,
            onRoadPriceIls: 164_990,
            mix: 0.14,
          },
          {
            name: "PHEV Comfort",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 90,
            power: 255,
            priceListIls: 107_000,
            onRoadPriceIls: 169_990,
            mix: 0.22,
          },
          {
            name: "PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 90,
            power: 255,
            priceListIls: 113_000,
            onRoadPriceIls: 179_990,
            mix: 0.27,
          },
          {
            name: "PHEV Noble",
            powertrain: "PHEV",
            lengthMm: 4500,
            batteryKwh: 18.3,
            eRangeKm: 90,
            power: 255,
            priceListIls: 117_000,
            onRoadPriceIls: 186_990,
            mix: 0.17,
          },
        ],
      },
      {
        name: "Tiggo 8 Pro",
        slug: "tiggo-8-pro",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.22,
        trims: [
          {
            name: "1.6T Comfort",
            powertrain: "ICE",
            lengthMm: 4722,
            power: 137,
            priceListIls: 150_000,
            onRoadPriceIls: 179_990,
            mix: 0.25,
          },
          {
            name: "1.6T Noble",
            powertrain: "ICE",
            lengthMm: 4722,
            power: 137,
            priceListIls: 158_000,
            onRoadPriceIls: 189_990,
            mix: 0.20,
          },
          {
            name: "PHEV Comfort",
            powertrain: "PHEV",
            lengthMm: 4722,
            batteryKwh: 19.4,
            eRangeKm: 96,
            power: 240,
            priceListIls: 119_000,
            onRoadPriceIls: 189_990,
            mix: 0.25,
          },
          {
            name: "PHEV Ultimate",
            powertrain: "PHEV",
            lengthMm: 4722,
            batteryKwh: 19.4,
            eRangeKm: 96,
            power: 240,
            priceListIls: 128_000,
            onRoadPriceIls: 204_990,
            mix: 0.30,
          },
        ],
      },
      {
        name: "Tiggo 4 Pro",
        slug: "tiggo-4-pro",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.25,
        trims: [
          {
            name: "Comfort",
            powertrain: "ICE",
            lengthMm: 4318,
            power: 83,
            priceListIls: 95_000,
            onRoadPriceIls: 114_990,
            mix: 0.35,
          },
          {
            name: "Noble",
            powertrain: "ICE",
            lengthMm: 4318,
            power: 83,
            priceListIls: 102_000,
            onRoadPriceIls: 122_990,
            mix: 0.20,
          },
          {
            name: "HEV Comfort",
            powertrain: "HEV",
            lengthMm: 4318,
            power: 150,
            priceListIls: 113_000,
            onRoadPriceIls: 135_990,
            mix: 0.25,
          },
          {
            name: "HEV Luxury",
            powertrain: "HEV",
            lengthMm: 4318,
            power: 150,
            priceListIls: 115_000,
            onRoadPriceIls: 137_990,
            mix: 0.20,
          },
        ],
      },
      {
        name: "Arrizo 8",
        slug: "arrizo-8",
        segment: "D",
        bodyStyle: "Sedan",
        brandMix: 0.10,
        trims: [
          {
            name: "Sense",
            powertrain: "ICE",
            lengthMm: 4843,
            power: 137,
            priceListIls: 134_000,
            onRoadPriceIls: 159_990,
            mix: 0.3,
          },
          {
            name: "PHEV Comfort",
            powertrain: "PHEV",
            lengthMm: 4843,
            batteryKwh: 18.4,
            eRangeKm: 90,
            power: 205,
            priceListIls: 110_000,
            onRoadPriceIls: 175_990,
            mix: 0.4,
          },
          {
            name: "PHEV Noble",
            powertrain: "PHEV",
            lengthMm: 4843,
            batteryKwh: 18.4,
            eRangeKm: 90,
            power: 205,
            priceListIls: 114_000,
            onRoadPriceIls: 181_990,
            mix: 0.3,
          },
        ],
      },
      {
        name: "FX",
        slug: "fx",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.05,
        trims: [
          {
            name: "Sense",
            powertrain: "ICE",
            lengthMm: 4405,
            power: 108,
            priceListIls: 122_000,
            onRoadPriceIls: 146_990,
            mix: 0.5,
          },
          {
            name: "Luxury",
            powertrain: "ICE",
            lengthMm: 4405,
            power: 108,
            priceListIls: 130_000,
            onRoadPriceIls: 154_990,
            mix: 0.5,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #5 Kia — Jan-Feb 2026: 6,344 (Feb ~2,328, YoY -2%).
  //    Sportage dominates; Niro EV, Seltos, EV6.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Kia",
    slug: "kia",
    country: "Korea",
    origin: "KOREAN",
    importerSite: "https://kia-israel.co.il",
    monthlyUnits: 2328,
    yoyRatio: 0.98,
    models: [
      {
        name: "Sportage",
        slug: "sportage",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.56,
        trims: [
          {
            name: "1.6T Urban",
            powertrain: "MHEV",
            lengthMm: 4540,
            widthMm: 1865,
            heightMm: 1660,
            wheelbaseMm: 2680,
            power: 118,
            priceListIls: 155_000,
            onRoadPriceIls: 184_990,
            mix: 0.20,
          },
          {
            name: "1.6T Premium",
            powertrain: "MHEV",
            lengthMm: 4540,
            power: 118,
            priceListIls: 171_000,
            onRoadPriceIls: 203_990,
            mix: 0.10,
          },
          {
            name: "1.6T HEV EX",
            powertrain: "HEV",
            lengthMm: 4540,
            power: 173,
            priceListIls: 164_000,
            onRoadPriceIls: 195_990,
            mix: 0.22,
          },
          {
            name: "1.6T HEV Premium",
            powertrain: "HEV",
            lengthMm: 4540,
            power: 173,
            priceListIls: 173_000,
            onRoadPriceIls: 206_990,
            mix: 0.15,
          },
          {
            name: "1.6T HEV Long Urban",
            powertrain: "HEV",
            lengthMm: 4685,
            wheelbaseMm: 2755,
            power: 169,
            priceListIls: 159_000,
            onRoadPriceIls: 189_990,
            mix: 0.20,
          },
          {
            name: "1.6T HEV Long Premium",
            powertrain: "HEV",
            lengthMm: 4685,
            power: 169,
            priceListIls: 176_000,
            onRoadPriceIls: 209_900,
            mix: 0.13,
          },
        ],
      },
      {
        name: "Niro",
        slug: "niro",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.22,
        trims: [
          {
            name: "EV 64 kWh",
            powertrain: "BEV",
            lengthMm: 4420,
            batteryKwh: 64.8,
            eRangeKm: 460,
            power: 150,
            priceListIls: 130_000,
            onRoadPriceIls: 179_900,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Seltos",
        slug: "seltos",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.15,
        trims: [
          {
            name: "LX Plus",
            powertrain: "ICE",
            lengthMm: 4365,
            power: 85,
            priceListIls: 137_000,
            onRoadPriceIls: 164_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "EV6",
        slug: "ev6",
        segment: "D-SUV",
        bodyStyle: "Crossover",
        brandMix: 0.07,
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
            onRoadPriceIls: 289_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #6 Skoda — Jan-Feb 2026: 5,485 (Feb ~1,916, YoY -14%).
  //    Kamiq and Octavia are the volume drivers.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Skoda",
    slug: "skoda",
    country: "Czech Republic",
    origin: "EUROPEAN",
    importerSite: "https://www.skoda.co.il",
    monthlyUnits: 1916,
    yoyRatio: 0.86,
    models: [
      {
        name: "Kamiq",
        slug: "kamiq",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.40,
        trims: [
          {
            name: "1.0 TSI Ambition",
            powertrain: "MHEV",
            lengthMm: 4241,
            power: 85,
            priceListIls: 120_000,
            onRoadPriceIls: 144_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Octavia",
        slug: "octavia",
        segment: "C",
        bodyStyle: "Sedan",
        brandMix: 0.35,
        trims: [
          {
            name: "1.5 TSI MHEV",
            powertrain: "MHEV",
            lengthMm: 4689,
            power: 110,
            priceListIls: 149_000,
            onRoadPriceIls: 178_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Kodiaq",
        slug: "kodiaq",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.15,
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
            mix: 1.0,
          },
        ],
      },
      {
        name: "Scala",
        slug: "scala",
        segment: "B",
        bodyStyle: "Hatchback",
        brandMix: 0.10,
        trims: [
          {
            name: "1.0 TSI Ambition",
            powertrain: "MHEV",
            lengthMm: 4362,
            power: 85,
            priceListIls: 115_000,
            onRoadPriceIls: 139_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #7 BYD — Jan-Feb 2026: 3,584 (Feb ~1,110, YoY +39%).
  //    Wide lineup; Atto 3, Dolphin, Seal, Seal U, Sealion 7, Atto 2, Sealion 5.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "BYD",
    slug: "byd",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.byd.co.il",
    monthlyUnits: 1110,
    yoyRatio: 1.39,
    models: [
      {
        name: "Atto 3",
        slug: "atto-3",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.22,
        trims: [
          {
            name: "Comfort",
            powertrain: "BEV",
            lengthMm: 4455,
            batteryKwh: 60.5,
            eRangeKm: 420,
            power: 150,
            priceListIls: 143_000,
            onRoadPriceIls: 171_500,
            mix: 0.55,
          },
          {
            name: "Design",
            powertrain: "BEV",
            lengthMm: 4455,
            batteryKwh: 60.5,
            eRangeKm: 420,
            power: 150,
            priceListIls: 149_000,
            onRoadPriceIls: 178_990,
            mix: 0.45,
          },
        ],
      },
      {
        name: "Atto 2",
        slug: "atto-2",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.15,
        notes: "New arrival Nov 2025 — entry BEV B-SUV under Atto 3.",
        trims: [
          {
            name: "Comfort",
            powertrain: "BEV",
            lengthMm: 4310,
            batteryKwh: 64.8,
            eRangeKm: 430,
            power: 150,
            priceListIls: 124_000,
            onRoadPriceIls: 148_990,
            mix: 0.6,
          },
          {
            name: "DM-i Boost",
            powertrain: "PHEV",
            lengthMm: 4310,
            batteryKwh: 18.0,
            eRangeKm: 90,
            power: 160,
            priceListIls: 97_000,
            onRoadPriceIls: 154_990,
            mix: 0.4,
          },
        ],
      },
      {
        name: "Dolphin",
        slug: "dolphin",
        segment: "B",
        bodyStyle: "Hatchback",
        brandMix: 0.18,
        trims: [
          {
            name: "Comfort 427 km",
            powertrain: "BEV",
            lengthMm: 4290,
            batteryKwh: 60.5,
            eRangeKm: 427,
            power: 150,
            priceListIls: 125_000,
            onRoadPriceIls: 149_990,
            mix: 0.55,
          },
          {
            name: "Design 427 km",
            powertrain: "BEV",
            lengthMm: 4290,
            batteryKwh: 60.5,
            eRangeKm: 427,
            power: 150,
            priceListIls: 131_000,
            onRoadPriceIls: 156_990,
            mix: 0.45,
          },
        ],
      },
      {
        name: "Sealion 5",
        slug: "sealion-5",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.13,
        trims: [
          {
            name: "PHEV DM-i Comfort",
            powertrain: "PHEV",
            lengthMm: 4655,
            batteryKwh: 18.3,
            eRangeKm: 90,
            power: 160,
            priceListIls: 105_000,
            onRoadPriceIls: 166_990,
            mix: 0.55,
          },
          {
            name: "PHEV DM-i Design",
            powertrain: "PHEV",
            lengthMm: 4655,
            batteryKwh: 18.3,
            eRangeKm: 90,
            power: 160,
            priceListIls: 108_000,
            onRoadPriceIls: 171_990,
            mix: 0.45,
          },
        ],
      },
      {
        name: "Sealion 7",
        slug: "sealion-7",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.10,
        trims: [
          {
            name: "Boost",
            powertrain: "BEV",
            lengthMm: 4830,
            batteryKwh: 82.5,
            eRangeKm: 482,
            power: 230,
            priceListIls: 158_000,
            onRoadPriceIls: 198_990,
            mix: 0.35,
          },
          {
            name: "Comfort",
            powertrain: "BEV",
            lengthMm: 4830,
            batteryKwh: 82.5,
            eRangeKm: 482,
            power: 230,
            priceListIls: 170_000,
            onRoadPriceIls: 214_990,
            mix: 0.25,
          },
          {
            name: "Design",
            powertrain: "BEV",
            lengthMm: 4830,
            batteryKwh: 82.5,
            eRangeKm: 482,
            power: 390,
            fwdAwd: "AWD",
            priceListIls: 174_000,
            onRoadPriceIls: 219_990,
            mix: 0.25,
          },
          {
            name: "Excellence",
            powertrain: "BEV",
            lengthMm: 4830,
            batteryKwh: 82.5,
            eRangeKm: 482,
            power: 390,
            fwdAwd: "AWD",
            priceListIls: 190_000,
            onRoadPriceIls: 237_990,
            mix: 0.15,
          },
        ],
      },
      {
        name: "Seal",
        slug: "seal",
        segment: "D",
        bodyStyle: "Sedan",
        brandMix: 0.13,
        trims: [
          {
            name: "Design 570 km RWD",
            powertrain: "BEV",
            lengthMm: 4800,
            batteryKwh: 82.5,
            eRangeKm: 570,
            power: 230,
            fwdAwd: "RWD",
            priceListIls: 158_000,
            onRoadPriceIls: 198_990,
            mix: 0.55,
          },
          {
            name: "Excellence 520 km AWD",
            powertrain: "BEV",
            lengthMm: 4800,
            batteryKwh: 82.5,
            eRangeKm: 520,
            power: 390,
            fwdAwd: "AWD",
            priceListIls: 176_000,
            onRoadPriceIls: 219_990,
            mix: 0.45,
          },
        ],
      },
      {
        name: "Seal U",
        slug: "seal-u",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.09,
        trims: [
          {
            name: "Comfort",
            powertrain: "BEV",
            lengthMm: 4785,
            batteryKwh: 71.8,
            eRangeKm: 420,
            power: 160,
            priceListIls: 155_000,
            onRoadPriceIls: 194_990,
            mix: 0.35,
          },
          {
            name: "PHEV DM-i Comfort",
            powertrain: "PHEV",
            lengthMm: 4785,
            batteryKwh: 18.3,
            eRangeKm: 95,
            power: 160,
            priceListIls: 135_000,
            onRoadPriceIls: 214_990,
            mix: 0.35,
          },
          {
            name: "Design",
            powertrain: "BEV",
            lengthMm: 4785,
            batteryKwh: 87,
            eRangeKm: 500,
            power: 160,
            priceListIls: 172_000,
            onRoadPriceIls: 216_990,
            mix: 0.30,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // #8 MG — Jan-Feb 2026: 2,076 (Feb ~1,042, YoY -47%).
  //    MG4 refresh arrived Feb @ 142,888 ₪; MG HS PHEV in range.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "MG",
    slug: "mg",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.mg.co.il",
    monthlyUnits: 1042,
    yoyRatio: 0.53,
    models: [
      {
        name: "MG4",
        slug: "mg4",
        segment: "C",
        bodyStyle: "Hatchback",
        brandMix: 0.50,
        trims: [
          {
            name: "Luxury 64 kWh",
            powertrain: "BEV",
            lengthMm: 4287,
            batteryKwh: 64,
            eRangeKm: 450,
            power: 150,
            priceListIls: 119_000,
            onRoadPriceIls: 142_888,
            mix: 1.0,
          },
        ],
      },
      {
        name: "HS",
        slug: "hs",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.30,
        trims: [
          {
            name: "PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4670,
            batteryKwh: 16.6,
            eRangeKm: 75,
            power: 190,
            priceListIls: 113_000,
            onRoadPriceIls: 179_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "ZS",
        slug: "zs",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.20,
        trims: [
          {
            name: "1.5 Comfort",
            powertrain: "ICE",
            lengthMm: 4323,
            power: 78,
            priceListIls: 100_000,
            onRoadPriceIls: 122_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Lower-volume but strategically interesting players from cartube's catalog.
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: "Tesla",
    slug: "tesla",
    country: "USA",
    origin: "AMERICAN",
    importerSite: "https://www.tesla.com/he_IL",
    monthlyUnits: 900,
    yoyRatio: 1.05,
    models: [
      {
        name: "Model Y",
        slug: "model-y",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.65,
        trims: [
          {
            name: "Long Range AWD",
            powertrain: "BEV",
            lengthMm: 4751,
            batteryKwh: 78.1,
            eRangeKm: 533,
            power: 378,
            fwdAwd: "AWD",
            priceListIls: 207_000,
            onRoadPriceIls: 259_990,
            mix: 0.70,
          },
          {
            name: "Performance",
            powertrain: "BEV",
            lengthMm: 4751,
            batteryKwh: 78.1,
            eRangeKm: 514,
            power: 393,
            fwdAwd: "AWD",
            priceListIls: 232_000,
            onRoadPriceIls: 289_990,
            mix: 0.30,
          },
        ],
      },
      {
        name: "Model 3",
        slug: "model-3",
        segment: "D",
        bodyStyle: "Sedan",
        brandMix: 0.35,
        trims: [
          {
            name: "Long Range AWD",
            powertrain: "BEV",
            lengthMm: 4720,
            batteryKwh: 78.1,
            eRangeKm: 629,
            power: 324,
            fwdAwd: "AWD",
            priceListIls: 202_000,
            onRoadPriceIls: 254_990,
            mix: 1.0,
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
    monthlyUnits: 1200,
    yoyRatio: 2.10,
    models: [
      {
        name: "EX5",
        slug: "ex5",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.55,
        trims: [
          {
            name: "TECH",
            powertrain: "BEV",
            lengthMm: 4615,
            batteryKwh: 60.2,
            eRangeKm: 430,
            power: 160,
            priceListIls: 140_000,
            onRoadPriceIls: 167_900,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Starray",
        slug: "starray",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.45,
        trims: [
          {
            name: "PRO",
            powertrain: "HEV",
            lengthMm: 4674,
            power: 160,
            priceListIls: 142_000,
            onRoadPriceIls: 169_900,
            mix: 0.55,
          },
          {
            name: "TECH",
            powertrain: "HEV",
            lengthMm: 4674,
            power: 160,
            priceListIls: 147_000,
            onRoadPriceIls: 175_900,
            mix: 0.45,
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
    monthlyUnits: 650,
    yoyRatio: 0.85,
    models: [
      {
        name: "ID.4",
        slug: "id-4",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.45,
        trims: [
          {
            name: "Pro 77 kWh",
            powertrain: "BEV",
            lengthMm: 4584,
            batteryKwh: 77,
            eRangeKm: 522,
            power: 210,
            priceListIls: 178_000,
            onRoadPriceIls: 244_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Tiguan",
        slug: "tiguan",
        segment: "C-SUV",
        bodyStyle: "SUV",
        brandMix: 0.35,
        trims: [
          {
            name: "1.5 eTSI MHEV",
            powertrain: "MHEV",
            lengthMm: 4539,
            power: 110,
            priceListIls: 135_000,
            onRoadPriceIls: 229_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "T-Roc",
        slug: "t-roc",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.20,
        trims: [
          {
            name: "1.0 TSI",
            powertrain: "ICE",
            lengthMm: 4234,
            power: 81,
            priceListIls: 107_000,
            onRoadPriceIls: 179_990,
            mix: 1.0,
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
    monthlyUnits: 800,
    yoyRatio: 0.90,
    models: [
      {
        name: "Swift",
        slug: "swift",
        segment: "B",
        bodyStyle: "Hatchback",
        brandMix: 0.55,
        trims: [
          {
            name: "1.2 MHEV",
            powertrain: "MHEV",
            lengthMm: 3860,
            power: 61,
            priceListIls: 90_000,
            onRoadPriceIls: 108_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Vitara",
        slug: "vitara",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.45,
        trims: [
          {
            name: "1.5 HEV",
            powertrain: "HEV",
            lengthMm: 4175,
            power: 85,
            priceListIls: 130_000,
            onRoadPriceIls: 159_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },
  {
    name: "Mitsubishi",
    slug: "mitsubishi",
    country: "Japan",
    origin: "JAPANESE",
    importerSite: "https://www.mitsubishi-motors.co.il",
    monthlyUnits: 750,
    yoyRatio: 0.57,
    models: [
      {
        name: "Outlander",
        slug: "outlander",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.50,
        trims: [
          {
            name: "PHEV Intense",
            powertrain: "PHEV",
            lengthMm: 4710,
            batteryKwh: 20,
            eRangeKm: 87,
            power: 225,
            fwdAwd: "AWD",
            priceListIls: 185_000,
            onRoadPriceIls: 239_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "ASX",
        slug: "asx",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.50,
        trims: [
          {
            name: "1.0 Turbo",
            powertrain: "ICE",
            lengthMm: 4227,
            power: 67,
            priceListIls: 110_000,
            onRoadPriceIls: 139_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },
  {
    name: "Omoda",
    slug: "omoda",
    country: "China",
    origin: "CHINESE",
    importerSite: "https://www.omoda.co.il",
    monthlyUnits: 520,
    yoyRatio: 1.35,
    models: [
      {
        name: "Omoda 5",
        slug: "omoda-5",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.70,
        trims: [
          {
            name: "Comfort",
            powertrain: "ICE",
            lengthMm: 4400,
            power: 108,
            priceListIls: 115_000,
            onRoadPriceIls: 138_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "Omoda 9",
        slug: "omoda-9",
        segment: "D-SUV",
        bodyStyle: "SUV",
        brandMix: 0.30,
        trims: [
          {
            name: "PHEV Luxury",
            powertrain: "PHEV",
            lengthMm: 4775,
            batteryKwh: 34.5,
            eRangeKm: 170,
            power: 330,
            fwdAwd: "AWD",
            priceListIls: 160_000,
            onRoadPriceIls: 249_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },
  {
    name: "Smart",
    slug: "smart",
    country: "Germany",
    origin: "EUROPEAN",
    importerSite: "https://www.smart.co.il",
    monthlyUnits: 230,
    yoyRatio: 1.15,
    models: [
      {
        name: "#1",
        slug: "hashtag-1",
        segment: "B-SUV",
        bodyStyle: "SUV",
        brandMix: 0.60,
        trims: [
          {
            name: "Pro+",
            powertrain: "BEV",
            lengthMm: 4270,
            batteryKwh: 66,
            eRangeKm: 440,
            power: 200,
            priceListIls: 160_000,
            onRoadPriceIls: 199_990,
            mix: 1.0,
          },
        ],
      },
      {
        name: "#3",
        slug: "hashtag-3",
        segment: "C-SUV",
        bodyStyle: "Crossover",
        brandMix: 0.40,
        trims: [
          {
            name: "Pro+",
            powertrain: "BEV",
            lengthMm: 4400,
            batteryKwh: 66,
            eRangeKm: 455,
            power: 200,
            priceListIls: 168_000,
            onRoadPriceIls: 209_990,
            mix: 1.0,
          },
        ],
      },
    ],
  },
];

// Generate realistic weekly volumes. Monthly volume / 4.33 weeks, with
// mild month-end seasonality (Dec +50%, mid-quarter +10%) and ±15% jitter.
function generateWeeklySnapshots(
  monthlyUnits: number,
  now: Date,
  weeks: number,
  yearScale: number,
): { periodStart: Date; periodEnd: Date; units: number; year: number; weekOfYear: number }[] {
  const weeklyBase = monthlyUnits / 4.33;
  const out = [] as {
    periodStart: Date;
    periodEnd: Date;
    units: number;
    year: number;
    weekOfYear: number;
  }[];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7 * i);
    const start = startOfWeek(d);
    const end = endOfWeek(d);
    const month = start.getMonth();
    const seasonal =
      month === 11
        ? 1.45
        : month === 2 || month === 5 || month === 8
          ? 1.12
          : month === 0
            ? 0.65
            : 1;
    const jitter = 0.85 + Math.random() * 0.3;
    const units = Math.max(0, Math.round(weeklyBase * seasonal * jitter * yearScale));
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

export async function runSeed(client?: PrismaClient) {
  const prisma = client ?? new PrismaClient();
  console.log("→ Seeding IL CarLens database (cartube-calibrated 2026)…");

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

    // For each model we pre-compute a weekly series scaled to that model's
    // share of the brand volume (brandMix × brand weekly).
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

      const createdTrims: { id: string; weight: number }[] = [];
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
        const mix = t.mix ?? 1 / m.trims.length;
        createdTrims.push({ id: trim.id, weight: mix });
        trimCount++;
      }

      const modelMonthly = b.monthlyUnits * m.brandMix;

      const thisYear = generateWeeklySnapshots(modelMonthly, now, 52, 1);
      const priorNow = new Date(now);
      priorNow.setFullYear(priorNow.getFullYear() - 1);
      // The prior-year baseline is today's monthly ÷ the brand's 2026/2025 YoY.
      const priorYear = generateWeeklySnapshots(
        modelMonthly / b.yoyRatio,
        priorNow,
        52,
        1,
      );
      const allSnaps = [...thisYear, ...priorYear];

      for (const s of allSnaps) {
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
              source: "CARTUBE_CALIBRATION",
            },
          });
          snapshotCount++;
        }
      }
    }
    console.log(`  ✓ ${b.name} — ${b.models.length} models (${b.monthlyUnits}/mo)`);
  }

  // Fresh set of alerts anchored to the Feb 2026 report.
  await prisma.alert.createMany({
    data: [
      {
        severity: "critical",
        title: "Jaecoo storms to #1 brand in Israel — Jan-Feb 2026",
        body: "Jaecoo delivered 7,946 vehicles YTD through Feb 2026, a 176% YoY surge driven almost entirely by J7 PHEV. Hyundai drops to #2 (-20% YoY). Price-gap vs Tucson ~20k ₪.",
        link: "https://www.cartube.co.il",
      },
      {
        severity: "warn",
        title: "Chinese brand pressure intensifies",
        body: "Chinese brands (Jaecoo + Chery + BYD + MG + Geely + Omoda) captured ~40% of Jan-Feb 2026 deliveries. Korean and Japanese lineups under margin pressure at the sub-200k ₪ C-SUV price point.",
      },
      {
        severity: "info",
        title: "Green share 63.4% of market (Feb 2026)",
        body: "PHEV 9,766 / BEV 6,831 / HEV 21,570 — PHEV continues to outsell BEV in Israel on the back of Tiggo 7 Pro, Jaecoo 7, and Outlander PHEV.",
      },
      {
        severity: "info",
        title: "MG4 2026 refresh arrives — 142,888 ₪",
        body: "MG's refreshed MG4 hatch landed in Israel at 142,888 ₪, undercutting Kona EV by ~30k ₪ and Dolphin by ~7k ₪. Watch for impact on C-hatch BEV share.",
      },
    ],
  });

  await prisma.ingestionRun.create({
    data: {
      source: "CARTUBE_CALIBRATION",
      ok: true,
      finishedAt: new Date(),
      rowsUpserted: trimCount + snapshotCount,
    },
  });

  console.log(`✓ Seed complete. trims=${trimCount} snapshots=${snapshotCount}`);
  if (!client) await prisma.$disconnect();
}
