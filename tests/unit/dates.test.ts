import { describe, expect, it } from "vitest";

import { addDaysIso, isoWeekday, parisToUtcIso, startOfWeekIso, utcToParis } from "@/lib/dates";

describe("fuseau Europe/Paris", () => {
  it("hiver (UTC+1) et été (UTC+2)", () => {
    expect(parisToUtcIso("2026-01-15", "10:00")).toBe("2026-01-15T09:00:00.000Z");
    expect(parisToUtcIso("2026-07-15", "10:00")).toBe("2026-07-15T08:00:00.000Z");
  });

  it("minuit à Paris = veille en UTC", () => {
    expect(parisToUtcIso("2026-11-01")).toBe("2026-10-31T23:00:00.000Z");
  });

  it("passage à l'heure d'été (29 mars 2026) : 02:30 n'existe pas → décalé", () => {
    expect(parisToUtcIso("2026-03-29", "01:30")).toBe("2026-03-29T00:30:00.000Z");
    expect(parisToUtcIso("2026-03-29", "03:30")).toBe("2026-03-29T01:30:00.000Z");
    const gap = parisToUtcIso("2026-03-29", "02:30");
    expect(utcToParis(gap).time).toBe("03:30");
  });

  it("passage à l'heure d'hiver (25 oct. 2026) : 02:30 ambiguë → première occurrence", () => {
    expect(parisToUtcIso("2026-10-25", "02:30")).toBe("2026-10-25T00:30:00.000Z");
    expect(parisToUtcIso("2026-10-25", "03:30")).toBe("2026-10-25T02:30:00.000Z");
  });

  it("aller-retour heure murale ↔ UTC", () => {
    for (const [date, time] of [
      ["2026-02-28", "23:45"],
      ["2026-06-01", "00:00"],
      ["2026-12-31", "18:30"],
    ] as const) {
      expect(utcToParis(parisToUtcIso(date, time))).toEqual({ date, time });
    }
  });

  it("UTC → Paris", () => {
    expect(utcToParis("2026-10-31T23:30:00Z")).toEqual({ date: "2026-11-01", time: "00:30" });
    expect(utcToParis("2026-07-14T22:00:00Z")).toEqual({ date: "2026-07-15", time: "00:00" });
  });
});

describe("dates du calendrier", () => {
  it("jour de la semaine ISO et lundi de la semaine", () => {
    expect(isoWeekday("2026-11-16")).toBe(1); // lundi
    expect(isoWeekday("2026-11-15")).toBe(7); // dimanche
    expect(startOfWeekIso("2026-11-15")).toBe("2026-11-09");
    expect(startOfWeekIso("2026-11-16")).toBe("2026-11-16");
    expect(startOfWeekIso("2027-01-01")).toBe("2026-12-28");
  });

  it("ajout de jours", () => {
    expect(addDaysIso("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
  });
});
