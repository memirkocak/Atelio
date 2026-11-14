import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { byLabel, byText } from "./helpers/locators";
import { createTestUser, TEST_PASSWORD } from "./helpers/test-users";

/*
 * Mon compte : profil, mot de passe, suppression. Chaque test a son propre compte
 * (les opérations modifient ou suppriment l'utilisateur) et part sans session.
 */
test.use({ viewport: { width: 1440, height: 900 }, storageState: { cookies: [], origins: [] } });

const NEW_PASSWORD = "Nouveau-mdp-2027";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
  await byLabel(page, "Adresse e-mail").fill(email);
  await byLabel(page, "Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

async function openAccount(page: Page) {
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Mon compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
}

test("profil : changement du nom affiché, visible dans le menu après rechargement", async ({ page }) => {
  const user = await createTestUser("Camille Profil");
  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
  await openAccount(page);
  await expect(page).toHaveURL(`/w/${user.slug}/compte`);
  await expect(page.getByRole("navigation", { name: "Fil d’Ariane" })).toContainText("Mon compte");

  await byLabel(page, "Nom affiché").fill("C");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(byText(page, "Saisissez votre nom (2 caractères minimum).")).toBeVisible();

  await byLabel(page, "Nom affiché").fill("Camille Martin");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(byText(page, "Profil mis à jour")).toBeVisible();

  await page.reload();
  await expect(byLabel(page, "Nom affiché")).toHaveValue("Camille Martin");
  await expect(page.getByRole("button", { name: "Menu du compte" })).toContainText("Camille Martin");
  const { data } = await adminClient().from("profiles").select("full_name").eq("id", user.id).single();
  expect(data?.full_name).toBe("Camille Martin");
});

test("mot de passe : mauvais mot de passe actuel refusé, puis changement et reconnexion", async ({ page }) => {
  const user = await createTestUser("Paul Secret");
  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
  await page.goto(`/w/${user.slug}/compte`);

  await byLabel(page, "Mot de passe actuel").fill("Mauvais-2026");
  await byLabel(page, "Nouveau mot de passe", { exact: true }).fill(NEW_PASSWORD);
  await byLabel(page, "Confirmer le nouveau mot de passe").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(byText(page, "Mot de passe incorrect.").first()).toBeVisible();

  await byLabel(page, "Mot de passe actuel").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Modifier le mot de passe" }).click();
  await expect(byText(page, "Mot de passe modifié")).toBeVisible();
  await expect(byLabel(page, "Mot de passe actuel")).toHaveValue("");

  // La session en cours reste valide
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();

  // Déconnexion, puis l'ancien mot de passe est refusé et le nouveau accepté
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");
  await signIn(page, user.email, TEST_PASSWORD);
  await expect(byText(page, "E-mail ou mot de passe incorrect.")).toBeVisible();
  await signIn(page, user.email, NEW_PASSWORD);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
});

test("suppression du compte : confirmation par mot de passe, données supprimées, connexion impossible", async ({ page }) => {
  const user = await createTestUser("Zoé Départ");
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", user.slug).single();
  await adminClient().from("clients").insert({ workspace_id: ws!.id, kind: "individual", contact_name: "Client à effacer" });

  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
  await page.goto(`/w/${user.slug}/compte`);
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer définitivement votre compte ?" });
  await expect(dialog).toContainText("Espace de Zoé");

  await dialog.getByLabel("Saisissez votre mot de passe pour confirmer").fill("Mauvais-2026");
  await dialog.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(dialog.getByText("Mot de passe incorrect.").first()).toBeVisible();

  await dialog.getByLabel("Saisissez votre mot de passe pour confirmer").fill(user.password);
  await dialog.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL("/connexion?info=compte-supprime");
  await expect(byText(page, "Votre compte et ses données ont été supprimés.")).toBeVisible();

  const { count } = await adminClient().from("clients").select("*", { count: "exact", head: true }).eq("workspace_id", ws!.id);
  expect(count).toBe(0);
  await page.goto(`/w/${user.slug}/tableau-de-bord`);
  await expect(page).toHaveURL(/\/connexion/);

  await signIn(page, user.email, user.password);
  await expect(byText(page, "E-mail ou mot de passe incorrect.")).toBeVisible();
});

test("lien d'évitement : premier élément focalisable, mène au contenu", async ({ page }) => {
  const user = await createTestUser("Kim Clavier");
  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
  // Chargement complet : le focus part du début du document
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main[data-slot='sidebar-inset']")).toBeFocused();
});

test("mobile : cartes du tableau de bord sur deux colonnes", async ({ page }) => {
  const user = await createTestUser("Léo Mobile");
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, user.email, user.password);
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);
  const first = await page.getByRole("article", { name: "Clients" }).boundingBox();
  const second = await page.getByRole("article", { name: "Projets en cours" }).boundingBox();
  expect(Math.round(first!.y)).toBe(Math.round(second!.y)); // même ligne
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
