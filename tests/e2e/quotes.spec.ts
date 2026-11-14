import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { byText } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

/*
 * Module Devis — parcours complet sur un espace dédié (isolatedUser), en série.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "quotes", "Camille Devis");

const base = () => `/w/${me.slug}`;
const CLIENT = "Atelier Lumière";
const YEAR = new Date().getFullYear();
let workspaceId = "";
let clientId = "";
let quoteUrl = "";

async function pickOption(page: Page, comboboxName: string, option: string) {
  await page.getByRole("combobox", { name: comboboxName }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.beforeAll(async () => {
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", me.slug).single();
  workspaceId = ws!.id;
  const { data: c } = await adminClient()
    .from("clients")
    .insert({ workspace_id: workspaceId, kind: "company", company_name: CLIENT, contact_name: "Inès Morel", city: "Lyon" })
    .select("id")
    .single();
  clientId = c!.id;
});

test("paramètres : informations de l'entreprise (validation du SIRET)", async ({ page }) => {
  await page.goto(`${base()}/parametres`);
  await page.getByLabel("Raison sociale ou nom commercial").fill("Studio Camille");
  await page.getByLabel("Ville").fill("Nantes");
  await page.getByLabel("SIRET").fill("123");
  await page.getByRole("button", { name: /Enregistrer/ }).click();
  await expect(byText(page, "Le SIRET comporte 14 chiffres.")).toBeVisible();

  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: /Enregistrer/ }).click();
  await expect(byText(page, "Paramètres enregistrés")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("SIRET")).toHaveValue("12345678900012");
});

test("création d'un devis : totaux calculés en direct puis par le serveur", async ({ page }) => {
  await page.goto(`${base()}/devis`);
  await expect(page.getByRole("heading", { name: "Aucun devis pour l’instant" })).toBeVisible();
  await page.getByRole("link", { name: "Créer votre premier devis" }).click();
  await expect(page).toHaveURL(`${base()}/devis/nouveau`);

  await pickOption(page, "Client", CLIENT);
  await page.getByLabel("Objet du devis").fill("Refonte du site vitrine");

  await page.getByLabel("Désignation de la ligne 1").fill("Conception graphique");
  await page.getByLabel("Quantité de la ligne 1").fill("2");
  await page.getByLabel("Unité de la ligne 1").fill("jour");
  await page.getByLabel("Prix unitaire HT de la ligne 1").fill("450");

  await page.getByRole("button", { name: "Ajouter une ligne" }).click();
  await page.getByLabel("Désignation de la ligne 2").fill("Rédaction");
  await page.getByLabel("Quantité de la ligne 2").fill("1,5");
  await page.getByLabel("Prix unitaire HT de la ligne 2").fill("333,33");
  await pickOption(page, "TVA de la ligne 2", "10 %");

  // Aperçu : 2 × 450 = 900 ; 1,5 × 333,33 = 499,995 → 500,00 (arrondi au centime)
  await expect(page.getByTestId("line-total-1")).toContainText("900,00 €");
  await expect(page.getByTestId("line-total-2")).toContainText("500,00 €");
  await expect(page.getByTestId("total-ht")).toHaveText("1 400,00 €");
  await expect(page.getByTestId("total-ttc")).toHaveText("1 630,00 €");

  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL(new RegExp(`${base()}/devis/[0-9a-f-]{36}$`));
  quoteUrl = new URL(page.url()).pathname;

  await expect(page.getByRole("heading", { level: 1, name: `DEV-${YEAR}-0001` })).toBeVisible();
  const doc = page.getByRole("article", { name: `Aperçu du devis DEV-${YEAR}-0001` });
  await expect(doc).toContainText("Studio Camille");
  await expect(doc).toContainText("SIRET 12345678900012");
  await expect(doc).toContainText(CLIENT);
  await expect(doc).toContainText("TVA 20 % (base 900,00 €)180,00 €");
  await expect(doc).toContainText("TVA 10 % (base 500,00 €)50,00 €");
  await expect(doc).toContainText("Total TTC1 630,00 €");
});

test("modification du brouillon et validation de l'éditeur", async ({ page }) => {
  await page.goto(quoteUrl);
  await page.getByRole("link", { name: "Modifier" }).click();
  await expect(page).toHaveURL(`${quoteUrl}/modifier`);
  // Première ouverture de l'éditeur : compilation à froid en développement
  await expect(page.getByLabel("Quantité de la ligne 2")).toHaveValue("1,5", { timeout: 20_000 });

  await page.getByLabel("Quantité de la ligne 1").fill("abc");
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(byText(page, "Quantité invalide (ex. 1,5).")).toBeVisible();

  await page.getByLabel("Quantité de la ligne 1").fill("3");
  await expect(page.getByTestId("total-ttc")).toHaveText("2 170,00 €");
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL(quoteUrl);
  await expect(page.getByRole("article")).toContainText("Total TTC2 170,00 €");
});

test("envoi : le devis est figé", async ({ page }) => {
  await page.goto(quoteUrl);
  await page.getByRole("button", { name: "Marquer comme envoyé" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmer l’envoi" }).click();
  await expect(byText(page, "Devis marqué comme envoyé")).toBeVisible();
  await expect(byText(page, /Devis figé depuis son envoi/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Supprimer" })).toHaveCount(0);

  // L'éditeur n'est plus accessible : redirection vers la fiche
  await page.goto(`${quoteUrl}/modifier`);
  await expect(page).toHaveURL(quoteUrl);
});

test("téléchargement du PDF", async ({ page }) => {
  await page.goto(quoteUrl);
  const response = await page.request.get(`${quoteUrl}/pdf`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toContain(`DEV-${YEAR}-0001.pdf`);
  const body = await response.body();
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
  expect(body.length).toBeGreaterThan(2000);
});

test("acceptation puis duplication en nouveau brouillon", async ({ page }) => {
  await page.goto(quoteUrl);
  await page.getByRole("button", { name: "Accepté" }).click();
  await expect(byText(page, "Devis accepté")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accepté" })).toHaveCount(0);

  await page.getByRole("button", { name: "Dupliquer" }).click();
  await expect(page).toHaveURL(/\/modifier$/);
  await expect(page.getByRole("heading", { name: `Modifier DEV-${YEAR}-0002` })).toBeVisible();
  await expect(page.getByLabel("Désignation de la ligne 1")).toHaveValue("Conception graphique");
});

test("liste : statuts, expiré calculé et filtres", async ({ page }) => {
  // Devis envoyé dont la validité est dépassée → « Expiré »
  const admin = adminClient();
  const { data: id } = await admin.rpc("save_quote", {
    p_workspace_id: workspaceId,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: clientId, title: "Ancienne proposition", issue_date: "2020-01-10", valid_until: "2020-02-10" },
    p_items: [{ label: "Audit", quantity: "1", unit_price_cents: 50000, vat_rate_bp: 2000 }],
  });
  await admin.rpc("set_quote_status", { p_workspace_id: workspaceId, p_quote_id: id!, p_status: "sent" });

  await page.goto(`${base()}/devis`);
  await expect(page.getByRole("row", { name: /DEV-2020-0001/ })).toContainText("Expiré");
  await expect(page.getByRole("row", { name: new RegExp(`DEV-${YEAR}-0001`) })).toContainText("Accepté");
  await expect(page.getByRole("row", { name: new RegExp(`DEV-${YEAR}-0002`) })).toContainText("Brouillon");

  await pickOption(page, "Filtrer par statut", "Expiré");
  await expect(page).toHaveURL(/status=expired/);
  await expect(page.getByRole("row", { name: /DEV-2020-0001/ })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(`DEV-${YEAR}-0001`) })).toHaveCount(0);
});

test("un client ayant des devis ne peut pas être supprimé ; sa fiche liste ses devis", async ({ page }) => {
  await page.goto(`${base()}/clients/${clientId}`);
  await expect(page.getByRole("link", { name: new RegExp(`DEV-${YEAR}-0001`) })).toBeVisible();

  await page.getByRole("button", { name: "Supprimer" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Supprimer ce client ?" });
  await expect(dialog).toContainText("la suppression sera refusée");
  await dialog.getByRole("button", { name: "Supprimer" }).click();
  await expect(byText(page, /des devis y sont rattachés/)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: CLIENT })).toBeVisible();
});

test("suppression d'un brouillon", async ({ page }) => {
  await page.goto(`${base()}/devis`);
  await page.getByRole("link", { name: `DEV-${YEAR}-0002` }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(`${base()}/devis`);
  await expect(page.getByRole("link", { name: `DEV-${YEAR}-0002` })).toHaveCount(0);
});

test("mobile, et devis d'un autre espace inaccessible (page et PDF)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base()}/devis`);
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByRole("link", { name: new RegExp(`DEV-${YEAR}-0001`) })).toBeVisible();

  const other = await createTestUser("Autre Devis");
  const admin = adminClient();
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", other.slug).single();
  const { data: c } = await admin
    .from("clients")
    .insert({ workspace_id: ws!.id, kind: "individual", contact_name: "Client secret" })
    .select("id")
    .single();
  const { data: foreignId } = await admin.rpc("save_quote", {
    p_workspace_id: ws!.id,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: c!.id, title: "Devis confidentiel" },
    p_items: [{ label: "Secret", quantity: "1", unit_price_cents: 100, vat_rate_bp: 2000 }],
  });

  await page.goto(`${base()}/devis/${foreignId}`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  const pdf = await page.request.get(`${base()}/devis/${foreignId}/pdf`);
  expect(pdf.status()).toBe(404);
});
