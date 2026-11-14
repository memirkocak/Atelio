import { describe, expect, it } from "vitest";

import { activityVerb, describeActivity } from "@/features/dashboard/components/recent-activity";
import { dashboardStatsSchema } from "@/features/dashboard/schemas";
import {
  formatCompactEuros,
  isEmptySeries,
  monthLabels,
  revenueSeries,
  tasksSeries,
  weekLabels,
} from "@/features/dashboard/series";

const amounts = { count: 0, subtotal_cents: 0, total_cents: 0 };
const valid = {
  today: "2026-11-14",
  clients: 3,
  projects_in_progress: 1,
  tasks_open: 2,
  tasks_overdue: 1,
  revenue: amounts,
  pipeline: amounts,
  revenue_by_month: [{ month: "2026-11", subtotal_cents: 10000, total_cents: 12000 }],
  tasks_completed_by_week: [{ week_start: "2026-11-09", count: 2 }],
};

describe("schéma de la réponse SQL", () => {
  it("accepte une réponse valide", () => {
    expect(dashboardStatsSchema.parse(valid)).toEqual(valid);
  });

  it("refuse un montant décimal ou négatif (jamais de flottant pour l'argent)", () => {
    expect(dashboardStatsSchema.safeParse({ ...valid, revenue: { ...amounts, total_cents: 12.5 } }).success).toBe(false);
    expect(dashboardStatsSchema.safeParse({ ...valid, clients: -1 }).success).toBe(false);
  });

  it("refuse une réponse incomplète", () => {
    const incomplete: Partial<typeof valid> = { ...valid };
    delete incomplete.pipeline;
    expect(dashboardStatsSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe("séries des graphiques", () => {
  it("libellés de mois en français", () => {
    expect(monthLabels("2026-11")).toEqual({ label: "nov.", fullLabel: "novembre 2026" });
    expect(monthLabels("2027-01")).toEqual({ label: "janv.", fullLabel: "janvier 2027" });
  });

  it("libellés de semaine (lundi)", () => {
    expect(weekLabels("2026-11-09")).toEqual({ label: "9 nov.", fullLabel: "Semaine du 9 nov. 2026" });
  });

  it("transforme les séries sans perdre de valeur", () => {
    expect(revenueSeries(valid)).toEqual([
      { label: "nov.", fullLabel: "novembre 2026", totalCents: 12000, subtotalCents: 10000 },
    ]);
    expect(tasksSeries(valid)).toEqual([{ label: "9 nov.", fullLabel: "Semaine du 9 nov. 2026", count: 2 }]);
  });

  it("série vide = uniquement des zéros", () => {
    expect(isEmptySeries([0, 0, 0])).toBe(true);
    expect(isEmptySeries([])).toBe(true);
    expect(isEmptySeries([0, 1])).toBe(false);
  });

  it("montants compacts sur l'axe", () => {
    const nbsp = /[\s  ]/g;
    expect(formatCompactEuros(1_250_000).replace(nbsp, " ")).toBe("12,5 k €");
    expect(formatCompactEuros(0).replace(nbsp, " ")).toBe("0 €");
  });
});

describe("libellés du flux d'activité", () => {
  it("accorde le participe passé", () => {
    expect(activityVerb("client", "created")).toBe("Client créé");
    expect(activityVerb("task", "created")).toBe("Tâche créée");
    expect(activityVerb("task", "deleted")).toBe("Tâche supprimée");
    expect(activityVerb("quote", "updated")).toBe("Devis modifié");
    expect(activityVerb("project", "deleted")).toBe("Projet supprimé");
  });

  it("reconnaît les changements de statut d'un devis", () => {
    const quote = (changes: string[]) => describeActivity({ entityType: "quote", action: "updated", changes });
    expect(quote(["client_snapshot", "issuer_snapshot", "sent_at", "status"])).toEqual({ verb: "Devis envoyé", fields: [] });
    expect(quote(["accepted_at", "status"])).toEqual({ verb: "Devis accepté", fields: [] });
    expect(quote(["refused_at", "status"])).toEqual({ verb: "Devis refusé", fields: [] });
  });

  it("modification ordinaire : champs traduits", () => {
    expect(describeActivity({ entityType: "quote", action: "updated", changes: ["title"] }).verb).toBe("Devis modifié");
    expect(describeActivity({ entityType: "client", action: "updated", changes: ["phone"] })).toEqual({
      verb: "Client modifié",
      fields: ["téléphone"],
    });
    expect(describeActivity({ entityType: "task", action: "created", changes: [] }).fields).toEqual([]);
  });
});
