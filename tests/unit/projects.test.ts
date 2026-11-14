import { describe, expect, it } from "vitest";

import {
  emptyProjectForm,
  parseProjectListParams,
  projectFormSchema,
  toProjectFormInput,
  toProjectRow,
} from "@/features/projects/schemas";
import { isProjectOverdue } from "@/features/projects/status";
import { formatIsoDate, isIsoDate, todayIso } from "@/lib/dates";
import { centsToInput, formatCents, parseEuroInput } from "@/lib/money";

describe("argent (centimes)", () => {
  it.each([
    ["1500", 150000],
    ["1 500,50", 150050],
    ["1500.5", 150050],
    ["1 500,05 €", 150005],
    ["0,99", 99],
    ["", null],
  ])("parseEuroInput(%j) = %j", (input, expected) => {
    expect(parseEuroInput(input)).toBe(expected);
  });

  it.each(["12,345", "-5", "abc", "1,2,3", "1.000,00"])("refuse %j", (input) => {
    expect(parseEuroInput(input)).toBeNaN();
  });

  it("formate et réaffiche sans perte (pas de flottant)", () => {
    expect(formatCents(150050).replace(/\s/g, " ")).toBe("1 500,50 €");
    expect(centsToInput(150050)).toBe("1500,5");
    expect(centsToInput(null)).toBe("");
    // 0,1 + 0,2 en flottant ≠ 0,3 : les centimes restent exacts
    expect(parseEuroInput("0,10")! + parseEuroInput("0,20")!).toBe(30);
  });
});

describe("dates", () => {
  it("valide le format ISO et les dates impossibles", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("28/02/2026")).toBe(false);
  });

  it("calcule le jour à Paris, indépendamment du fuseau du serveur", () => {
    // 23h30 UTC le 31 décembre = 0h30 le 1er janvier à Paris
    expect(todayIso(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("formate une date seule sans décalage", () => {
    expect(formatIsoDate("2026-12-01")).toBe("1 déc. 2026");
  });
});

describe("retard d'un projet", () => {
  const today = "2026-11-14";
  it.each([
    ["en cours, échéance passée", "in_progress", "2026-11-13", true],
    ["à venir, échéance passée", "upcoming", "2026-11-01", true],
    ["échéance aujourd'hui", "in_progress", "2026-11-14", false],
    ["terminé, échéance passée", "completed", "2026-11-01", false],
    ["annulé, échéance passée", "cancelled", "2026-11-01", false],
    ["sans échéance", "in_progress", null, false],
  ] as const)("%s → %s", (_label, status, due, expected) => {
    expect(isProjectOverdue({ status, due_date: due }, today)).toBe(expected);
  });
});

describe("formulaire projet", () => {
  const valid = { ...emptyProjectForm, name: "Refonte" };

  it("convertit budget, dates et champs vides", () => {
    const r = projectFormSchema.parse({ ...valid, budget: "1 500,50", startDate: "2026-11-01", dueDate: "" });
    expect(toProjectRow(r)).toEqual({
      name: "Refonte",
      client_id: null,
      status: "upcoming",
      budget_cents: 150050,
      start_date: "2026-11-01",
      due_date: null,
      progress: 0,
      description: null,
    });
  });

  it.each([
    ["échéance avant le début", { startDate: "2026-12-10", dueDate: "2026-12-01" }, "L’échéance ne peut pas précéder la date de début."],
    ["budget invalide", { budget: "12,345" }, "Montant invalide (ex. 1 500,50)."],
    ["date invalide", { dueDate: "2026-02-30" }, "Échéance invalide."],
    ["avancement hors limites", { progress: 120 }, "Entre 0 et 100 %."],
    ["client invalide", { clientId: "pas-un-uuid" }, "Client invalide."],
    ["nom manquant", { name: "  " }, "Saisissez le nom du projet."],
  ])("refuse : %s", (_label, patch, message) => {
    const r = projectFormSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(message);
  });

  it("aller-retour base ↔ formulaire", () => {
    const input = { ...valid, budget: "1500,5", startDate: "2026-11-01", progress: 40 };
    expect(toProjectFormInput(toProjectRow(projectFormSchema.parse(input)))).toEqual(input);
  });
});

describe("paramètres de la liste projets", () => {
  it("valeurs par défaut et valeurs invalides ignorées", () => {
    expect(parseProjectListParams({})).toEqual({
      q: "",
      status: undefined,
      client: undefined,
      sort: "due",
      page: 1,
      view: "tableau",
    });
    expect(parseProjectListParams({ status: "deleted", client: "x", view: "grille", sort: "x" })).toMatchObject({
      status: undefined,
      client: undefined,
      view: "tableau",
      sort: "due",
    });
    expect(parseProjectListParams({ status: "on_hold", view: "kanban" })).toMatchObject({
      status: "on_hold",
      view: "kanban",
    });
  });
});
