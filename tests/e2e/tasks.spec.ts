import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { byText } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

/*
 * Module Tâches — parcours complet sur un espace dédié à ce fichier (isolatedUser).
 * Exécution en série : les tests partagent un même jeu de données.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "tasks", "Camille Tâches");

const base = () => `/w/${me.slug}`;
const tasksUrl = () => `${base()}/taches`;
const PROJECT = "Site vitrine";
let projectId = "";

async function quickAdd(page: Page, title: string) {
  const input = page.getByRole("textbox", { name: "Nouvelle tâche" });
  await input.fill(title);
  await input.press("Enter");
  await expect(input).toHaveValue("");
}

const taskItem = (page: Page, title: string) => page.locator(`li[data-task="${title}"]`).filter({ visible: true });

test.beforeAll(async () => {
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", me.slug).single();
  const { data: p } = await adminClient()
    .from("projects")
    .insert({ workspace_id: ws!.id, name: PROJECT, status: "in_progress" })
    .select("id")
    .single();
  projectId = p!.id;
});

test("état vide puis ajout rapide de tâches", async ({ page }) => {
  await page.goto(tasksUrl());
  await expect(page.getByRole("heading", { name: "Aucune tâche pour l’instant" })).toBeVisible();

  await quickAdd(page, "Rédiger le cahier des charges");
  await expect(taskItem(page, "Rédiger le cahier des charges")).toBeVisible();
  await quickAdd(page, "Appeler le client");
  await expect(taskItem(page, "Appeler le client")).toBeVisible();
  await expect(byText(page, "2 tâches à terminer")).toBeVisible();
});

test("modification dans le panneau : projet, priorité urgente, échéance passée → en retard", async ({ page }) => {
  await page.goto(tasksUrl());
  await taskItem(page, "Appeler le client").getByRole("button", { name: "Appeler le client" }).click();
  const sheet = page.getByRole("dialog", { name: "Modifier la tâche" });
  await sheet.getByRole("combobox", { name: "Projet" }).click();
  await page.getByRole("option", { name: PROJECT }).click();
  await sheet.getByRole("combobox", { name: "Priorité" }).click();
  await page.getByRole("option", { name: "Urgente" }).click();
  await sheet.getByLabel("Échéance").fill("2020-03-01");
  await sheet.getByRole("button", { name: "Enregistrer" }).click();
  await expect(sheet).toBeHidden();

  const item = taskItem(page, "Appeler le client");
  await expect(item).toContainText(PROJECT);
  await expect(item).toContainText("en retard");
  await expect(item.getByTitle("Priorité urgente")).toBeVisible();
  await expect(page.getByRole("link", { name: "1 en retard" })).toBeVisible();
});

test("cocher une tâche : terminée, masquée, annulable et persistée", async ({ page }) => {
  await page.goto(tasksUrl());
  const check = () =>
    taskItem(page, "Rédiger le cahier des charges")
      .getByRole("checkbox", { name: "Marquer « Rédiger le cahier des charges » comme terminée" })
      .click();

  // Annulation depuis la notification : la tâche revient
  await check();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toHaveCount(0); // terminées masquées
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toBeVisible();

  await check();
  await expect(byText(page, "Tâche terminée").first()).toBeVisible();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toHaveCount(0);

  await page.reload();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toHaveCount(0);
  await page.getByRole("button", { name: "Afficher les terminées" }).click();
  await expect(page).toHaveURL(/done=1/);
  const done = taskItem(page, "Rédiger le cahier des charges");
  await expect(done.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");

  // Rouvrir
  await done.getByRole("checkbox").click();
  await expect(done.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(taskItem(page, "Rédiger le cahier des charges").getByRole("checkbox")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("filtres : en retard, priorité, projet ; recherche sans accents", async ({ page }) => {
  await page.goto(tasksUrl());
  await page.getByRole("link", { name: "1 en retard" }).click();
  await expect(page).toHaveURL(/due=overdue/);
  await expect(taskItem(page, "Appeler le client")).toBeVisible();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toHaveCount(0);

  await page.goto(tasksUrl());
  await page.getByRole("combobox", { name: "Filtrer par projet" }).click();
  await page.getByRole("option", { name: "Sans projet" }).click();
  await expect(taskItem(page, "Rédiger le cahier des charges")).toBeVisible();
  await expect(taskItem(page, "Appeler le client")).toHaveCount(0);

  await page.goto(tasksUrl());
  await page.getByRole("searchbox", { name: "Rechercher une tâche" }).fill("rediger");
  await expect(page).toHaveURL(/q=rediger/);
  await expect(taskItem(page, "Rédiger le cahier des charges")).toBeVisible();
  await expect(taskItem(page, "Appeler le client")).toHaveCount(0);
});

test("fiche projet : tâches du projet, compteur et ajout rapide rattaché", async ({ page }) => {
  await page.goto(`${base()}/projets/${projectId}`);
  await expect(page.getByRole("heading", { level: 1, name: PROJECT })).toBeVisible();
  await expect(taskItem(page, "Appeler le client")).toBeVisible();
  await expect(byText(page, "0 / 1 terminée")).toBeVisible();

  await page.getByRole("textbox", { name: "Nouvelle tâche" }).fill("Préparer la maquette");
  await page.getByRole("textbox", { name: "Nouvelle tâche" }).press("Enter");
  await expect(taskItem(page, "Préparer la maquette")).toBeVisible();
  await expect(byText(page, "0 / 2 terminée")).toBeVisible();

  await taskItem(page, "Préparer la maquette").getByRole("checkbox").click();
  await expect(byText(page, "1 / 2 terminée")).toBeVisible();
});

test("supprimer le projet détache ses tâches", async ({ page }) => {
  await page.goto(`${base()}/projets/${projectId}`);
  await page.getByRole("button", { name: "Supprimer" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer ce projet ?" });
  await expect(dialog).toContainText("2 tâches sont rattachées à ce projet");
  await dialog.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(`${base()}/projets`);

  await page.goto(tasksUrl());
  await expect(taskItem(page, "Appeler le client")).toBeVisible();
  await expect(taskItem(page, "Appeler le client")).not.toContainText(PROJECT);
});

test("suppression d'une tâche depuis le panneau", async ({ page }) => {
  await page.goto(tasksUrl());
  await taskItem(page, "Appeler le client").getByRole("button", { name: "Appeler le client" }).click();
  const sheet = page.getByRole("dialog", { name: "Modifier la tâche" });
  await sheet.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("alertdialog", { name: "Supprimer cette tâche ?" }).getByRole("button", { name: "Supprimer" }).click();
  await expect(byText(page, "Tâche supprimée")).toBeVisible();
  await expect(taskItem(page, "Appeler le client")).toHaveCount(0);
});

test("mobile, et tâche d'un autre espace invisible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(tasksUrl());
  await expect(taskItem(page, "Rédiger le cahier des charges")).toBeVisible();
  const box = await taskItem(page, "Rédiger le cahier des charges").getByRole("checkbox").boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(32); // zone tactile

  const other = await createTestUser("Autre Tâche");
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", other.slug).single();
  await adminClient().from("tasks").insert({ workspace_id: ws!.id, title: "Tâche confidentielle" });
  await page.getByRole("searchbox", { name: "Rechercher une tâche" }).fill("confidentielle");
  await expect(page.getByRole("heading", { name: "Aucune tâche ne correspond" })).toBeVisible();
});
