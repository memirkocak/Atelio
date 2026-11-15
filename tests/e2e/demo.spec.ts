import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { byTestId, byText } from "./helpers/locators";

/*
 * Mode démo : « Essayer la démo » ouvre une session anonyme avec un espace privé rempli.
 * Les espaces créés ici sont supprimés à la fin (avec leurs comptes anonymes).
 */
test.use({ viewport: { width: 1440, height: 900 }, storageState: { cookies: [], origins: [] } });

const createdSlugs: string[] = [];

async function startFromHome(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Essayer la démo" }).click();
  await expect(page).toHaveURL(/\/w\/studio-lumen-[a-f0-9]{4}\/tableau-de-bord$/, { timeout: 20_000 });
  const slug = new URL(page.url()).pathname.split("/")[2]!;
  createdSlugs.push(slug);
  return slug;
}

test.afterAll(async () => {
  const admin = adminClient();
  for (const slug of createdSlugs) {
    const { data } = await admin.from("workspaces").select("id, created_by").eq("slug", slug).maybeSingle();
    if (!data) continue;
    await admin.from("workspaces").delete().eq("id", data.id);
    if (data.created_by) await admin.auth.admin.deleteUser(data.created_by);
  }
});

test("« Essayer la démo » : espace privé rempli, bandeau et nom de l'espace", async ({ page }) => {
  await startFromHome(page);
  await expect(page.getByRole("note", { name: "Mode démo" })).toContainText("données fictives");
  await expect(byTestId(page, "workspace-name")).toHaveText("Studio Lumen (démo)");
  await expect(page.getByRole("article", { name: "Clients" }).getByTestId("kpi-value")).toHaveText("8");
  await expect(page.getByRole("link", { name: /dont \d+ en retard/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu du compte" })).toContainText("Session de démonstration");

  // Les autres modules sont remplis
  await page.goto(page.url().replace("tableau-de-bord", "devis"));
  await expect(page.getByRole("heading", { level: 1, name: "Devis" })).toBeVisible();
  await expect(byText(page, "Refonte du site e-commerce").first()).toBeVisible();
  // Le bandeau reste affiché sur toutes les pages de l'espace
  await expect(page.getByRole("note", { name: "Mode démo" })).toBeVisible();
});

test("mode démo : pas de mot de passe ni de suppression de compte", async ({ page }) => {
  const slug = await startFromHome(page);
  await page.goto(`/w/${slug}/compte`);
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
  await expect(byText(page, /compte de démonstration temporaire/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Supprimer mon compte" })).toHaveCount(0);
  await expect(page.getByLabel("Mot de passe actuel")).toHaveCount(0);
});

test("« Créer un compte » (bandeau) ferme la session de démo et mène à l'inscription", async ({ page }) => {
  const slug = await startFromHome(page);
  await page.getByRole("note", { name: "Mode démo" }).getByRole("button", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL("/inscription");
  await page.goto(`/w/${slug}/tableau-de-bord`);
  await expect(page).toHaveURL(/\/connexion\?next=/);
});

test("la démo est aussi proposée sur la page de connexion", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: "Essayer la démo" }).click();
  await expect(page).toHaveURL(/\/w\/studio-lumen-[a-f0-9]{4}\/tableau-de-bord$/, { timeout: 20_000 });
  createdSlugs.push(new URL(page.url()).pathname.split("/")[2]!);
});

test("mobile : bandeau lisible, pas de défilement horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await startFromHome(page);
  await expect(page.getByRole("note", { name: "Mode démo" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // Bandeau permanent : toujours visible sous la barre du haut après défilement
  await page.mouse.wheel(0, 1500);
  await expect
    .poll(async () => (await page.getByRole("note", { name: "Mode démo" }).boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(50);
});

test("accessibilité de l’espace de démonstration (bandeau compris)", async ({ page }) => {
  await startFromHome(page);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

test.describe("tâche quotidienne /api/cron", () => {
  test("refuse une requête sans secret ou avec un mauvais secret", async ({ request }) => {
    expect((await request.get("/api/cron")).status()).toBe(401);
    const wrong = await request.get("/api/cron", { headers: { authorization: `Bearer ${"x".repeat(64)}` } });
    expect(wrong.status()).toBe(401);
  });

  test("avec le secret : purge et réponse 200", async ({ request }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET absent de .env.local");
    const response = await request.get("/api/cron", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, purgedDemoAccounts: expect.any(Number) });
  });
});
