import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { statusToneClasses } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CALENDAR_KIND_LABELS,
  CALENDAR_KIND_TONES,
  CALENDAR_KINDS,
  CALENDAR_VIEW_LABELS,
  CALENDAR_VIEWS,
} from "../constants";
import type { CalendarRange } from "../grid";
import { calendarHref, type CalendarParams } from "../schemas";

/** Navigation (liens : l'état est dans l'URL), choix de la vue et filtres par type. */
export function CalendarToolbar({
  baseUrl,
  params,
  range,
  today,
}: {
  baseUrl: string;
  params: CalendarParams;
  range: CalendarRange;
  today: string;
}) {
  const href = (patch: Partial<CalendarParams>) => calendarHref(baseUrl, { ...params, ...patch }, today);
  const unit = params.view === "month" ? "mois" : "semaine";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label={`${unit === "mois" ? "Mois" : "Semaine"} précédent${unit === "mois" ? "" : "e"}`}>
            <Link href={href({ date: range.previous })}>
              <ChevronLeft aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label={`${unit === "mois" ? "Mois" : "Semaine"} suivant${unit === "mois" ? "" : "e"}`}>
            <Link href={href({ date: range.next })}>
              <ChevronRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={href({ date: today })}>Aujourd’hui</Link>
          </Button>
        </div>
        <h2 className="text-lg font-semibold first-letter:uppercase" aria-live="polite">
          {range.title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Vue" className="inline-flex rounded-md border bg-background p-0.5">
          {CALENDAR_VIEWS.map((v) => (
            <Link
              key={v}
              href={href({ view: v })}
              aria-current={params.view === v ? "page" : undefined}
              className={cn(
                "rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground",
                params.view === v && "bg-muted font-medium text-foreground",
              )}
            >
              {CALENDAR_VIEW_LABELS[v]}
            </Link>
          ))}
        </nav>

        <ul aria-label="Afficher" className="flex flex-wrap gap-1.5">
          {CALENDAR_KINDS.map((kind) => {
            const visible = !params.hidden.includes(kind);
            const hidden = visible ? [...params.hidden, kind] : params.hidden.filter((k) => k !== kind);
            return (
              <li key={kind}>
                <Link
                  href={href({ hidden })}
                  role="switch"
                  aria-checked={visible}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    visible ? "bg-background" : "text-muted-foreground line-through opacity-70",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 rounded-full", statusToneClasses[CALENDAR_KIND_TONES[kind]], "border border-current")}
                  />
                  {CALENDAR_KIND_LABELS[kind]}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
