import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { addDaysIso, isoWeekday, startOfWeekIso } from "@/lib/dates";

import type { CalendarView } from "./constants";
import type { CalendarItem } from "./types";

function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

/** Formate une date « AAAA-MM-JJ » (sans effet de fuseau). */
export function formatDay(iso: string, pattern: string): string {
  return format(toLocalDate(iso), pattern, { locale: fr });
}

function firstOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function shiftMonth(iso: string, months: number): string {
  const [y, m] = iso.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return date.toISOString().slice(0, 10);
}

function lastOfMonth(iso: string): string {
  return addDaysIso(shiftMonth(iso, 1), -1);
}

export type CalendarRange = {
  /** Jours affichés, du lundi au dimanche (semaines complètes). */
  days: string[];
  first: string;
  last: string;
  title: string;
  previous: string;
  next: string;
};

/** Période affichée : mois (semaines complètes, 4 à 6) ou semaine (lundi → dimanche). */
export function calendarRange(view: CalendarView, date: string): CalendarRange {
  let first: string;
  let last: string;
  let title: string;
  let previous: string;
  let next: string;

  if (view === "month") {
    first = startOfWeekIso(firstOfMonth(date));
    const monthEnd = lastOfMonth(date);
    last = addDaysIso(monthEnd, 7 - isoWeekday(monthEnd));
    title = formatDay(firstOfMonth(date), "MMMM yyyy");
    previous = shiftMonth(date, -1);
    next = shiftMonth(date, 1);
  } else {
    first = startOfWeekIso(date);
    last = addDaysIso(first, 6);
    title = weekTitle(first, last);
    previous = addDaysIso(first, -7);
    next = addDaysIso(first, 7);
  }

  const days: string[] = [];
  for (let d = first; d <= last; d = addDaysIso(d, 1)) days.push(d);
  return { days, first, last, title, previous, next };
}

/** « 9 – 15 nov. 2026 », « 30 nov. – 6 déc. 2026 », « 28 déc. 2026 – 3 janv. 2027 ». */
export function weekTitle(first: string, last: string): string {
  if (first.slice(0, 4) !== last.slice(0, 4)) {
    return `${formatDay(first, "d MMM yyyy")} – ${formatDay(last, "d MMM yyyy")}`;
  }
  if (first.slice(0, 7) !== last.slice(0, 7)) {
    return `${formatDay(first, "d MMM")} – ${formatDay(last, "d MMM yyyy")}`;
  }
  return `${formatDay(first, "d")} – ${formatDay(last, "d MMM yyyy")}`;
}

/** Ordre dans une journée : éléments sans heure d'abord, puis par heure, puis par titre. */
export function compareItems(a: CalendarItem, b: CalendarItem): number {
  if (a.time === null && b.time !== null) return -1;
  if (a.time !== null && b.time === null) return 1;
  if (a.time !== null && b.time !== null && a.time !== b.time) return a.time < b.time ? -1 : 1;
  return a.title.localeCompare(b.title, "fr");
}

/**
 * Répartit les éléments sur les jours affichés (un élément sur plusieurs jours apparaît
 * chaque jour ; son heure n'est affichée que le premier jour).
 */
export function itemsByDay(items: CalendarItem[], days: string[]): Record<string, CalendarItem[]> {
  const result: Record<string, CalendarItem[]> = Object.fromEntries(days.map((d) => [d, []]));
  const first = days[0];
  const last = days.at(-1);
  if (!first || !last) return result;

  for (const item of items) {
    const from = item.startDate > first ? item.startDate : first;
    const to = item.endDate < last ? item.endDate : last;
    for (let d = from; d <= to; d = addDaysIso(d, 1)) {
      result[d]?.push(d === item.startDate ? item : { ...item, time: null, endTime: null, label: "Suite" });
    }
  }
  for (const d of days) result[d]!.sort(compareItems);
  return result;
}
