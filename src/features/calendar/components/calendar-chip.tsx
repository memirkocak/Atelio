"use client";

import Link from "next/link";

import { statusToneClasses } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

import { CALENDAR_KIND_TONES } from "../constants";
import type { CalendarItem } from "../types";

/**
 * Élément du calendrier : un rendez-vous ouvre le panneau, les autres mènent à leur fiche.
 * « compact » : une ligne (vue mois) ; sinon titre + précision (vue semaine, liste mobile).
 */
export function CalendarChip({
  item,
  compact = false,
  onOpenEvent,
}: {
  item: CalendarItem;
  compact?: boolean;
  onOpenEvent: (item: CalendarItem) => void;
}) {
  const className = cn(
    "block w-full min-w-0 rounded-md px-1.5 py-0.5 text-left text-xs transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    statusToneClasses[CALENDAR_KIND_TONES[item.kind]],
    !compact && "px-2 py-1.5",
  );
  const content = (
    <>
      <span className={cn("block truncate font-medium", item.done && "line-through opacity-70")}>
        {/* Vue détaillée : l'horaire complet est dans la précision */}
        {compact && item.time ? <span className="mr-1 tabular-nums">{item.time}</span> : null}
        {item.title}
      </span>
      {compact ? null : <span className="block truncate opacity-80">{item.label}</span>}
    </>
  );
  const title = `${item.title} — ${item.label}`;

  if (item.event) {
    return (
      <button type="button" className={className} title={title} onClick={() => onOpenEvent(item)}>
        {content}
      </button>
    );
  }
  return (
    <Link href={item.href ?? "#"} className={className} title={title}>
      {content}
    </Link>
  );
}
