import { describe, expect, it } from "vitest";

import { calendarRange, itemsByDay, weekTitle } from "@/features/calendar/grid";
import {
  calendarHref,
  emptyEventForm,
  eventFormSchema,
  parseCalendarParams,
  toEventFormInput,
  toEventRow,
} from "@/features/calendar/schemas";
import type { CalendarItem } from "@/features/calendar/types";

const form = (over: Partial<ReturnType<typeof emptyEventForm>> = {}) => ({
  ...emptyEventForm("2026-11-20"),
  title: "Point client",
  ...over,
});

describe("formulaire du rendez-vous", () => {
  it("convertit l'heure de Paris en UTC (fin exclusive)", () => {
    const values = eventFormSchema.parse(form({ startTime: "09:30", endTime: "11:00" }));
    expect(toEventRow(values)).toMatchObject({
      starts_at: "2026-11-20T08:30:00.000Z",
      ends_at: "2026-11-20T10:00:00.000Z",
      all_day: false,
      client_id: null,
      location: null,
    });
  });

  it("journée entière : minuit à minuit (heure de Paris), dernier jour inclus", () => {
    const values = eventFormSchema.parse(form({ allDay: true, endDate: "2026-11-22" }));
    expect(toEventRow(values)).toMatchObject({
      starts_at: "2026-11-19T23:00:00.000Z",
      ends_at: "2026-11-22T23:00:00.000Z",
      all_day: true,
    });
  });

  it("aller-retour base ↔ formulaire", () => {
    const timed = form({ startTime: "14:15", endDate: "2026-11-21", endTime: "08:00", location: "Lyon" });
    expect(toEventFormInput(toEventRow(eventFormSchema.parse(timed)))).toEqual(timed);
    const allDay = form({ allDay: true, endDate: "2026-11-22" });
    expect(toEventFormInput(toEventRow(eventFormSchema.parse(allDay)))).toEqual(allDay);
  });

  it("refuse une fin avant le début", () => {
    const sameDay = eventFormSchema.safeParse(form({ startTime: "10:00", endTime: "10:00" }));
    expect(sameDay.success).toBe(false);
    expect(sameDay.error?.issues[0]?.path).toEqual(["endTime"]);
    const allDay = eventFormSchema.safeParse(form({ allDay: true, endDate: "2026-11-19" }));
    expect(allDay.error?.issues[0]?.path).toEqual(["endDate"]);
    // Journée entière d'un seul jour : valide
    expect(eventFormSchema.safeParse(form({ allDay: true })).success).toBe(true);
  });

  it("refuse titre vide, heure ou date invalide, identifiants invalides", () => {
    expect(eventFormSchema.safeParse(form({ title: "  " })).success).toBe(false);
    expect(eventFormSchema.safeParse(form({ startTime: "25:00" })).success).toBe(false);
    expect(eventFormSchema.safeParse(form({ startDate: "2026-02-30" })).success).toBe(false);
    expect(eventFormSchema.safeParse(form({ clientId: "pas-un-uuid" })).success).toBe(false);
    expect(eventFormSchema.safeParse(form({ endDate: "2028-01-01" })).success).toBe(false); // > 1 an
  });
});

describe("période affichée", () => {
  it("mois : semaines complètes du lundi au dimanche", () => {
    const nov = calendarRange("month", "2026-11-14");
    expect(nov.first).toBe("2026-10-26");
    expect(nov.last).toBe("2026-12-06");
    expect(nov.days).toHaveLength(42);
    expect(nov.title).toBe("novembre 2026");
    expect(nov.previous).toBe("2026-10-01");
    expect(nov.next).toBe("2026-12-01");
  });

  it("mois commençant un lundi et février de 4 semaines", () => {
    expect(calendarRange("month", "2027-02-10").days).toHaveLength(28); // 1er = lundi, 28 = dimanche
    expect(calendarRange("month", "2026-06-01").first).toBe("2026-06-01");
  });

  it("semaine : lundi → dimanche, navigation de 7 jours", () => {
    const week = calendarRange("week", "2026-11-15"); // dimanche
    expect(week.days).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
    ]);
    expect(week.previous).toBe("2026-11-02");
    expect(week.next).toBe("2026-11-16");
  });

  it("titres de semaine", () => {
    expect(weekTitle("2026-11-09", "2026-11-15")).toBe("9 – 15 nov. 2026");
    expect(weekTitle("2026-11-30", "2026-12-06")).toBe("30 nov. – 6 déc. 2026");
    expect(weekTitle("2026-12-28", "2027-01-03")).toBe("28 déc. 2026 – 3 janv. 2027");
  });
});

const item = (over: Partial<CalendarItem>): CalendarItem => ({
  key: over.title ?? "x",
  kind: "event",
  title: "x",
  label: "",
  startDate: "2026-11-10",
  endDate: "2026-11-10",
  time: null,
  endTime: null,
  done: false,
  href: null,
  event: null,
  ...over,
});

describe("répartition par jour", () => {
  const days = calendarRange("week", "2026-11-10").days;

  it("trie : sans heure d'abord, puis par heure", () => {
    const byDay = itemsByDay(
      [item({ title: "Tard", time: "16:00" }), item({ title: "Tôt", time: "08:00" }), item({ title: "Échéance" })],
      days,
    );
    expect(byDay["2026-11-10"]!.map((i) => i.title)).toEqual(["Échéance", "Tôt", "Tard"]);
  });

  it("un élément sur plusieurs jours apparaît chaque jour, l'heure seulement le premier", () => {
    const byDay = itemsByDay([item({ title: "Salon", startDate: "2026-11-12", endDate: "2026-11-14", time: "09:00" })], days);
    expect(byDay["2026-11-12"]![0]!.time).toBe("09:00");
    expect(byDay["2026-11-13"]![0]).toMatchObject({ time: null, label: "Suite" });
    expect(byDay["2026-11-14"]).toHaveLength(1);
    expect(byDay["2026-11-15"]).toHaveLength(0);
  });

  it("un élément commencé avant la période est tronqué au premier jour affiché", () => {
    const byDay = itemsByDay([item({ title: "Long", startDate: "2026-11-01", endDate: "2026-11-10" })], days);
    expect(byDay["2026-11-09"]).toHaveLength(1);
    expect(byDay["2026-11-10"]).toHaveLength(1);
    expect(byDay["2026-11-11"]).toHaveLength(0);
  });
});

describe("paramètres d'URL", () => {
  const today = "2026-11-14";

  it("valeurs par défaut et valeurs invalides", () => {
    expect(parseCalendarParams({}, today)).toEqual({ view: "month", date: today, hidden: [] });
    expect(parseCalendarParams({ view: "year", date: "2026-13-01", hide: "x,task,task" }, today)).toEqual({
      view: "month",
      date: today,
      hidden: ["task"],
    });
  });

  it("aller-retour URL", () => {
    const params = { view: "week" as const, date: "2026-12-01", hidden: ["quote" as const, "task" as const] };
    const href = calendarHref("/w/x/calendrier", params, today);
    expect(href).toBe("/w/x/calendrier?view=week&date=2026-12-01&hide=task%2Cquote");
    const qs = Object.fromEntries(new URLSearchParams(href.split("?")[1]));
    expect(parseCalendarParams(qs, today)).toEqual({ ...params, hidden: ["task", "quote"] });
    expect(calendarHref("/w/x/calendrier", { view: "month", date: today, hidden: [] }, today)).toBe("/w/x/calendrier");
  });
});
