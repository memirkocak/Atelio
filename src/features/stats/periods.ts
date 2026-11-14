import { z } from "zod";

import { addDaysIso, startOfWeekIso, todayIso } from "@/lib/dates";

/** Périodes proposées (valeur d'URL → libellé). */
export const STATS_PERIODS = {
  "30j": "30 derniers jours",
  "3m": "3 derniers mois",
  "6m": "6 derniers mois",
  "12m": "12 derniers mois",
  annee: "Année en cours",
  "annee-precedente": "Année précédente",
} as const;
export type StatsPeriodKey = keyof typeof STATS_PERIODS;
export const DEFAULT_PERIOD: StatsPeriodKey = "12m";

export type ResolvedPeriod = {
  key: StatsPeriodKey;
  label: string;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  /** « vs 30 jours précédents », « vs même période en 2025 »… */
  comparisonLabel: string;
};

const periodKeys = Object.keys(STATS_PERIODS) as [StatsPeriodKey, ...StatsPeriodKey[]];
const periodParam = z.enum(periodKeys).catch(DEFAULT_PERIOD);

export function parsePeriodParam(searchParams: Record<string, string | string[] | undefined>): StatsPeriodKey {
  const value = searchParams.periode;
  return periodParam.parse(Array.isArray(value) ? value[0] : value);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 1er jour du mois, `months` mois avant celui de la date. */
function firstOfMonthBefore(iso: string, months: number): string {
  const [y, m] = iso.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1 - months, 1)).toISOString().slice(0, 10);
}

/** Même jour un an plus tôt (29 février → 28 février). */
function oneYearBefore(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y - 1, m - 1, d));
  return date.getUTCMonth() === m - 1 ? date.toISOString().slice(0, 10) : addDaysIso(`${y - 1}-${String(m).padStart(2, "0")}-01`, d - 2);
}

/**
 * Bornes (jours de Paris, incluses) de la période et de la période de comparaison.
 * Périodes glissantes : comparées à la période de même durée qui précède.
 * Années : comparées aux mêmes dates de l'année précédente.
 */
export function resolvePeriod(key: StatsPeriodKey, today: string = todayIso()): ResolvedPeriod {
  const year = Number(today.slice(0, 4));
  let from: string;
  let to = today;

  switch (key) {
    case "30j":
      from = addDaysIso(today, -29);
      break;
    case "3m":
      from = addDaysIso(startOfWeekIso(today), -12 * 7); // 13 semaines complètes
      break;
    case "6m":
      from = firstOfMonthBefore(today, 5);
      break;
    case "12m":
      from = firstOfMonthBefore(today, 11);
      break;
    case "annee":
      from = `${year}-01-01`;
      return {
        key,
        label: STATS_PERIODS[key],
        from,
        to,
        previousFrom: `${year - 1}-01-01`,
        previousTo: oneYearBefore(today),
        comparisonLabel: `vs même période en ${year - 1}`,
      };
    case "annee-precedente":
      from = `${year - 1}-01-01`;
      to = `${year - 1}-12-31`;
      return {
        key,
        label: STATS_PERIODS[key],
        from,
        to,
        previousFrom: `${year - 2}-01-01`,
        previousTo: `${year - 2}-12-31`,
        comparisonLabel: `vs ${year - 2}`,
      };
  }

  const length = daysBetween(from, to) + 1;
  return {
    key,
    label: STATS_PERIODS[key],
    from,
    to,
    previousFrom: addDaysIso(from, -length),
    previousTo: addDaysIso(from, -1),
    comparisonLabel: "vs période précédente",
  };
}

export type Variation =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "flat" }
  | { kind: "up" | "down"; percent: number };

/** Variation en % arrondie à l'unité ; « nouveau » si la période précédente valait 0. */
export function variation(current: number, previous: number): Variation {
  if (previous === 0) return current === 0 ? { kind: "none" } : { kind: "new" };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { kind: "flat" };
  return { kind: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}

/** Écart en points (taux) : null si l'un des deux taux est inconnu. */
export function pointsDifference(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 100);
}

/** Taux d'acceptation = acceptés ÷ (acceptés + refusés + expirés sans réponse) ; null sans décision. */
export function acceptanceRate(s: { accepted: { count: number }; refused: number; expired: number }): number | null {
  const decided = s.accepted.count + s.refused + s.expired;
  return decided === 0 ? null : s.accepted.count / decided;
}

/** Panier moyen HT (centimes, arrondi) ; null sans devis accepté. */
export function averageBasket(s: { accepted: { count: number; subtotal_cents: number } }): number | null {
  return s.accepted.count === 0 ? null : Math.round(s.accepted.subtotal_cents / s.accepted.count);
}
