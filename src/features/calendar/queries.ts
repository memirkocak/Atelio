import "server-only";

import { workspaceHref } from "@/components/layout/navigation";
import { addDaysIso, parisToUtcIso, utcToParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

import { MAX_ITEMS_PER_KIND, type CalendarKind } from "./constants";
import { toEventFormInput } from "./schemas";
import type { CalendarItem } from "./types";

type Period = { first: string; last: string };

/** Dernier jour (inclus, Paris) d'un rendez-vous à fin exclusive. */
function lastDayOf(endsAt: string): string {
  return utcToParis(new Date(new Date(endsAt).getTime() - 60_000)).date;
}

async function eventItems(workspaceId: string, period: Period): Promise<CalendarItem[]> {
  const supabase = await createClient();
  // Chevauchement de la période [début, fin) — y compris les rendez-vous commencés avant
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, all_day, client_id, project_id")
    .eq("workspace_id", workspaceId)
    .lt("starts_at", parisToUtcIso(addDaysIso(period.last, 1)))
    .gt("ends_at", parisToUtcIso(period.first))
    .order("starts_at")
    .limit(MAX_ITEMS_PER_KIND);
  if (error) throw error;

  return (data ?? []).map((e) => {
    const start = utcToParis(e.starts_at);
    const end = utcToParis(e.ends_at);
    return {
      key: `event:${e.id}`,
      kind: "event",
      title: e.title,
      label: e.all_day ? "Journée entière" : `${start.time} – ${end.time}`,
      startDate: start.date,
      endDate: lastDayOf(e.ends_at),
      time: e.all_day ? null : start.time,
      endTime: e.all_day ? null : end.time,
      done: false,
      href: null,
      event: { id: e.id, values: toEventFormInput(e) },
    };
  });
}

async function taskItems(workspaceId: string, period: Period, slug: string): Promise<CalendarItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, due_date, project_id")
    .eq("workspace_id", workspaceId)
    .gte("due_date", period.first)
    .lte("due_date", period.last)
    .limit(MAX_ITEMS_PER_KIND);
  if (error) throw error;

  return (data ?? []).map((t) => ({
    key: `task:${t.id}`,
    kind: "task",
    title: t.title,
    label: t.status === "done" ? "Tâche terminée" : "Échéance de la tâche",
    startDate: t.due_date!,
    endDate: t.due_date!,
    time: null,
    endTime: null,
    done: t.status === "done",
    // Pas de fiche tâche : liste filtrée sur le titre (terminées comprises)
    href: `${workspaceHref(slug, "taches")}?${new URLSearchParams({ q: t.title.slice(0, 100), done: "1" })}`,
    event: null,
  }));
}

async function projectItems(workspaceId: string, period: Period, slug: string): Promise<CalendarItem[]> {
  const supabase = await createClient();
  const range = `and(start_date.gte.${period.first},start_date.lte.${period.last}),and(due_date.gte.${period.first},due_date.lte.${period.last})`;
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, start_date, due_date")
    .eq("workspace_id", workspaceId)
    .neq("status", "cancelled")
    .or(range)
    .limit(MAX_ITEMS_PER_KIND);
  if (error) throw error;

  const items: CalendarItem[] = [];
  for (const p of data ?? []) {
    const base = {
      kind: "project" as const,
      title: p.name,
      time: null,
      endTime: null,
      done: p.status === "completed",
      href: `${workspaceHref(slug, "projets")}/${p.id}`,
      event: null,
    };
    if (p.start_date && p.start_date >= period.first && p.start_date <= period.last) {
      items.push({ ...base, key: `project-start:${p.id}`, label: "Début du projet", startDate: p.start_date, endDate: p.start_date });
    }
    if (p.due_date && p.due_date >= period.first && p.due_date <= period.last) {
      items.push({ ...base, key: `project-due:${p.id}`, label: "Échéance du projet", startDate: p.due_date, endDate: p.due_date });
    }
  }
  return items;
}

async function quoteItems(workspaceId: string, period: Period, slug: string): Promise<CalendarItem[]> {
  const supabase = await createClient();
  // Devis envoyés : la fin de validité est la date à surveiller
  const { data, error } = await supabase
    .from("quotes")
    .select("id, number, title, valid_until")
    .eq("workspace_id", workspaceId)
    .eq("status", "sent")
    .gte("valid_until", period.first)
    .lte("valid_until", period.last)
    .limit(MAX_ITEMS_PER_KIND);
  if (error) throw error;

  return (data ?? []).map((q) => ({
    key: `quote:${q.id}`,
    kind: "quote",
    title: `${q.number} · ${q.title}`,
    label: "Fin de validité du devis",
    startDate: q.valid_until,
    endDate: q.valid_until,
    time: null,
    endTime: null,
    done: false,
    href: `${workspaceHref(slug, "devis")}/${q.id}`,
    event: null,
  }));
}

/** Éléments du calendrier sur la période (jours de Paris, bornes incluses), types masqués exclus. */
export async function getCalendarItems(
  workspaceId: string,
  slug: string,
  period: Period,
  hidden: readonly CalendarKind[],
): Promise<CalendarItem[]> {
  const loaders: Record<CalendarKind, () => Promise<CalendarItem[]>> = {
    event: () => eventItems(workspaceId, period),
    task: () => taskItems(workspaceId, period, slug),
    project: () => projectItems(workspaceId, period, slug),
    quote: () => quoteItems(workspaceId, period, slug),
  };
  const lists = await Promise.all(
    (Object.keys(loaders) as CalendarKind[]).filter((k) => !hidden.includes(k)).map((k) => loaders[k]()),
  );
  return lists.flat();
}
