/** Récapitulatif de TVA par taux à partir des montants ENREGISTRÉS des lignes (valeurs de la base). */
export function vatBreakdownFromItems(
  items: { vat_rate_bp: number; line_subtotal_cents: number; line_vat_cents: number }[],
) {
  const map = new Map<number, { baseCents: number; vatCents: number }>();
  for (const i of items) {
    const entry = map.get(i.vat_rate_bp) ?? { baseCents: 0, vatCents: 0 };
    entry.baseCents += i.line_subtotal_cents;
    entry.vatCents += i.line_vat_cents;
    map.set(i.vat_rate_bp, entry);
  }
  return [...map.entries()].sort(([a], [b]) => b - a).map(([rateBp, v]) => ({ rateBp, ...v }));
}
