/**
 * Israel on-road price calculator.
 *
 * Methodology (simplified, 2026):
 *  - Importer declares a CIF / list price.
 *  - Ministry of Finance applies a "green" purchase tax that depends on
 *    powertrain and CO₂/pollution grade:
 *       BEV  : 35% in 2026 (phased-in from 10%→45% path), with a floor of ~20k ₪
 *       PHEV : 45%
 *       HEV  : 45–55% depending on grade
 *       ICE  : 83% standard, 72–95% by grade
 *     A "greenery benefit" (הטבת ירוק) reduces purchase tax for cleaner
 *     grades; we bake a typical reduction into the effective rate.
 *  - 17% VAT (מע"מ) is then applied.
 *  - License fees (~2,800 ₪/yr), dealer delivery (~1,500 ₪), and plates
 *    are added to get the final on-road price ("מחיר מחירון נוחת").
 *
 * This calculator is intentionally approximate — used for the Launch
 * Simulator and sanity-checking scraped list prices. Real prices always
 * come from importer sites.
 */

import type { Powertrain } from "./enums";

export const VAT_RATE = 0.17;

/** Effective purchase-tax rate after green benefit, by powertrain. */
export const PURCHASE_TAX_RATE: Record<Powertrain, number> = {
  BEV: 0.35,
  PHEV: 0.45,
  HEV: 0.49,
  MHEV: 0.67,
  ICE: 0.83,
};

/** Flat fees added on top (delivery, plates, first-year license). */
export const ON_ROAD_FEES_ILS = 4500;

/** Floor on purchase tax per vehicle (approximate 2026 BEV floor). */
export const BEV_TAX_FLOOR_ILS = 20_000;

export interface TaxBreakdown {
  importerPriceIls: number;
  purchaseTaxIls: number;
  vatIls: number;
  feesIls: number;
  onRoadPriceIls: number;
  effectiveTaxRate: number;
}

/**
 * Compute the on-road (drive-away) consumer price from a pre-tax importer
 * price, based on powertrain.
 */
export function computeOnRoadPrice(
  importerPriceIls: number,
  powertrain: Powertrain,
): TaxBreakdown {
  const rate = PURCHASE_TAX_RATE[powertrain];
  let purchaseTax = importerPriceIls * rate;
  if (powertrain === "BEV") {
    purchaseTax = Math.max(purchaseTax, BEV_TAX_FLOOR_ILS);
  }
  const afterTax = importerPriceIls + purchaseTax;
  const vat = afterTax * VAT_RATE;
  const onRoad = afterTax + vat + ON_ROAD_FEES_ILS;

  return {
    importerPriceIls: Math.round(importerPriceIls),
    purchaseTaxIls: Math.round(purchaseTax),
    vatIls: Math.round(vat),
    feesIls: ON_ROAD_FEES_ILS,
    onRoadPriceIls: Math.round(onRoad),
    effectiveTaxRate: Number(((purchaseTax + vat) / importerPriceIls).toFixed(3)),
  };
}

/**
 * Reverse: given a published on-road price (what Israelis pay), back-solve
 * the importer price. Useful when we only scrape consumer prices.
 */
export function reverseImporterPrice(
  onRoadPriceIls: number,
  powertrain: Powertrain,
): number {
  const rate = PURCHASE_TAX_RATE[powertrain];
  const onRoadMinusFees = onRoadPriceIls - ON_ROAD_FEES_ILS;
  const divisor = (1 + rate) * (1 + VAT_RATE);
  return Math.round(onRoadMinusFees / divisor);
}
