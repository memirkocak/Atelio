import { expect, test, type Locator, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { byText } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

/*
 * Module Projets — parcours complet sur un espace dédié à ce fichier (isolatedUser).
 * Exécution en série : les tests partagent un même jeu de données.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "projects", "Camille Projets");

const base = () => `/w/${me.slug}`;
const CLIENT_NAME = "Atelier Projets";

async function workspaceId(): Promise<string> {
  const { data, error } = await adminClient().from("workspaces").select("id").eq("slug", me.slug).single();
  if (error) throw error;
  return data.id;
}

/** Glisser-déposer à la souris (dnd-kit : déplacement progressif au-delà du seuil d'activation). */
async function dragTo(page: Page, handle: Locator, target: Locator) {
  const from = (await handle.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 60, { steps: 15 });
  await page.mouse.up();
}

test.beforeAll(async () => {
  // Un client pour lier les projets
  await adminClient()
    .from("clients")
    .insert({ workspace_id: await workspaceId(), kind: "company", company_name: CLIENT_NAME, contact_name: "Nina Projet" });
});

test("état vide puis création d'un projet lié à un client", async ({ page }) => {
  await page.goto(`${base()}/projets`);
  await expect(page.getByRole("heading", { name: "Aucun projet pour l’instant" })).toBeVisible();

  await page.getByRole("button", { name: "Créer votre premier projet" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau projet" });
  await sheet.getByLabel("Nom du projet").fill("Refonte du site");
  await sheet.getByRole("combobox", { name: "Client" }).click();
  await page.getByRole("option", { name: CLIENT_NAME }).click();
  await sheet.getByLabel("Échéance").fill("2020-01-15"); // passée → en retard
  await sheet.getByLabel("Budget (HT)").fill("2 400,50");
  await sheet.getByRole("button", { name: "Créer le projet" }).click();

  await expect(sheet).toBeHidden();
  await expect(byText(page, "Projet créé")).toBeVisible();
  const row = page.getByRole("row", { name: /Refonte du site/ });
  await expect(row).toContainText(CLIENT_NAME);
  await expect(row).toContainText("À venir");
  await expect(row).toContainText("en retard");
  await expect(row).toContainText("2 400,50");
});

test("validation : échéance avant le début et budget invalide", async ({ page }) => {
  await page.goto(`${base()}/projets`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau projet" });
  await sheet.getByLabel("Nom du projet").fill("Projet invalide");
  await sheet.getByLabel("Date de début").fill("2026-12-10");
  await sheet.getByLabel("Échéance").fill("2026-12-01");
  await sheet.getByLabel("Budget (HT)").fill("12,345");
  await sheet.getByRole("button", { name: "Créer le projet" }).click();

  await expect(sheet.getByText("L’échéance ne peut pas précéder la date de début.")).toBeVisible();
  await expect(sheet.getByText("Montant invalide (ex. 1 500,50).")).toBeVisible();
  await sheet.getByRole("button", { name: "Annuler" }).click();
});

test("Kanban : glisser une carte change le statut (et le menu de carte aussi)", async ({ page }) => {
  // Deuxième projet, sans client
  await page.goto(`${base()}/projets`);
  await page.getByRole("button", { name: "Nouveau projet" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau projet" });
  await sheet.getByLabel("Nom du projet").fill("Identité visuelle");
  await sheet.getByRole("button", { name: "Créer le projet" }).click();
  await expect(sheet).toBeHidden();

  await page.getByRole("radio", { name: "Kanban" }).click();
  await expect(page).toHaveURL(/view=kanban/);

  const upcoming = page.getByRole("region", { name: "Colonne À venir" });
  const inProgress = page.getByRole("region", { name: "Colonne En cours" });
  await expect(upcoming.getByRole("link", { name: "Refonte du site" })).toBeVisible();

  await dragTo(page, page.getByRole("button", { name: "Déplacer « Refonte du site »" }), inProgress);
  await expect(inProgress.getByRole("link", { name: "Refonte du site" })).toBeVisible();

  // Le changement est bien enregistré côté serveur
  await page.reload();
  await expect(page.getByRole("region", { name: "Colonne En cours" }).getByRole("link", { name: "Refonte du site" })).toBeVisible();

  // Alternative accessible : menu « Changer le statut »
  await page.getByRole("button", { name: "Changer le statut de « Identité visuelle »" }).click();
  await page.getByRole("menuitemradio", { name: "En attente" }).click();
  const onHold = () =>
    page.getByRole("region", { name: "Colonne En attente" }).getByRole("link", { name: "Identité visuelle" });
  await expect(onHold()).toBeVisible();
  await page.waitForLoadState("networkidle"); // l'action serveur doit aboutir avant le rechargement
  await page.reload();
  await expect(onHold()).toBeVisible();
});

test("filtres : statut et client (vue tableau)", async ({ page }) => {
  await page.goto(`${base()}/projets`);
  await page.getByRole("combobox", { name: "Filtrer par statut" }).click();
  await page.getByRole("option", { name: "En attente" }).click();
  await expect(page).toHaveURL(/status=on_hold/);
  await expect(page.getByRole("link", { name: "Identité visuelle" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Refonte du site" })).toHaveCount(0);

  await page.goto(`${base()}/projets`);
  await page.getByRole("combobox", { name: "Filtrer par client" }).click();
  await page.getByRole("option", { name: CLIENT_NAME }).click();
  await expect(page.getByRole("link", { name: "Refonte du site" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Identité visuelle" })).toHaveCount(0);
});

test("fiche projet : modification, terminé, historique et lien client", async ({ page }) => {
  await page.goto(`${base()}/projets`);
  await page.getByRole("link", { name: "Refonte du site" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Refonte du site" })).toBeVisible();
  await expect(byText(page, "En cours")).toBeVisible();

  await page.getByRole("button", { name: "Modifier" }).click();
  const sheet = page.getByRole("dialog", { name: "Modifier le projet" });
  await expect(sheet.getByLabel("Budget (HT)")).toHaveValue("2400,5");
  await sheet.getByRole("combobox", { name: "Statut" }).click();
  await page.getByRole("option", { name: "Terminé" }).click();
  await sheet.getByRole("button", { name: "Enregistrer" }).click();
  await expect(sheet).toBeHidden();

  await expect(byText(page, "Modifications enregistrées")).toBeVisible();
  await expect(byText(page, "Terminé le")).toBeVisible();
  await expect(byText(page, "en retard")).toHaveCount(0); // un projet terminé n'est plus en retard
  // Historique : passage à « Terminé » (statut + date de fin automatique), après le glisser-déposer
  await expect(byText(page, "Champs : date de fin, statut")).toBeVisible();
  await expect(byText(page, "Champ : statut")).toBeVisible();

  await page.getByRole("link", { name: CLIENT_NAME }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: CLIENT_NAME })).toBeVisible();
  await expect(page.getByRole("link", { name: /Refonte du site/ })).toBeVisible();
});

test("supprimer un client détache ses projets", async ({ page }) => {
  await page.goto(`${base()}/clients`);
  await page.getByRole("link", { name: CLIENT_NAME }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer ce client ?" });
  await expect(dialog).toContainText("1 projet est rattaché à ce client");
  await dialog.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(`${base()}/clients`);

  await page.goto(`${base()}/projets`);
  await expect(page.getByRole("row", { name: /Refonte du site/ })).toContainText("Sans client");
});

test("suppression d'un projet depuis sa fiche", async ({ page }) => {
  await page.goto(`${base()}/projets`);
  await page.getByRole("link", { name: "Identité visuelle" }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("alertdialog", { name: "Supprimer ce projet ?" }).getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(`${base()}/projets`);
  await expect(byText(page, "« Identité visuelle » a été supprimé")).toBeVisible();
  await expect(page.getByRole("link", { name: "Identité visuelle" })).toHaveCount(0);
});

test("affichage mobile (cartes) et projet d'un autre espace introuvable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base()}/projets`);
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByRole("link", { name: /Refonte du site/ })).toBeVisible();

  const other = await createTestUser("Autre Projet");
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", other.slug).single();
  const { data: p } = await adminClient()
    .from("projects")
    .insert({ workspace_id: ws!.id, name: "Projet confidentiel" })
    .select("id")
    .single();
  await page.goto(`${base()}/projets/${p!.id}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(byText(page, "Projet confidentiel")).toHaveCount(0);
});
