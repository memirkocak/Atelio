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

/** Ajoute des jours à une date « AAAA-MM-JJ » (calcul en UTC : aucun effet de fuseau). */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jour de la semaine d'une date « AAAA-MM-JJ » : 1 = lundi … 7 = dimanche (ISO). */
export function isoWeekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Lundi de la semaine contenant la date. */
export function startOfWeekIso(iso: string): string {
  return addDaysIso(iso, 1 - isoWeekday(iso));
}

const parisPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function parisParts(instant: Date) {
  const parts = Object.fromEntries(parisPartsFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Décalage de Paris par rapport à UTC (en millisecondes) à un instant donné. */
function parisOffsetMs(instant: number): number {
  const p = parisParts(new Date(instant));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Date et heure « murales » de Paris → instant UTC (ISO 8601).
 * Changement d'heure : une heure inexistante (printemps, 02:30) est décalée d'une heure ;
 * une heure ambiguë (automne, 02:30 deux fois) prend la première occurrence (heure d'été).
 */
export function parisToUtcIso(date: string, time = "00:00"): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, h, mi);
  // Deux offsets candidats (avant / après la transition) : on garde celui qui est cohérent.
  const first = wall - parisOffsetMs(wall - 3 * 3600_000);
  const second = wall - parisOffsetMs(wall + 3 * 3600_000);
  const candidates = [first, second].filter((t) => t + parisOffsetMs(t) === wall).sort((a, b) => a - b);
  // Heure inexistante : décalage d'avant la transition → l'heure murale avance d'une heure
  const instant = candidates[0] ?? first;
  return new Date(instant).toISOString();
}

/** Instant (ISO ou Date) → date « AAAA-MM-JJ » et heure « HH:mm » à Paris. */
export function utcToParis(value: string | Date): { date: string; time: string } {
  const p = parisParts(new Date(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}
