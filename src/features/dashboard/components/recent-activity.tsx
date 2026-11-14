import { Briefcase, FileText, ListTodo, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { workspaceHref } from "@/components/layout/navigation";
import type { ActivityEntityType } from "@/features/activity/queries";
import { CLIENT_FIELD_LABELS } from "@/features/clients/constants";
import { PROJECT_FIELD_LABELS } from "@/features/projects/constants";
import { QUOTE_FIELD_LABELS } from "@/features/quotes/constants";
import { TASK_FIELD_LABELS } from "@/features/tasks/constants";
import { formatDateTime, formatRelative } from "@/lib/format";

import type { RecentActivityItem } from "../types";

const ENTITIES: Record<
  ActivityEntityType,
  { icon: LucideIcon; noun: string; feminine: boolean; segment: string | null; fields: Record<string, string> }
> = {
  client: { icon: Users, noun: "Client", feminine: false, segment: "clients", fields: CLIENT_FIELD_LABELS },
  project: { icon: Briefcase, noun: "Projet", feminine: false, segment: "projets", fields: PROJECT_FIELD_LABELS },
  // Les tâches n'ont pas de page de détail : pas de lien.
  task: { icon: ListTodo, noun: "Tâche", feminine: true, segment: null, fields: TASK_FIELD_LABELS },
  quote: { icon: FileText, noun: "Devis", feminine: false, segment: "devis", fields: QUOTE_FIELD_LABELS },
};

const VERBS: Record<RecentActivityItem["action"], string> = {
  created: "créé",
  updated: "modifié",
  deleted: "supprimé",
};

/** « Tâche créée », « Devis modifié »… */
export function activityVerb(entityType: ActivityEntityType, action: RecentActivityItem["action"]): string {
  const entity = ENTITIES[entityType];
  return `${entity.noun} ${VERBS[action]}${entity.feminine ? "e" : ""}`;
}

/*
 * Changements de statut d'un devis, reconnus à leurs colonnes (transitions à sens unique :
 * sent_at, accepted_at et refused_at ne sont renseignés qu'une fois, avec le statut).
 */
const QUOTE_TRANSITIONS = [
  { column: "sent_at", verb: "Devis envoyé" },
  { column: "accepted_at", verb: "Devis accepté" },
  { column: "refused_at", verb: "Devis refusé" },
] as const;

/** Libellé d'un événement et champs modifiés à afficher (libellés français). */
export function describeActivity(item: Pick<RecentActivityItem, "entityType" | "action" | "changes">): {
  verb: string;
  fields: string[];
} {
  const entity = ENTITIES[item.entityType];
  if (item.action !== "updated") return { verb: activityVerb(item.entityType, item.action), fields: [] };
  if (item.entityType === "quote" && item.changes.includes("status")) {
    const transition = QUOTE_TRANSITIONS.find((t) => item.changes.includes(t.column));
    if (transition) return { verb: transition.verb, fields: [] };
  }
  return { verb: activityVerb(item.entityType, item.action), fields: item.changes.map((c) => entity.fields[c] ?? c) };
}

/** Flux d'activité de l'espace, alimenté par le journal (triggers SQL). */
export function RecentActivity({ slug, items }: { slug: string; items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucune activité pour l’instant. Créez un client, un projet ou un devis : chaque action apparaîtra ici.
      </p>
    );
  }

  return (
    <ol className="space-y-4" aria-label="Activité récente">
      {items.map((item) => {
        const entity = ENTITIES[item.entityType];
        const Icon = entity.icon;
        const { verb, fields } = describeActivity(item);
        const href =
          item.exists && entity.segment ? `${workspaceHref(slug, entity.segment)}/${item.entityId}` : null;
        return (
          <li key={item.id} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <span className="text-muted-foreground">{verb} · </span>
                {href ? (
                  <Link href={href} className="font-medium hover:underline">
                    {item.summary}
                  </Link>
                ) : (
                  <span className="font-medium">{item.summary}</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                  {formatRelative(item.createdAt)}
                </time>
                {item.actorName ? ` · ${item.actorName}` : ""}
                {fields.length > 0 ? ` · ${fields.join(", ")}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
