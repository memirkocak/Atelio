import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { DashboardStats } from "./schemas";

export type RevenuePoint = { label: string; fullLabel: string; totalCents: number; subtotalCents: number };
export type TasksPoint = { label: string; fullLabel: string; count: number };

/** « 2026-11 » → « nov. » / « novembre 2026 » (date seule : aucun effet de fuseau). */
export function monthLabels(month: string): { label: string; fullLabel: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const date = new Date(y, m - 1, 1);
  return {
    label: format(date, "MMM", { locale: fr }),
    fullLabel: format(date, "MMMM yyyy", { locale: fr }),
  };
}

/** « 2026-11-09 » (lundi) → « 9 nov. » / « semaine du 9 nov. 2026 ». */
export function weekLabels(weekStart: string): { label: string; fullLabel: string } {
  const [y, m, d] = weekStart.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return {
    label: format(date, "d MMM", { locale: fr }),
    fullLabel: `Semaine du ${format(date, "d MMM yyyy", { locale: fr })}`,
  };
}

export function revenueSeries(stats: Pick<DashboardStats, "revenue_by_month">): RevenuePoint[] {
  return stats.revenue_by_month.map((p) => ({
    ...monthLabels(p.month),
    totalCents: p.total_cents,
    subtotalCents: p.subtotal_cents,
  }));
}

export function tasksSeries(stats: Pick<DashboardStats, "tasks_completed_by_week">): TasksPoint[] {
  return stats.tasks_completed_by_week.map((p) => ({ ...weekLabels(p.week_start), count: p.count }));
}

/** Vrai si la série ne contient que des zéros (affichage d'un état vide). */
export function isEmptySeries(values: readonly number[]): boolean {
  return values.every((v) => v === 0);
}

/** 1234500 centimes → « 12 k€ » (axes des graphiques). */
export function formatCompactEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}
