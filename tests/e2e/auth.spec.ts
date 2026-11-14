import { expect, test, type Page } from "@playwright/test";

import { createTestUser, TEST_PASSWORD, uniqueTestEmail } from "./helpers/test-users";

// Ces tests partent sans session ; les comptes créés sont supprimés par global-teardown.ts.

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("un visiteur non connecté est redirigé vers la connexion", async ({ page }) => {
  await page.goto("/w/test/clients");
  await expect(page).toHaveURL("/connexion?next=%2Fw%2Ftest%2Fclients");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("inscription, déconnexion puis reconnexion", async ({ page }) => {
  const email = uniqueTestEmail();

  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Alex Martin");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // atelio-dev : confirmation par e-mail désactivée → session immédiate (DT-019)
  await expect(page).toHaveURL("/demarrage");
  await expect(page.getByRole("heading", { name: "Bienvenue, Alex !" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");

  await signIn(page, email, TEST_PASSWORD);
  await expect(page).toHaveURL("/demarrage");
});

test("l'inscription valide les champs côté client", async ({ page }) => {
  await page.goto("/inscription");
  await page.getByLabel("Adresse e-mail").fill("pas-un-email");
  await page.getByLabel("Mot de passe", { exact: true }).fill("court");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page.getByText("Saisissez votre nom (2 caractères minimum).")).toBeVisible();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();
  await expect(page.getByText("Au moins 8 caractères.")).toBeVisible();
  await expect(page).toHaveURL("/inscription");
});

test("un mauvais mot de passe affiche une erreur générique", async ({ page }) => {
  const user = await createTestUser();
  await page.goto("/connexion");
  await signIn(page, user.email, "mauvais-mot-de-passe-1");

  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
  await expect(page).toHaveURL("/connexion");
});

test("après connexion, retour à la page demandée, menu du compte et déconnexion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const user = await createTestUser("Camille Durand");

  await page.goto("/w/test/devis");
  await expect(page).toHaveURL(/\/connexion\?next=/);
  await signIn(page, user.email, user.password);

  await expect(page).toHaveURL("/w/test/devis");
  const accountButton = page.getByRole("button", { name: "Menu du compte" });
  await expect(accountButton).toContainText("Camille Durand");

  // Une fois connecté, /connexion renvoie vers l'application
  await page.goto("/connexion");
  await expect(page).toHaveURL("/demarrage");

  await page.goto("/w/test/devis");
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");

  await page.goto("/w/test/devis");
  await expect(page).toHaveURL(/\/connexion\?next=/);
});

test("mot de passe oublié : validation du formulaire", async ({ page }) => {
  // L'envoi réel n'est pas testé : le SMTP gratuit de Supabase est limité à quelques e-mails par heure.
  await page.goto("/connexion");
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(page).toHaveURL("/mot-de-passe-oublie");

  await page.getByLabel("Adresse e-mail").fill("invalide");
  await page.getByRole("button", { name: "Envoyer le lien" }).click();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();
});

test("un lien d'e-mail invalide renvoie vers la connexion avec un message", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=faux&type=recovery&next=/reinitialiser-mot-de-passe");
  await expect(page).toHaveURL("/connexion?erreur=lien-invalide");
  await expect(page.getByText(/Ce lien est invalide ou a expiré/)).toBeVisible();
});
