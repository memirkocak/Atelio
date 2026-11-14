/**
 * Montants : toujours des entiers en centimes (jamais de flottant pour l'argent).
 */
const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroInputFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: false,
});

/** 150050 → « 1 500,50 € » */
export function formatCents(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/** 150050 → « 1500,5 » (valeur de champ de saisie) */
export function centsToInput(cents: number | null): string {
  return cents === null ? "" : euroInputFormatter.format(cents / 100);
}

/**
 * Saisie en euros → centimes.
 * Accepte « 1 500,50 », « 1500.5 », « 1 500 € », « 1500 ». Chaîne vide → null.
 * Renvoie NaN si la saisie est invalide (plus de 2 décimales, lettres, négatif…).
 */
export function parseEuroInput(input: string): number | null {
  const compact = input.replace(/[\s  €]/g, "");
  if (compact === "") return null;
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(compact);
  if (!match) return Number.NaN;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return euros * 100 + cents;
}
