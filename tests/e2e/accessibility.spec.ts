import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";

/*
 * Accessibilité (WCAG 2.1 A / AA) des pages principales, contrôlée par axe-core.
 * Les pages sont remplies avec un petit jeu de données pour analyser les vrais composants.
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "a11y", "Alix Accessible");

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
let quoteId = "";
let clientId = "";
let projectId = "";

async function expectNoViolations(page: Page) {
  // Uniquement la page visible (Next conserve les pages visitées, masquées, dans le DOM)
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}) : ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

test.beforeAll(async () => {
  const admin = adminClient();
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", me.slug).single();
  const w = ws!.id;
  const { data: client } = await admin
    .from("clients")
    .insert({ workspace_id: w, kind: "company", company_name: "Maison Opale", contact_name: "Léa Martin" })
    .select("id")
    .single();
  clientId = client!.id;
  const { data: project } = await admin
    .from("projects")
    .insert({ workspace_id: w, name: "Refonte du site", status: "in_progress", client_id: clientId })
    .select("id")
    .single();
  projectId = project!.id;
  await admin.from("tasks").insert({ workspace_id: w, title: "Envoyer la maquette", project_id: projectId });
  const { data: q } = await admin.rpc("save_quote", {
    p_workspace_id: w,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: clientId, title: "Identité visuelle" },
    p_items: [{ label: "Logo", quantity: "1", unit_price_cents: 50000, vat_rate_bp: 2000 }],
  });
  quoteId = q!;
  await admin.rpc("set_quote_status", { p_workspace_id: w, p_quote_id: quoteId, p_status: "sent" });
  await admin.rpc("set_quote_status", { p_workspace_id: w, p_quote_id: quoteId, p_status: "accepted" });
  const now = new Date();
  await admin.from("events").insert({
    workspace_id: w,
    title: "Point client",
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 3600_000).toISOString(),
  });
});

const pages: [string, () => string, string][] = [
  ["tableau de bord", () => "tableau-de-bord", "Tableau de bord"],
  ["clients", () => "clients", "Clients"],
  ["fiche client", () => `clients/${clientId}`, "Maison Opale"],
  ["projets", () => "projets", "Projets"],
  ["projets (Kanban)", () => "projets?view=kanban", "Projets"],
  ["fiche projet", () => `projets/${projectId}`, "Refonte du site"],
  ["tâches", () => "taches", "Tâches"],
  ["devis", () => "devis", "Devis"],
  ["fiche devis", () => `devis/${quoteId}`, "DEV-"],
  ["nouveau devis", () => "devis/nouveau", "Nouveau devis"],
  ["calendrier (mois)", () => "calendrier", "Calendrier"],
  ["calendrier (semaine)", () => "calendrier?view=week", "Calendrier"],
  ["statistiques", () => "statistiques", "Statistiques"],
  ["paramètres", () => "parametres", "Paramètres"],
  ["mon compte", () => "compte", "Mon compte"],
];

for (const [name, path, heading] of pages) {
  test(`page ${name}`, async ({ page }) => {
    await page.goto(`/w/${me.slug}/${path()}`);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(heading) })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expectNoViolations(page);
  });
}

test.describe("pages publiques", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of ["/", "/connexion", "/inscription", "/mot-de-passe-oublie"]) {
    test(`page ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    });
  }
});
