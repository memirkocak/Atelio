import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Fuseau de référence de l'application (DT-012). */
export const APP_TIMEZONE = "Europe/Paris";

/** Date du jour à Paris au format ISO « AAAA-MM-JJ » (indépendant du fuseau du serveur). */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Vrai si la chaîne est une date « AAAA-MM-JJ » existante. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** « 2026-12-15 » → « 15 déc. 2026 » (date seule : pas de décalage de fuseau). */
export function formatIsoDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return format(new Date(y, m - 1, d), "d MMM yyyy", { locale: fr });
}
