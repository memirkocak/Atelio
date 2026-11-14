import type { ActivityEntityType } from "@/features/activity/queries";

/** Événement du flux d'activité de l'espace (tous modules). */
export type RecentActivityItem = {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: "created" | "updated" | "deleted";
  summary: string;
  changes: string[];
  createdAt: string;
  actorName: string | null;
  /** Faux si l'élément a été supprimé depuis (pas de lien). */
  exists: boolean;
};
