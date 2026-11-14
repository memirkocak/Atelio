import { expect, test, type Page } from "@playwright/test";

import { byLabel, byTestId, byText } from "./helpers/locators";
import { createTestUser, TEST_PASSWORD, uniqueTestEmail } from "./helpers/test-users";

// Ces tests partent sans session ; les comptes créés sont supprimés par global-teardown.ts.

async function signIn(page: Page, email: string, password: string) {
  await byLabel(page, "Adresse e-mail").fill(email);
  await byLabel(page, "Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

async function signOutFromMenu(page: Page) {
  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");
}

test.use({ viewport: { width: 1440, height: 900 } });

test("un visiteur non connecté est redirigé vers la connexion", async ({ page }) => {
  await page.goto("/w/un-espace/clients");
  await expect(page).toHaveURL("/connexion?next=%2Fw%2Fun-espace%2Fclients");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("inscription : arrivée dans son nouvel espace, déconnexion puis reconnexion", async ({ page }) => {
  const email = uniqueTestEmail();

  await page.goto("/inscription");
  await byLabel(page, "Nom complet").fill("Alex Martin");
  await byLabel(page, "Adresse e-mail").fill(email);
  await byLabel(page, "Mot de passe", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // Confirmation par e-mail désactivée sur le projet de dev → session immédiate (DT-019),
  // puis /demarrage redirige vers l'espace créé automatiquement (trigger SQL).
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/w\/espace-de-alex-[a-f0-9]{4}\/tableau-de-bord$/);
  const workspaceUrl = page.url();
  await expect(byTestId(page, "workspace-name")).toHaveText("Espace de Alex");
  await expect(page.getByRole("button", { name: "Menu du compte" })).toContainText(email);

  await signOutFromMenu(page);

  await signIn(page, email, TEST_PASSWORD);
  await expect(page).toHaveURL(workspaceUrl);
});

test("l'inscription valide les champs côté client", async ({ page }) => {
  await page.goto("/inscription");
  await byLabel(page, "Adresse e-mail").fill("pas-un-email");
  await byLabel(page, "Mot de passe", { exact: true }).fill("court");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(byText(page, "Saisissez votre nom (2 caractères minimum).")).toBeVisible();
  await expect(byText(page, "Adresse e-mail invalide.")).toBeVisible();
  await expect(byText(page, "Au moins 8 caractères.")).toBeVisible();
  await expect(page).toHaveURL("/inscription");
});

test("un mauvais mot de passe affiche une erreur générique", async ({ page }) => {
  const user = await createTestUser();
  await page.goto("/connexion");
  await signIn(page, user.email, "mauvais-mot-de-passe-1");

  await expect(byText(page, "E-mail ou mot de passe incorrect.")).toBeVisible();
  await expect(page).toHaveURL("/connexion");
});

test("après connexion, retour à la page demandée, menu du compte et déconnexion", async ({ page }) => {
  const user = await createTestUser("Camille Durand");
  const devis = `/w/${user.slug}/devis`;

  await page.goto(devis);
  await expect(page).toHaveURL(/\/connexion\?next=/);
  await signIn(page, user.email, user.password);

  await expect(page).toHaveURL(devis);
  await expect(page.getByRole("button", { name: "Menu du compte" })).toContainText("Camille Durand");
  await expect(byTestId(page, "workspace-name")).toHaveText("Espace de Camille");

  // Une fois connecté, /connexion renvoie vers son espace
  await page.goto("/connexion");
  await expect(page).toHaveURL(`/w/${user.slug}/tableau-de-bord`);

  await signOutFromMenu(page);
  await page.goto(devis);
  await expect(page).toHaveURL(/\/connexion\?next=/);
});

test("l'espace d'un autre utilisateur ou un espace inconnu donne une page 404", async ({ page }) => {
  const [me, other] = await Promise.all([createTestUser("Inès Test"), createTestUser("Olivier Test")]);

  await page.goto("/connexion");
  await signIn(page, me.email, me.password);
  await expect(page).toHaveURL(`/w/${me.slug}/tableau-de-bord`);

  for (const path of [`/w/${other.slug}/clients`, "/w/espace-inexistant-0000/clients"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    // Aucune information sur l'espace demandé n'est affichée
    await expect(byText(page, "Espace de Olivier")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toHaveCount(0);
  }
});

test("mot de passe oublié : validation du formulaire", async ({ page }) => {
  // L'envoi réel n'est pas testé : le SMTP gratuit de Supabase est limité à quelques e-mails par heure.
  await page.goto("/connexion");
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(page).toHaveURL("/mot-de-passe-oublie");

  await byLabel(page, "Adresse e-mail").fill("invalide");
  await page.getByRole("button", { name: "Envoyer le lien" }).click();
  await expect(byText(page, "Adresse e-mail invalide.")).toBeVisible();
});

test("un lien d'e-mail invalide renvoie vers la connexion avec un message", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=faux&type=recovery&next=/reinitialiser-mot-de-passe");
  await expect(page).toHaveURL("/connexion?erreur=lien-invalide");
  await expect(byText(page, /Ce lien est invalide ou a expiré/)).toBeVisible();
});
