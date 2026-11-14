import { z } from "zod";

import { addDaysIso, isIsoDate, parisToUtcIso, todayIso, utcToParis } from "@/lib/dates";

import {
  CALENDAR_KINDS,
  CALENDAR_VIEWS,
  DEFAULT_EVENT_END,
  DEFAULT_EVENT_START,
  type CalendarKind,
  type CalendarView,
} from "./constants";

const optionalUuid = (message: string) =>
  z
    .string()
    .refine((v) => v === "" || z.uuid().safeParse(v).success, message)
    .transform((v) => (v === "" ? null : v));

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v));

const isoDate = (message: string) => z.string().trim().refine(isIsoDate, message);
const time = z
  .string()
  .trim()
  .refine((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Heure invalide.");

/** Instants UTC d'un rendez-vous (fin exclusive ; journée entière = minuit à minuit, heure de Paris). */
export function eventInstants(v: {
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}): { startsAt: string; endsAt: string } {
  if (v.allDay) {
    return { startsAt: parisToUtcIso(v.startDate), endsAt: parisToUtcIso(addDaysIso(v.endDate, 1)) };
  }
  return { startsAt: parisToUtcIso(v.startDate, v.startTime), endsAt: parisToUtcIso(v.endDate, v.endTime) };
}

/** Formulaire du rendez-vous. Règles alignées sur la migration 0008. */
export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Saisissez le titre du rendez-vous.").max(200, "200 caractères maximum."),
    allDay: z.boolean(),
    startDate: isoDate("Date de début invalide."),
    startTime: time,
    endDate: isoDate("Date de fin invalide."),
    endTime: time,
    location: optionalText(200, "Lieu : 200 caractères maximum."),
    clientId: optionalUuid("Client invalide."),
    projectId: optionalUuid("Projet invalide."),
    description: optionalText(5000, "Description : 5000 caractères maximum."),
  })
  .superRefine((v, ctx) => {
    if (!isIsoDate(v.startDate) || !isIsoDate(v.endDate)) return;
    if (v.allDay) {
      if (v.endDate < v.startDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "La fin doit être après le début." });
      }
      return;
    }
    const { startsAt, endsAt } = eventInstants(v);
    if (endsAt <= startsAt) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "La fin doit être après le début." });
    }
  })
  .refine(
    (v) => !isIsoDate(v.startDate) || !isIsoDate(v.endDate) || v.endDate <= addDaysIso(v.startDate, 365),
    { path: ["endDate"], message: "Un rendez-vous ne peut pas durer plus d’un an." },
  );

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventFormValues = z.output<typeof eventFormSchema>;

export function emptyEventForm(date: string = todayIso()): EventFormInput {
  return {
    title: "",
    allDay: false,
    startDate: date,
    startTime: DEFAULT_EVENT_START,
    endDate: date,
    endTime: DEFAULT_EVENT_END,
    location: "",
    clientId: "",
    projectId: "",
    description: "",
  };
}

export function toEventRow(values: EventFormValues) {
  const { startsAt, endsAt } = eventInstants(values);
  return {
    title: values.title,
    all_day: values.allDay,
    starts_at: startsAt,
    ends_at: endsAt,
    location: values.location,
    client_id: values.clientId,
    project_id: values.projectId,
    description: values.description,
  };
}

/** Ligne enregistrée → valeurs du formulaire (dates et heures de Paris). */
export function toEventFormInput(row: {
  title: string;
  all_day: boolean;
  starts_at: string;
  ends_at: string;
  location: string | null;
  client_id: string | null;
  project_id: string | null;
  description: string | null;
}): EventFormInput {
  const start = utcToParis(row.starts_at);
  const end = utcToParis(row.ends_at);
  return {
    title: row.title,
    allDay: row.all_day,
    startDate: start.date,
    startTime: row.all_day ? DEFAULT_EVENT_START : start.time,
    // Journée entière : fin exclusive (minuit du lendemain) → dernier jour inclus
    endDate: row.all_day ? addDaysIso(end.date, -1) : end.date,
    endTime: row.all_day ? DEFAULT_EVENT_END : end.time,
    location: row.location ?? "",
    clientId: row.client_id ?? "",
    projectId: row.project_id ?? "",
    description: row.description ?? "",
  };
}

/* ----------------------------------------------------------------------------
 * Paramètres de la page (URL) — toute valeur invalide retombe sur la valeur par défaut.
 * -------------------------------------------------------------------------- */
export type CalendarParams = { view: CalendarView; date: string; hidden: CalendarKind[] };

const calendarParamsSchema = z.object({
  view: z.enum(CALENDAR_VIEWS).catch("month"),
  date: z
    .string()
    .refine((v) => isIsoDate(v) && v >= "1900-01-01" && v <= "2999-12-31")
    .optional()
    .catch(undefined),
  hide: z.string().max(100).optional().catch(undefined),
});

export function parseCalendarParams(
  searchParams: Record<string, string | string[] | undefined>,
  today: string = todayIso(),
): CalendarParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const parsed = calendarParamsSchema.parse({
    view: first(searchParams.view),
    date: first(searchParams.date),
    hide: first(searchParams.hide),
  });
  const hidden = [...new Set((parsed.hide ?? "").split(","))].filter((k): k is CalendarKind =>
    (CALENDAR_KINDS as readonly string[]).includes(k),
  );
  return { view: parsed.view, date: parsed.date ?? today, hidden };
}

/** URL de la page calendrier pour des paramètres donnés (valeurs par défaut omises). */
export function calendarHref(base: string, params: CalendarParams, today: string = todayIso()): string {
  const qs = new URLSearchParams();
  if (params.view !== "month") qs.set("view", params.view);
  if (params.date !== today) qs.set("date", params.date);
  if (params.hidden.length > 0) {
    qs.set("hide", CALENDAR_KINDS.filter((k) => params.hidden.includes(k)).join(","));
  }
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}
