import { CirclePlus, PencilLine, Trash2, type LucideIcon } from "lucide-react";

import { formatDateTime, formatRelative } from "@/lib/format";

import { CLIENT_FIELD_LABELS } from "../constants";
import type { ActivityItem } from "../queries";

const ACTIONS: Record<string, { icon: LucideIcon; verb: string }> = {
  created: { icon: CirclePlus, verb: "Fiche créée" },
  updated: { icon: PencilLine, verb: "Fiche modifiée" },
  deleted: { icon: Trash2, verb: "Fiche supprimée" },
};

/** Historique d'un client, alimenté par le journal d'activité (triggers SQL). */
export function ClientActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">Aucune activité enregistrée.</p>;
  }

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border">
      {items.map((item) => {
        const action = ACTIONS[item.action] ?? ACTIONS.updated!;
        const Icon = action.icon;
        const fields = item.changes.map((c) => CLIENT_FIELD_LABELS[c] ?? c);
        return (
          <li key={item.id} className="relative flex gap-3">
            <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p>
                <span className="font-medium">{action.verb}</span>
                {item.actorName ? <span className="text-muted-foreground"> par {item.actorName}</span> : null}
              </p>
              {fields.length > 0 ? (
                <p className="text-muted-foreground">
                  {fields.length > 1 ? "Champs : " : "Champ : "}
                  {fields.join(", ")}
                </p>
              ) : null}
              <time dateTime={item.created_at} title={formatDateTime(item.created_at)} className="text-xs text-muted-foreground">
                {formatRelative(item.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
