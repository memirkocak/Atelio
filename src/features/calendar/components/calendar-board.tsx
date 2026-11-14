"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MAX_ITEMS_PER_CELL, type CalendarKind, type CalendarView } from "../constants";
import { formatDay } from "../grid";
import { calendarHref, emptyEventForm } from "../schemas";
import type { CalendarItem, Option } from "../types";

import { CalendarChip } from "./calendar-chip";
import { EventSheet, type EventSheetTarget } from "./event-sheet";

type BoardProps = {
  slug: string;
  baseUrl: string;
  view: CalendarView;
  /** Date de référence (mois affiché / semaine affichée). */
  date: string;
  today: string;
  hidden: CalendarKind[];
  days: string[];
  byDay: Record<string, CalendarItem[]>;
  clientOptions: Option[];
  projectOptions: Option[];
  toolbar: ReactNode;
};

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** Calendrier interactif : vues mois / semaine et panneau des rendez-vous. */
export function CalendarBoard(props: BoardProps) {
  const { slug, view, days, byDay, today } = props;
  const [target, setTarget] = useState<EventSheetTarget | null>(null);

  const openCreate = (day: string) => setTarget({ mode: "create", values: emptyEventForm(day) });
  const openEvent = (item: CalendarItem) => {
    if (item.event) setTarget({ mode: "edit", eventId: item.event.id, values: item.event.values });
  };
  const defaultDay = days.includes(today) ? today : (view === "month" ? `${props.date.slice(0, 7)}-01` : days[0]!);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {props.toolbar}
        <Button className="shrink-0 self-start lg:self-auto" onClick={() => openCreate(defaultDay)}>
          <Plus aria-hidden />
          Nouveau rendez-vous
        </Button>
      </div>

      {view === "month" ? (
        <MonthView {...props} onCreate={openCreate} onOpenEvent={openEvent} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
          {days.map((day) => (
            <DayColumn
              key={day}
              day={day}
              today={today}
              items={byDay[day] ?? []}
              onCreate={openCreate}
              onOpenEvent={openEvent}
              showEmpty
            />
          ))}
        </div>
      )}

      <EventSheet
        slug={slug}
        target={target}
        onClose={() => setTarget(null)}
        clientOptions={props.clientOptions}
        projectOptions={props.projectOptions}
      />
    </div>
  );
}

function AddButton({ day, onCreate, className }: { day: string; onCreate: (day: string) => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onCreate(day)}
      aria-label={`Ajouter un rendez-vous le ${formatDay(day, "d MMMM yyyy")}`}
      className={cn(
        "flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}

/** Colonne d'un jour (vue semaine) ou bloc d'un jour (liste mobile de la vue mois). */
function DayColumn({
  day,
  today,
  items,
  onCreate,
  onOpenEvent,
  showEmpty,
}: {
  day: string;
  today: string;
  items: CalendarItem[];
  onCreate: (day: string) => void;
  onOpenEvent: (item: CalendarItem) => void;
  showEmpty: boolean;
}) {
  const isToday = day === today;
  return (
    <section
      aria-label={formatDay(day, "EEEE d MMMM yyyy")}
      className={cn("flex min-w-0 flex-col gap-2 rounded-lg border bg-background p-2", isToday && "border-primary")}
    >
      <header className="flex items-center justify-between gap-1">
        <h3 className={cn("text-sm font-medium first-letter:uppercase", isToday && "text-primary")}>
          {formatDay(day, "EEE d")}
          <span className="sr-only">{isToday ? " (aujourd’hui)" : ""}</span>
        </h3>
        <AddButton day={day} onCreate={onCreate} />
      </header>
      {items.length === 0 ? (
        showEmpty ? (
          <p className="text-xs text-muted-foreground">Rien de prévu</p>
        ) : null
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.key}>
              <CalendarChip item={item} onOpenEvent={onOpenEvent} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MonthView({
  baseUrl,
  date,
  today,
  hidden,
  days,
  byDay,
  onCreate,
  onOpenEvent,
}: BoardProps & { onCreate: (day: string) => void; onOpenEvent: (item: CalendarItem) => void }) {
  const month = date.slice(0, 7);
  const weekHref = (day: string) => calendarHref(baseUrl, { view: "week", date: day, hidden }, today);
  const monthDaysWithItems = days.filter((d) => d.startsWith(month) && (byDay[d]?.length ?? 0) > 0);

  return (
    <>
      {/* Grille (tablette et ordinateur) */}
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <div className="grid grid-cols-7 border-b bg-muted/40" aria-hidden>
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = byDay[day] ?? [];
            const extra = items.length - MAX_ITEMS_PER_CELL;
            const inMonth = day.startsWith(month);
            const isToday = day === today;
            return (
              <div
                key={day}
                role="group"
                aria-label={formatDay(day, "EEEE d MMMM yyyy")}
                className={cn(
                  "group flex min-h-28 min-w-0 flex-col gap-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      !inMonth && "text-muted-foreground",
                      isToday && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  <AddButton
                    day={day}
                    onCreate={onCreate}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  />
                </div>
                <ul className="flex min-w-0 flex-col gap-1">
                  {items.slice(0, MAX_ITEMS_PER_CELL).map((item) => (
                    <li key={item.key} className="min-w-0">
                      <CalendarChip item={item} compact onOpenEvent={onOpenEvent} />
                    </li>
                  ))}
                </ul>
                {extra > 0 ? (
                  <Link href={weekHref(day)} className="px-1.5 text-xs text-muted-foreground hover:text-foreground">
                    +{extra} autre{extra > 1 ? "s" : ""}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile : mini-grille + liste des jours occupés */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="grid grid-cols-7 rounded-lg border bg-background p-2 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} aria-hidden className="pb-1 text-[11px] text-muted-foreground">
              {d.slice(0, 1).toUpperCase()}
            </span>
          ))}
          {days.map((day) => {
            const count = byDay[day]?.length ?? 0;
            const inMonth = day.startsWith(month);
            return (
              <Link
                key={day}
                href={weekHref(day)}
                aria-label={`${formatDay(day, "EEEE d MMMM")} : ${count} élément${count > 1 ? "s" : ""}`}
                className={cn(
                  "flex h-10 flex-col items-center justify-center gap-0.5 rounded-md text-sm tabular-nums",
                  !inMonth && "text-muted-foreground/60",
                  day === today && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {Number(day.slice(8))}
                <span className={cn("size-1 rounded-full", count > 0 ? "bg-current" : "bg-transparent")} />
              </Link>
            );
          })}
        </div>
        {monthDaysWithItems.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-background p-4 text-center text-muted-foreground">
            Rien de prévu ce mois-ci.
          </p>
        ) : (
          monthDaysWithItems.map((day) => (
            <DayColumn
              key={day}
              day={day}
              today={today}
              items={byDay[day] ?? []}
              onCreate={onCreate}
              onOpenEvent={onOpenEvent}
              showEmpty={false}
            />
          ))
        )}
      </div>
    </>
  );
}
