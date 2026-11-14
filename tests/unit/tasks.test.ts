import { describe, expect, it } from "vitest";

import {
  emptyTaskForm,
  includesDone,
  parseTaskListParams,
  quickAddSchema,
  taskFormSchema,
  toTaskFormInput,
  toTaskRow,
} from "@/features/tasks/schemas";
import { addDaysIso, dueRange, endOfWeekIso, isTaskOverdue } from "@/features/tasks/status";

describe("retard d'une tâche", () => {
  const today = "2026-11-14";
  it.each([
    ["à faire, échéance passée", "todo", "2026-11-13", true],
    ["en cours, échéance passée", "in_progress", "2026-10-01", true],
    ["échéance aujourd'hui", "todo", "2026-11-14", false],
    ["terminée, échéance passée", "done", "2026-11-01", false],
    ["sans échéance", "todo", null, false],
  ] as const)("%s → %s", (_label, status, due, expected) => {
    expect(isTaskOverdue({ status, due_date: due }, today)).toBe(expected);
  });
});

describe("filtres d'échéance (semaine du lundi au dimanche)", () => {
  it("additionne des jours en franchissant mois et années", () => {
    expect(addDaysIso("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29"); // année bissextile
  });

  it.each([
    ["samedi", "2026-11-14", "2026-11-15"],
    ["dimanche", "2026-11-15", "2026-11-15"],
    ["lundi", "2026-11-16", "2026-11-22"],
    ["fin d'année", "2026-12-31", "2027-01-03"],
  ])("fin de semaine depuis un %s", (_label, day, expected) => {
    expect(endOfWeekIso(day)).toBe(expected);
  });

  it("traduit chaque filtre en plage de dates", () => {
    expect(dueRange("overdue", "2026-11-14")).toEqual({ kind: "before", date: "2026-11-14" });
    expect(dueRange("today", "2026-11-14")).toEqual({ kind: "between", from: "2026-11-14", to: "2026-11-14" });
    expect(dueRange("week", "2026-11-12")).toEqual({ kind: "between", from: "2026-11-12", to: "2026-11-15" });
    expect(dueRange("none", "2026-11-14")).toEqual({ kind: "none" });
  });
});

describe("formulaires de tâche", () => {
  it("convertit les champs vides et garde les valeurs par défaut", () => {
    const r = taskFormSchema.parse({ ...emptyTaskForm, title: "  Écrire le brief  " });
    expect(toTaskRow(r)).toEqual({
      title: "Écrire le brief",
      project_id: null,
      status: "todo",
      priority: "medium",
      due_date: null,
      description: null,
    });
  });

  it.each([
    ["titre vide", { title: " " }, "Saisissez le titre de la tâche."],
    ["titre trop long", { title: "x".repeat(201) }, "200 caractères maximum."],
    ["échéance invalide", { title: "A", dueDate: "2026-13-01" }, "Échéance invalide."],
    ["projet invalide", { title: "A", projectId: "abc" }, "Projet invalide."],
  ])("refuse : %s", (_label, patch, message) => {
    const r = taskFormSchema.safeParse({ ...emptyTaskForm, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(message);
  });

  it("ajout rapide : titre obligatoire, projet facultatif", () => {
    expect(quickAddSchema.parse({ title: "Appeler Paul", projectId: "" })).toEqual({ title: "Appeler Paul", projectId: null });
    expect(quickAddSchema.safeParse({ title: "", projectId: "" }).success).toBe(false);
  });

  it("aller-retour base ↔ formulaire", () => {
    const input = { ...emptyTaskForm, title: "Relire", priority: "urgent" as const, dueDate: "2026-12-01" };
    expect(toTaskFormInput(toTaskRow(taskFormSchema.parse(input)))).toEqual(input);
  });
});

describe("paramètres de la liste des tâches", () => {
  it("masque les terminées par défaut", () => {
    const p = parseTaskListParams({});
    expect(p).toMatchObject({ q: "", status: undefined, done: undefined, page: 1 });
    expect(includesDone(p)).toBe(false);
    expect(includesDone(parseTaskListParams({ done: "1" }))).toBe(true);
    expect(includesDone(parseTaskListParams({ status: "done" }))).toBe(true);
  });

  it("ignore les valeurs invalides", () => {
    expect(
      parseTaskListParams({ status: "archived", priority: "max", project: "x", due: "demain", done: "oui" }),
    ).toMatchObject({ status: undefined, priority: undefined, project: undefined, due: undefined, done: undefined });
    expect(parseTaskListParams({ project: "none", due: "week", priority: "urgent" })).toMatchObject({
      project: "none",
      due: "week",
      priority: "urgent",
    });
  });
});
