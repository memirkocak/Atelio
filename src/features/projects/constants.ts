import type { StatusTone } from "@/components/shared/status-badge";
import type { Database } from "@/types/database.types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

/** Ordre d'affichage (colonnes du Kanban, listes). */
export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "upcoming",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  upcoming: "À venir",
  in_progress: "En cours",
  on_hold: "En attente",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const PROJECT_STATUS_TONES: Record<ProjectStatus, StatusTone> = {
  upcoming: "neutral",
  in_progress: "progress",
  on_hold: "warning",
  completed: "success",
  cancelled: "neutral",
};

/** Statuts « actifs » : un projet actif dont l'échéance est passée est en retard. */
export const ACTIVE_PROJECT_STATUSES: readonly ProjectStatus[] = ["upcoming", "in_progress", "on_hold"];

export const PROJECTS_PAGE_SIZE = 25;
/** Garde-fou de la vue Kanban (non paginée). */
export const PROJECTS_KANBAN_LIMIT = 300;

export const PROJECT_SORTS = {
  due: "Échéance la plus proche",
  recent: "Plus récents",
  name: "Nom (A → Z)",
} as const;
export type ProjectSort = keyof typeof PROJECT_SORTS;

export const PROJECT_VIEWS = ["tableau", "kanban"] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

export const PROJECT_FIELD_LABELS: Record<string, string> = {
  client_id: "client",
  name: "nom",
  description: "description",
  status: "statut",
  budget_cents: "budget",
  start_date: "date de début",
  due_date: "échéance",
  progress: "avancement",
  completed_at: "date de fin",
};
