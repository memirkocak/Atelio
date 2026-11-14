import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { createTestUser } from "./helpers/test-users";

/*
 * Statistiques — valeurs réelles d'un espace dédié (isolatedUser), en série.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "stats", "Simon Stats");

const url = (query = "") => `/w/${me.slug}/statistiques${query}`;
const kpi = (page: Page, label: string) => page.getByRole("article", { name: label });
const kpiValue = (page: Page, label: string) => kpi(page, label).getByTestId("kpi-value");
let clientId = "";

test("compte neuf : indicateurs à zéro et états vides", async ({ page }) => {
  await page.goto(url());
  await expect(page.getByRole("heading", { name: "Statistiques", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "12 derniers mois" })).toHaveAttribute("aria-current", "page");
  await expect(kpiValue(page, "Chiffre d’affaires suivi (HT)")).toHaveText(/^0,00\s€$/);
  await expect(kpiValue(page, "Taux d’acceptation")).toHaveText("—");
  await expect(kpiValue(page, "Panier moyen (HT)")).toHaveText("—");
  await expect(page.getByText("Aucun devis accepté sur la période.").first()).toBeVisible();
  await expect(page.getByText("Aucune tâche.", { exact: true })).toBeVisible();
  await expect(page.getByText("Aucun projet.", { exact: true })).toBeVisible();
});

test("données réelles : indicateurs, meilleurs clients et graphiques après rechargement", async ({ page }) => {
  const admin = adminClient();
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", me.slug).single();
  const workspaceId = ws!.id;
  const { data: client } = await admin
    .from("clients")
    .insert({ workspace_id: workspaceId, kind: "company", company_name: "Maison Opale", contact_name: "Léa" })
    .select("id")
    .single();
  clientId = client!.id;

  const quote = async (qty: string, decision: "accepted" | "refused") => {
    const { data: id } = await admin.rpc("save_quote", {
      p_workspace_id: workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: clientId, title: "Identité visuelle" },
      p_items: [{ label: "Jour", quantity: qty, unit_price_cents: 50000, vat_rate_bp: 2000 }],
    });
    await admin.rpc("set_quote_status", { p_workspace_id: workspaceId, p_quote_id: id!, p_status: "sent" });
    await admin.rpc("set_quote_status", { p_workspace_id: workspaceId, p_quote_id: id!, p_status: decision });
  };
  await quote("2", "accepted"); // 1 000 € HT
  await quote("4", "accepted"); // 2 000 € HT
  await quote("1", "refused");
  const { error } = await admin.from("tasks").insert([
    { workspace_id: workspaceId, title: "Terminée", status: "done", priority: "medium" },
    { workspace_id: workspaceId, title: "Urgente", status: "todo", priority: "urgent" },
  ]);
  expect(error).toBeNull();
  await admin.from("projects").insert({ workspace_id: workspaceId, name: "Livré", status: "completed" });

  await page.goto(url());
  await expect(kpiValue(page, "Chiffre d’affaires suivi (HT)")).toHaveText(/^3\s000,00\s€$/);
  await expect(kpi(page, "Chiffre d’affaires suivi (HT)")).toContainText(/3\s600,00\s€ TTC/);
  await expect(kpi(page, "Chiffre d’affaires suivi (HT)")).toContainText("Nouveau : 0 sur la période de comparaison");
  await expect(kpiValue(page, "Taux d’acceptation")).toHaveText(/^67\s%$/);
  await expect(kpi(page, "Taux d’acceptation")).toContainText("2 acceptés sur 3");
  await expect(kpiValue(page, "Panier moyen (HT)")).toHaveText(/^1\s500,00\s€$/);
  await expect(kpiValue(page, "Devis créés")).toHaveText("3");
  await expect(kpiValue(page, "Devis acceptés")).toHaveText("2");
  await expect(kpiValue(page, "Projets terminés")).toHaveText("1");
  await expect(kpiValue(page, "Tâches terminées")).toHaveText("1");

  const top = page.getByRole("list", { name: "Meilleurs clients" });
  await expect(top.getByRole("link", { name: /Maison Opale/ })).toHaveAttribute("href", `/w/${me.slug}/clients/${clientId}`);
  await expect(top).toContainText(/2 devis\s*3\s000,00\s€/);

  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
  await expect(page.locator("figcaption").filter({ hasText: "Urgente : 1" })).toHaveCount(1);
});

test("changement de période : semaines sur 30 jours, rien l'année précédente", async ({ page }) => {
  await page.goto(url());
  await page.getByRole("link", { name: "30 derniers jours" }).click();
  await expect(page).toHaveURL(url("?periode=30j"));
  await expect(page.getByRole("link", { name: "30 derniers jours" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Chiffre d’affaires accepté par semaine (HT)")).toBeVisible();
  await expect(kpiValue(page, "Chiffre d’affaires suivi (HT)")).toHaveText(/^3\s000,00\s€$/);

  await page.getByRole("link", { name: "Année précédente" }).click();
  await expect(page).toHaveURL(url("?periode=annee-precedente"));
  await expect(page.getByText("Chiffre d’affaires accepté par mois (HT)")).toBeVisible();
  await expect(kpiValue(page, "Chiffre d’affaires suivi (HT)")).toHaveText(/^0,00\s€$/);
  // L'état actuel ne dépend pas de la période
  await expect(page.locator("figcaption").filter({ hasText: "Urgente : 1" })).toHaveCount(1);

  // Paramètre inconnu : 12 mois par défaut
  await page.goto(url("?periode=10ans"));
  await expect(page.getByRole("link", { name: "12 derniers mois" })).toHaveAttribute("aria-current", "page");
});

test("mobile : pas de défilement horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(url());
  await expect(kpiValue(page, "Devis acceptés")).toHaveText("2");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("les statistiques d'un autre espace sont introuvables", async ({ page }) => {
  const other = await createTestUser("Autre Stats");
  await page.goto(`/w/${other.slug}/statistiques`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Devis acceptés" })).toHaveCount(0);
});
