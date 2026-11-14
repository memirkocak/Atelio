import { todayIso } from "@/lib/dates";

import type { TaskDueFilter, TaskStatus } from "./constants";

/** Tâche en retard : non terminée et échéance strictement passée (jour de Paris). */
export function isTaskOverdue(
  task: { status: TaskStatus; due_date: string | null },
  today: string = todayIso(),
): boolean {
  return task.status !== "done" && task.due_date !== null && task.due_date < today;
}

/** Ajoute des jours à une date « AAAA-MM-JJ » (calcul en UTC : aucun effet de fuseau). */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Dimanche de la semaine (lundi → dimanche) contenant la date. */
export function endOfWeekIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
  return addDaysIso(iso, weekday === 0 ? 0 : 7 - weekday);
}

export type DueRange =
  | { kind: "before"; date: string }
  | { kind: "between"; from: string; to: string }
  | { kind: "none" };

/** Traduit un filtre d'échéance en plage de dates (bornes incluses), relatif au jour de Paris. */
export function dueRange(filter: TaskDueFilter, today: string = todayIso()): DueRange {
  switch (filter) {
    case "overdue":
      return { kind: "before", date: today };
    case "today":
      return { kind: "between", from: today, to: today };
    case "week":
      return { kind: "between", from: today, to: endOfWeekIso(today) };
    case "none":
      return { kind: "none" };
  }
}
