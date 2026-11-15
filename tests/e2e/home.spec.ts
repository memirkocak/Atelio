import { expect, test } from "@playwright/test";

test("la page d'accueil s'affiche", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Atelio/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Toute votre activité, au même endroit." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(6);
});

test("une URL inconnue affiche la page 404 en français", async ({ page }) => {
  const response = await page.goto("/cette-page-n-existe-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.getByRole("link", { name: "Retour à l’accueil" }).click();
  await expect(page).toHaveURL("/");
});

test("en-têtes de sécurité présents sur les réponses", async ({ request }) => {
  for (const path of ["/", "/connexion"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  }
});
