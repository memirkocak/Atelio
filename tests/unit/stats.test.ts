import { describe, expect, it } from "vitest";

import {
  acceptanceRate,
  averageBasket,
  parsePeriodParam,
  pointsDifference,
  resolvePeriod,
  variation,
} from "@/features/stats/periods";
import {
  bucketLabels,
  formatPercent,
  projectStatusDistribution,
  taskPriorityDistribution,
  taskStatusDistribution,
} from "@/features/stats/series";

const today = "2026-11-14"; // samedi

describe("périodes", () => {
  it("30 derniers jours : comparés aux 30 jours précédents", () => {
    expect(resolvePeriod("30j", today)).toMatchObject({
      from: "2026-10-16",
      to: today,
      previousFrom: "2026-09-16",
      previousTo: "2026-10-15",
    });
  });

  it("3 mois : 13 semaines complètes à partir d'un lundi", () => {
    const p = resolvePeriod("3m", today);
    // Lundis du 17 août au 9 novembre : 13 semaines (la dernière en cours)
    expect(p.from).toBe("2026-08-17");
    expect(new Date(`${p.from}T12:00:00Z`).getUTCDay()).toBe(1);
    expect(p.previousTo).toBe("2026-08-16");
  });

  it("6 et 12 mois : à partir du 1er du mois", () => {
    expect(resolvePeriod("6m", today).from).toBe("2026-06-01");
    expect(resolvePeriod("12m", today)).toMatchObject({ from: "2025-12-01", previousTo: "2025-11-30" });
  });

  it("année en cours : comparée aux mêmes dates l'année précédente", () => {
    expect(resolvePeriod("annee", today)).toMatchObject({
      from: "2026-01-01",
      to: today,
      previousFrom: "2025-01-01",
      previousTo: "2025-11-14",
      comparisonLabel: "vs même période en 2025",
    });
    expect(resolvePeriod("annee", "2028-02-29").previousTo).toBe("2027-02-28");
  });

  it("année précédente : année civile complète", () => {
    expect(resolvePeriod("annee-precedente", today)).toMatchObject({
      from: "2025-01-01",
      to: "2025-12-31",
      previousFrom: "2024-01-01",
      previousTo: "2024-12-31",
    });
  });

  it("paramètre d'URL invalide → 12 mois", () => {
    expect(parsePeriodParam({})).toBe("12m");
    expect(parsePeriodParam({ periode: "5ans" })).toBe("12m");
    expect(parsePeriodParam({ periode: ["30j", "6m"] })).toBe("30j");
  });
});

describe("variations et indicateurs", () => {
  it("variation en %", () => {
    expect(variation(118, 100)).toEqual({ kind: "up", percent: 18 });
    expect(variation(50, 100)).toEqual({ kind: "down", percent: 50 });
    expect(variation(100, 100)).toEqual({ kind: "flat" });
    expect(variation(5, 0)).toEqual({ kind: "new" });
    expect(variation(0, 0)).toEqual({ kind: "none" });
  });

  it("écart de taux en points", () => {
    expect(pointsDifference(0.6, 0.45)).toBe(15);
    expect(pointsDifference(0.5, null)).toBeNull();
  });

  it("taux d'acceptation : refusés et expirés comptent comme non acceptés", () => {
    expect(acceptanceRate({ accepted: { count: 4 }, refused: 1, expired: 1 })).toBeCloseTo(4 / 6);
    expect(acceptanceRate({ accepted: { count: 0 }, refused: 0, expired: 0 })).toBeNull();
  });

  it("panier moyen HT arrondi au centime", () => {
    expect(averageBasket({ accepted: { count: 3, subtotal_cents: 100000 } })).toBe(33333);
    expect(averageBasket({ accepted: { count: 0, subtotal_cents: 0 } })).toBeNull();
  });

  it("pourcentage français", () => {
    expect(formatPercent(0.6667).replace(/\s/g, " ")).toBe("67 %");
  });
});

describe("libellés et répartitions", () => {
  it("tranches mensuelles et hebdomadaires", () => {
    expect(bucketLabels("2025-12-01", "month")).toEqual({ label: "déc. 25", fullLabel: "décembre 2025" });
    expect(bucketLabels("2026-11-09", "week")).toEqual({ label: "9 nov.", fullLabel: "Semaine du 9 nov. 2026" });
  });

  it("répartitions dans l'ordre métier, zéros compris", () => {
    expect(taskStatusDistribution({ tasks_by_status: { done: 2 } }).map((d) => [d.key, d.count])).toEqual([
      ["todo", 0],
      ["in_progress", 0],
      ["done", 2],
    ]);
    expect(taskPriorityDistribution({ open_tasks_by_priority: { urgent: 1 } })[0]).toMatchObject({ key: "urgent", count: 1 });
    expect(projectStatusDistribution({ projects_by_status: {} })).toHaveLength(5);
  });
});
