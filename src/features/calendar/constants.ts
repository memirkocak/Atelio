import type { StatusTone } from "@/components/shared/status-badge";

export const CALENDAR_VIEWS = ["month", "week"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  month: "Mois",
  week: "Semaine",
};

/** Types d'éléments affichés (filtrables). */
export const CALENDAR_KINDS = ["event", "task", "project", "quote"] as const;
export type CalendarKind = (typeof CALENDAR_KINDS)[number];

export const CALENDAR_KIND_LABELS: Record<CalendarKind, string> = {
  event: "Rendez-vous",
  task: "Tâches",
  project: "Projets",
  quote: "Devis",
};

export const CALENDAR_KIND_TONES: Record<CalendarKind, StatusTone> = {
  event: "progress",
  task: "warning",
  project: "success",
  quote: "info",
};

/** Nombre d'éléments visibles par case de la vue mois (au-delà : « +N »). */
export const MAX_ITEMS_PER_CELL = 3;

/** Plafond de lignes lues par type sur une période (garde-fou). */
export const MAX_ITEMS_PER_KIND = 500;

export const DEFAULT_EVENT_START = "09:00";
export const DEFAULT_EVENT_END = "10:00";

/** Libellés des colonnes (historique / activité récente). */
export const EVENT_FIELD_LABELS: Record<string, string> = {
  title: "titre",
  description: "description",
  location: "lieu",
  starts_at: "début",
  ends_at: "fin",
  all_day: "journée entière",
  client_id: "client",
  project_id: "projet",
};
