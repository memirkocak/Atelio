import type { Database } from "@/types/database.types";

import type { CalendarKind } from "./constants";
import type { EventFormInput } from "./schemas";

/* Types partagés serveur / navigateur (aucun import serveur ici). */

export type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type Option = { id: string; label: string };

/** Élément affiché dans le calendrier (rendez-vous ou date issue d'un autre module). */
export type CalendarItem = {
  key: string;
  kind: CalendarKind;
  title: string;
  /** Précision affichée sous le titre (ex. « Échéance », « Début du projet »). */
  label: string;
  /** Premier et dernier jour (inclus) à Paris, « AAAA-MM-JJ ». */
  startDate: string;
  endDate: string;
  /** Heure de début à Paris (rendez-vous avec horaire), sinon null. */
  time: string | null;
  endTime: string | null;
  /** Élément terminé (tâche faite) : affiché barré. */
  done: boolean;
  /** Lien vers la fiche (autres modules) ; null pour un rendez-vous (ouvre le panneau). */
  href: string | null;
  /** Données du rendez-vous à modifier. */
  event: { id: string; values: EventFormInput } | null;
};
