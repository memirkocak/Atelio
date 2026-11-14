import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/features/projects/constants";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from "@/features/tasks/constants";

import type { Statistics } from "./schemas";

export type TimePoint = {
  label: string;
  fullLabel: string;
  quotesCreated: number;
  quotesAccepted: number;
  acceptedSubtotalCents: number;
  tasksCompleted: number;
  projectsCompleted: number;
};

export type DistributionPoint = { key: string; label: string; count: number };

function localDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

/** Libellés d'une tranche : « nov. 25 » / « novembre 2025 », ou « 9 nov. » / « semaine du 9 nov. 2026 ». */
export function bucketLabels(start: string, granularity: Statistics["granularity"]) {
  const date = localDate(start);
  return granularity === "month"
    ? { label: format(date, "MMM yy", { locale: fr }), fullLabel: format(date, "MMMM yyyy", { locale: fr }) }
    : { label: format(date, "d MMM", { locale: fr }), fullLabel: `Semaine du ${format(date, "d MMM yyyy", { locale: fr })}` };
}

export function timeSeries(stats: Pick<Statistics, "series" | "granularity">): TimePoint[] {
  return stats.series.map((p) => ({
    ...bucketLabels(p.start, stats.granularity),
    quotesCreated: p.quotes_created,
    quotesAccepted: p.quotes_accepted,
    acceptedSubtotalCents: p.accepted_subtotal_cents,
    tasksCompleted: p.tasks_completed,
    projectsCompleted: p.projects_completed,
  }));
}

/** Répartition dans l'ordre métier, valeurs absentes = 0. */
function distribution<K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
  values: Record<string, number>,
): DistributionPoint[] {
  return keys.map((k) => ({ key: k, label: labels[k], count: values[k] ?? 0 }));
}

export function taskStatusDistribution(stats: Pick<Statistics, "tasks_by_status">) {
  return distribution(TASK_STATUSES, TASK_STATUS_LABELS, stats.tasks_by_status);
}

export function taskPriorityDistribution(stats: Pick<Statistics, "open_tasks_by_priority">) {
  return distribution(TASK_PRIORITIES, TASK_PRIORITY_LABELS, stats.open_tasks_by_priority);
}

export function projectStatusDistribution(stats: Pick<Statistics, "projects_by_status">) {
  return distribution(PROJECT_STATUSES, PROJECT_STATUS_LABELS, stats.projects_by_status);
}

/** 0,4231 → « 42 % » */
export function formatPercent(rate: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 }).format(rate);
}
