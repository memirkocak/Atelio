import type { StatusTone } from "@/components/shared/status-badge";
import type { Database } from "@/types/database.types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
};
export const TASK_STATUS_TONES: Record<TaskStatus, StatusTone> = {
  todo: "neutral",
  in_progress: "progress",
  done: "success",
};

/** Du plus urgent au moins urgent (ordre d'affichage des choix). */
export const TASK_PRIORITIES: readonly TaskPriority[] = ["urgent", "high", "medium", "low"];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgente",
  high: "Haute",
  medium: "Normale",
  low: "Basse",
};

export const TASK_DUE_FILTERS = {
  overdue: "En retard",
  today: "Aujourd’hui",
  week: "Cette semaine",
  none: "Sans échéance",
} as const;
export type TaskDueFilter = keyof typeof TASK_DUE_FILTERS;

/** Valeur du filtre projet pour « tâches sans projet ». */
export const NO_PROJECT = "none";

export const TASKS_PAGE_SIZE = 50;

export const TASK_FIELD_LABELS: Record<string, string> = {
  project_id: "projet",
  title: "titre",
  description: "description",
  status: "statut",
  priority: "priorité",
  due_date: "échéance",
  completed_at: "date de fin",
};
