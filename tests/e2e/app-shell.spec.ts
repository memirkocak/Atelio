import { expect, test } from "@playwright/test";

import { AUTH_STATE_FILE, testWorkspaceSlug } from "./helpers/auth-state";

// La coquille applicative est réservée aux utilisateurs connectés.
test.use({ storageState: AUTH_STATE_FILE });

const W = () => `/w/${testWorkspaceSlug()}`;

const modules = [
  { title: "Tableau de bord", path: "tableau-de-bord" },
  { title: "Clients", path: "clients" },
  { title: "Projets", path: "projets" },
  { title: "Tâches", path: "taches" },
  { title: "Devis", path: "devis" },
  { title: "Calendrier", path: "calendrier" },
  { title: "Statistiques", path: "statistiques" },
  { title: "Paramètres", path: "parametres" },
];

test.describe("ordinateur", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/w/<espace> redirige vers le tableau de bord", async ({ page }) => {
    await page.goto(W());
    await expect(page).toHaveURL(`${W()}/tableau-de-bord`);
    await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  });

  test("la sidebar mène à chaque module et marque la page active", async ({ page }) => {
    await page.goto(`${W()}/tableau-de-bord`);
    const nav = page.locator('[data-sidebar="sidebar"]');

    for (const { title, path } of modules) {
      const link = nav.getByRole("link", { name: title, exact: true });
      await link.click();
      await expect(page).toHaveURL(`${W()}/${path}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page).toHaveTitle(`${title} · Atelio`);
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  test("la sidebar peut être repliée en icônes", async ({ page }) => {
    await page.goto(`${W()}/clients`);
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await page.getByRole("button", { name: "Afficher ou masquer la navigation" }).first().click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });
});

test.describe("tablette", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("la sidebar est repliée en icônes par défaut", async ({ page }) => {
    await page.goto(`${W()}/clients`);
    await expect(page.locator('[data-slot="sidebar"][data-state]')).toHaveAttribute(
      "data-state",
      "collapsed",
    );
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("le menu s'ouvre, navigue et se referme", async ({ page }) => {
    await page.goto(`${W()}/tableau-de-bord`);
    await page.getByRole("button", { name: "Afficher ou masquer la navigation" }).click();

    const menu = page.getByRole("dialog", { name: "Navigation" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Devis" }).click();

    await expect(page).toHaveURL(`${W()}/devis`);
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Devis" })).toBeVisible();
  });
});
