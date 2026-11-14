import { expect, test, type Page } from "@playwright/test";

import { todayIso } from "@/lib/dates";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { createTestUser } from "./helpers/test-users";

/*
 * Tableau de bord — valeurs réelles d'un espace dédié (isolatedUser), en série :
 * état vide, puis données créées en base et vérifiées après rechargement.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "dashboard", "Dora Tableau");

const url = () => `/w/${me.slug}/tableau-de-bord`;
const kpi = (page: Page, label: string) => page.getByRole("article", { name: label }).getByTestId("kpi-value");
const activity = (page: Page) => page.getByRole("list", { name: "Activité récente" });

function yesterday() {
  const [y, m, d] = todayIso().split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

test("compte neuf : indicateurs à zéro et états vides", async ({ page }) => {
  await page.goto(url());
  await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();
  await expect(kpi(page, "Clients")).toHaveText("0");
  await expect(kpi(page, "Tâches à terminer")).toHaveText("0");
  await expect(kpi(page, "Chiffre d’affaires suivi")).toHaveText(/^0,00\s€$/);
  await expect(page.getByText("Aucune tâche en retard")).toBeVisible();
  await expect(page.getByText("Aucun devis accepté sur les 6 derniers mois.")).toBeVisible();
  await expect(page.getByText("Aucune tâche terminée sur les 8 dernières semaines.")).toBeVisible();
  await expect(page.getByText(/Aucune activité pour l’instant/)).toBeVisible();
});

test("données réelles : indicateurs, graphiques et activité après rechargement", async ({ page }) => {
  const admin = adminClient();
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", me.slug).single();
  const workspaceId = ws!.id;

  const { data: client } = await admin
    .from("clients")
    .insert({ workspace_id: workspaceId, kind: "company", company_name: "Maison Opale", contact_name: "Léa" })
    .select("id")
    .single();
  await admin.from("projects").insert({ workspace_id: workspaceId, name: "Refonte du site", status: "in_progress" });
  // Insertion groupée : mêmes colonnes partout (les absentes seraient envoyées à NULL)
  const { error: tasksError } = await admin.from("tasks").insert([
    { workspace_id: workspaceId, title: "Envoyer la maquette", status: "todo", due_date: yesterday() },
    { workspace_id: workspaceId, title: "Préparer la réunion", status: "todo", due_date: null },
    { workspace_id: workspaceId, title: "Tâche finie", status: "done", due_date: null },
  ]);
  expect(tasksError).toBeNull();
  const save = (quantity: string) =>
    admin.rpc("save_quote", {
      p_workspace_id: workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: client!.id, title: "Identité visuelle" },
      p_items: [{ label: "Logo", quantity, unit_price_cents: 50000, vat_rate_bp: 2000 }],
    });
  const status = (id: string, s: "sent" | "accepted") =>
    admin.rpc("set_quote_status", { p_workspace_id: workspaceId, p_quote_id: id, p_status: s });
  const { data: accepted } = await save("2"); // 1 000 € HT / 1 200 € TTC
  await status(accepted!, "sent");
  await status(accepted!, "accepted");
  const { data: sent } = await save("1"); // 500 € HT / 600 € TTC
  await status(sent!, "sent");

  await page.goto(url());
  await expect(kpi(page, "Clients")).toHaveText("1");
  await expect(kpi(page, "Projets en cours")).toHaveText("1");
  await expect(kpi(page, "Tâches à terminer")).toHaveText("2");
  await expect(page.getByRole("link", { name: "dont 1 en retard" })).toBeVisible();
  await expect(kpi(page, "Devis en attente")).toHaveText("1");
  await expect(kpi(page, "Chiffre d’affaires suivi")).toHaveText(/^1\s200,00\s€$/);
  await expect(page.getByRole("article", { name: "Chiffre d’affaires suivi" })).toContainText(/1\s000,00\s€ HT/);
  await expect(kpi(page, "Pipeline")).toHaveText(/^600,00\s€$/);

  // Graphiques rendus (plus d'état vide) et résumé accessible
  await expect(page.getByText("Aucun devis accepté sur les 6 derniers mois.")).toHaveCount(0);
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
  await expect(page.locator("figcaption").first()).toContainText(/1\s200,00\s€ TTC/);

  // Activité récente : éléments liés à leur fiche
  await expect(activity(page).getByRole("link", { name: "Maison Opale" })).toHaveAttribute(
    "href",
    `/w/${me.slug}/clients/${client!.id}`,
  );
  await expect(activity(page)).toContainText("Tâche créée");

  // Élément supprimé : libellé conservé, sans lien
  await admin.from("projects").delete().eq("workspace_id", workspaceId).eq("name", "Refonte du site");
  await page.reload();
  await expect(kpi(page, "Projets en cours")).toHaveText("0");
  await expect(activity(page)).toContainText("Projet supprimé");
  await expect(activity(page).getByRole("link", { name: "Refonte du site" })).toHaveCount(0);
});

test("les cartes renvoient vers les listes filtrées", async ({ page }) => {
  await page.goto(url());
  await page.getByRole("link", { name: "dont 1 en retard" }).click();
  await expect(page).toHaveURL(`/w/${me.slug}/taches?due=overdue`);
  await expect(page.getByText("Envoyer la maquette").filter({ visible: true })).toBeVisible();

  await page.goto(url());
  await page.getByRole("link", { name: "Chiffre d’affaires suivi" }).click();
  await expect(page).toHaveURL(`/w/${me.slug}/devis?status=accepted`);
});

test("mobile : pas de défilement horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(url());
  await expect(kpi(page, "Clients")).toHaveText("1");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("le tableau de bord d'un autre espace est introuvable", async ({ page }) => {
  const other = await createTestUser("Autre Tableau");
  // Rendu en streaming : la 404 est rendue dans la page (le statut HTTP peut rester 200)
  await page.goto(`/w/${other.slug}/tableau-de-bord`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Clients" })).toHaveCount(0);
});
