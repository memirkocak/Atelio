import { describe, expect, it } from "vitest";

import { computeQuoteTotals, formatVatRate, parseQuantity } from "@/features/quotes/calculations";

import fixtures from "../fixtures/quote-calculations.json";

describe("calcul des devis — cas de référence partagés avec la base de données", () => {
  it.each(fixtures.cases)("$name", (c) => {
    const totals = computeQuoteTotals(
      c.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unit_price_cents, vatRateBp: i.vat_rate_bp })),
      c.vat_exempt,
    );
    expect(totals.lines.map((l) => [l.subtotalCents, l.vatCents])).toEqual(c.expected.lines);
    expect(totals.subtotalCents).toBe(c.expected.subtotal);
    expect(totals.vatCents).toBe(c.expected.vat);
    expect(totals.totalCents).toBe(c.expected.total);
  });
});

describe("détails du calcul", () => {
  it("lit les quantités (virgule ou point, 3 décimales au plus)", () => {
    expect(parseQuantity("1,5")).toBe(1500n);
    expect(parseQuantity(" 2.25 ")).toBe(2250n);
    expect(parseQuantity("10")).toBe(10000n);
    for (const invalid of ["0", "0,000", "-1", "1,2345", "abc", "", "1e3"]) {
      expect(parseQuantity(invalid)).toBeNull();
    }
  });

  it("récapitule la TVA par taux, du plus élevé au plus bas", () => {
    const totals = computeQuoteTotals([
      { quantity: "1", unitPriceCents: 1000, vatRateBp: 550 },
      { quantity: "1", unitPriceCents: 2000, vatRateBp: 2000 },
      { quantity: "2", unitPriceCents: 1000, vatRateBp: 2000 },
    ]);
    expect(totals.vatBreakdown).toEqual([
      { rateBp: 2000, baseCents: 4000, vatCents: 800 },
      { rateBp: 550, baseCents: 1000, vatCents: 55 },
    ]);
  });

  it("une ligne invalide compte pour 0 dans l'aperçu", () => {
    const totals = computeQuoteTotals([
      { quantity: "abc", unitPriceCents: 1000, vatRateBp: 2000 },
      { quantity: "1", unitPriceCents: 1000, vatRateBp: 2000 },
    ]);
    expect(totals.totalCents).toBe(1200);
  });

  it("formate les taux de TVA", () => {
    expect(formatVatRate(2000)).toBe("20 %");
    expect(formatVatRate(550)).toBe("5,5 %");
    expect(formatVatRate(210)).toBe("2,1 %");
    expect(formatVatRate(0)).toBe("0 %");
  });
});
