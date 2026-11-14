import { todayIso } from "@/lib/dates";

import { ACTIVE_PROJECT_STATUSES, type ProjectStatus } from "./constants";

/** Projet en retard : actif et échéance strictement passée (jour de Paris). */
export function isProjectOverdue(
  project: { status: ProjectStatus; due_date: string | null },
  today: string = todayIso(),
): boolean {
  return (
    project.due_date !== null && ACTIVE_PROJECT_STATUSES.includes(project.status) && project.due_date < today
  );
}
