import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { byText } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

/*
 * Module Clients — parcours complet sur un espace dédié à ce fichier (isolatedUser).
 * Exécution en série : les tests construisent un même jeu de données.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "clients", "Camille Clients");

const list = () => `/w/${me.slug}/clients`;

async function openNewClientSheet(page: Page, buttonName = "Ajouter un client") {
  await page.getByRole("button", { name: buttonName }).first().click();
  const sheet = page.getByRole("dialog", { name: "Nouveau client" });
  await expect(sheet).toBeVisible();
  return sheet;
}

test("état vide puis création d'une entreprise", async ({ page }) => {
  await page.goto(list());
  await expect(page.getByRole("heading", { name: "Aucun client pour l’instant" })).toBeVisible();

  const sheet = await openNewClientSheet(page, "Ajouter votre premier client");
  await sheet.getByLabel("Entreprise").fill("Studio Écume");
  await sheet.getByLabel("Nom du contact").fill("Élodie Lefèvre");
  await sheet.getByLabel("E-mail").fill("elodie@ecume.fr");
  await sheet.getByPlaceholder("Ville").fill("Nîmes");
  await sheet.getByRole("button", { name: "Ajouter le client" }).click();

  await expect(sheet).toBeHidden();
  await expect(byText(page, "Client ajouté")).toBeVisible();
  await expect(page.getByRole("link", { name: "Studio Écume" })).toBeVisible();
});

test("le formulaire valide les champs", async ({ page }) => {
  await page.goto(list());
  const sheet = await openNewClientSheet(page);
  await sheet.getByLabel("E-mail").fill("pas-un-email");
  await sheet.getByRole("button", { name: "Ajouter le client" }).click();

  await expect(sheet.getByText("Saisissez le nom de l’entreprise.")).toBeVisible();
  await expect(sheet.getByText("Saisissez le nom du contact.")).toBeVisible();
  await expect(sheet.getByText("Adresse e-mail invalide.")).toBeVisible();

  // Particulier : le champ Entreprise disparaît
  await sheet.getByRole("radio", { name: "Particulier" }).click();
  await expect(sheet.getByLabel("Entreprise")).toHaveCount(0);
  await expect(sheet.getByLabel("Nom complet")).toBeVisible();
});

test("création d'un particulier", async ({ page }) => {
  await page.goto(list());
  const sheet = await openNewClientSheet(page);
  await sheet.getByRole("radio", { name: "Particulier" }).click();
  await sheet.getByLabel("Nom complet").fill("Jean Dupont");
  await sheet.getByLabel("Téléphone").fill("06 12 34 56 78");
  await sheet.getByPlaceholder("Ville").fill("Paris");
  await sheet.getByRole("button", { name: "Ajouter le client" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByRole("link", { name: "Jean Dupont" })).toBeVisible();
  await expect(byText(page, "2 clients")).toBeVisible();
});

test("recherche insensible aux accents, filtre par type et réinitialisation", async ({ page }) => {
  await page.goto(list());

  await page.getByRole("searchbox", { name: "Rechercher un client" }).fill("ecume");
  await expect(page).toHaveURL(/\?q=ecume/);
  await expect(page.getByRole("link", { name: "Studio Écume" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jean Dupont" })).toHaveCount(0);

  await page.getByRole("searchbox", { name: "Rechercher un client" }).fill("introuvable");
  await expect(page.getByRole("heading", { name: "Aucun client ne correspond" })).toBeVisible();
  await page.getByRole("link", { name: "Réinitialiser les filtres" }).click();
  await expect(page).toHaveURL(list());

  await page.getByRole("combobox", { name: "Filtrer par type" }).click();
  await page.getByRole("option", { name: "Particulier" }).click();
  await expect(page).toHaveURL(/type=individual/);
  await expect(page.getByRole("link", { name: "Jean Dupont" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Studio Écume" })).toHaveCount(0);
});

test("fiche client : coordonnées, modification et historique", async ({ page }) => {
  await page.goto(list());
  await page.getByRole("link", { name: "Studio Écume" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Studio Écume" })).toBeVisible();
  await expect(page.getByRole("link", { name: "elodie@ecume.fr" })).toHaveAttribute("href", "mailto:elodie@ecume.fr");
  await expect(byText(page, "Fiche créée")).toBeVisible();

  await page.getByRole("button", { name: "Modifier" }).click();
  const sheet = page.getByRole("dialog", { name: "Modifier le client" });
  await expect(sheet.getByLabel("Entreprise")).toHaveValue("Studio Écume");
  await sheet.getByLabel("Téléphone").fill("04 66 00 00 00");
  await sheet.getByRole("button", { name: "Enregistrer" }).click();

  await expect(sheet).toBeHidden();
  await expect(byText(page, "Modifications enregistrées")).toBeVisible();
  await expect(page.getByRole("link", { name: "04 66 00 00 00" })).toBeVisible();
  await expect(byText(page, "Champ : téléphone")).toBeVisible();
});

test("suppression depuis la fiche, avec confirmation", async ({ page }) => {
  await page.goto(list());
  await page.getByRole("link", { name: "Jean Dupont" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Jean Dupont" })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer ce client ?" });
  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Jean Dupont" })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer" }).click();
  await dialog.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(list());
  await expect(byText(page, "« Jean Dupont » a été supprimé")).toBeVisible();
  await expect(page.getByRole("link", { name: "Jean Dupont" })).toHaveCount(0);
});

test("affichage mobile en cartes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(list());
  await expect(page.getByRole("table")).toBeHidden();
  await page.getByRole("link", { name: /Studio Écume/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Studio Écume" })).toBeVisible();
});

test("le client d'un autre espace est introuvable (404)", async ({ page }) => {
  const other = await createTestUser("Autre Test");
  const { data, error } = await adminClient()
    .from("workspaces")
    .select("id")
    .eq("slug", other.slug)
    .single();
  if (error) throw error;
  const { data: client } = await adminClient()
    .from("clients")
    .insert({ workspace_id: data.id, kind: "individual", contact_name: "Client Confidentiel" })
    .select("id")
    .single();

  await page.goto(`${list()}/${client!.id}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(byText(page, "Client Confidentiel")).toHaveCount(0);

  await page.goto(`${list()}/pas-un-identifiant`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
