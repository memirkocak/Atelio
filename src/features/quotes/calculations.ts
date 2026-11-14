/**
 * Calcul des montants d'un devis — MIROIR EXACT de private.quote_line_amounts (migration 0006).
 * La base de données fait foi ; ce calcul sert à l'aperçu en direct dans l'éditeur.
 * Les deux sont vérifiés sur les mêmes cas (tests/fixtures/quote-calculations.json).
 *
 *   HT ligne  = arrondi(quantité × prix unitaire)      (centimes)
 *   TVA ligne = arrondi(HT ligne × taux / 10 000)      (taux en points de base)
 *   Arrondi « demi vers le haut » ; calcul en entiers (BigInt) : aucune erreur de flottant.
 */

export type QuoteLineInput = {
  /** Quantité saisie (« 1,5 », « 2.25 », 3 décimales au plus). */
  quantity: string;
  unitPriceCents: number;
  vatRateBp: number;
};

export type QuoteLineAmounts = { subtotalCents: number; vatCents: number; totalCents: number };

export type QuoteTotals = {
  lines: QuoteLineAmounts[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  /** Récapitulatif par taux de TVA (ordre décroissant des taux). */
  vatBreakdown: { rateBp: number; baseCents: number; vatCents: number }[];
};

/** « 1,5 » → 1500n (millièmes). null si invalide, nulle ou plus de 3 décimales. */
export function parseQuantity(input: string): bigint | null {
  const value = input.trim().replace(",", ".");
  const match = /^(\d{1,7})(?:\.(\d{1,3}))?$/.exec(value);
  if (!match) return null;
  const milli = BigInt(match[1]!) * 1000n + BigInt((match[2] ?? "").padEnd(3, "0"));
  return milli > 0n ? milli : null;
}

/** Division entière arrondie « demi vers le haut » (valeurs positives). */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

export function computeLine(quantityMilli: bigint, unitPriceCents: number, vatRateBp: number): QuoteLineAmounts {
  const subtotal = divRoundHalfUp(quantityMilli * BigInt(unitPriceCents), 1000n);
  const vat = divRoundHalfUp(subtotal * BigInt(vatRateBp), 10000n);
  return { subtotalCents: Number(subtotal), vatCents: Number(vat), totalCents: Number(subtotal + vat) };
}

/**
 * Totaux d'un devis. Les lignes dont la quantité est invalide comptent pour 0
 * (l'éditeur signale l'erreur ; le serveur refuse l'enregistrement).
 * En franchise de TVA, tous les taux sont ramenés à 0 (comme côté serveur).
 */
export function computeQuoteTotals(lines: QuoteLineInput[], vatExempt = false): QuoteTotals {
  const amounts = lines.map((line) => {
    const quantity = parseQuantity(line.quantity);
    if (quantity === null || !Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      return { subtotalCents: 0, vatCents: 0, totalCents: 0 };
    }
    return computeLine(quantity, line.unitPriceCents, vatExempt ? 0 : line.vatRateBp);
  });

  const breakdown = new Map<number, { baseCents: number; vatCents: number }>();
  lines.forEach((line, i) => {
    const rate = vatExempt ? 0 : line.vatRateBp;
    const entry = breakdown.get(rate) ?? { baseCents: 0, vatCents: 0 };
    entry.baseCents += amounts[i]!.subtotalCents;
    entry.vatCents += amounts[i]!.vatCents;
    breakdown.set(rate, entry);
  });

  const subtotalCents = amounts.reduce((sum, a) => sum + a.subtotalCents, 0);
  const vatCents = amounts.reduce((sum, a) => sum + a.vatCents, 0);
  return {
    lines: amounts,
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents,
    vatBreakdown: [...breakdown.entries()]
      .sort(([a], [b]) => b - a)
      .map(([rateBp, v]) => ({ rateBp, ...v })),
  };
}

/** 2000 → « 20 % », 550 → « 5,5 % » */
export function formatVatRate(rateBp: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(rateBp / 100)} %`;
}
