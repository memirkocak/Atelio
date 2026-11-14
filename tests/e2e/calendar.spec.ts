import { expect, test, type Page } from "@playwright/test";

import { formatDay } from "@/features/calendar/grid";
import { parisToUtcIso, todayIso } from "@/lib/dates";

import { adminClient } from "../support/supabase-test";

import { isolatedUser } from "./helpers/isolated-user";
import { byText } from "./helpers/locators";
import { createTestUser } from "./helpers/test-users";

/*
 * Calendrier — rendez-vous et dates des autres modules, sur un espace dédié, en série.
 * Les scénarios déterministes utilisent des mois fixes (mars et avril 2027).
 */
test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: "serial" });
const me = isolatedUser(test, "calendar", "Clara Agenda");

const url = (query = "") => `/w/${me.slug}/calendrier${query}`;
const sheet = (page: Page, name: "Nouveau rendez-vous" | "Modifier le rendez-vous") =>
  page.getByRole("dialog", { name });
const day = (page: Page, label: string) => page.getByRole("group", { name: label });
let workspaceId = "";

async function fillTimes(page: Page, dialog: ReturnType<typeof sheet>, start: string, end: string) {
  await dialog.getByLabel("Heure de début").fill(start);
  await dialog.getByLabel("Heure de fin").fill(end);
}

test.beforeAll(async () => {
  const { data } = await adminClient().from("workspaces").select("id").eq("slug", me.slug).single();
  workspaceId = data!.id;
});

test("navigation : mois, semaine, précédent / suivant / aujourd'hui", async ({ page }) => {
  await page.goto(url("?date=2027-03-10"));
  await expect(page.getByRole("heading", { name: "Calendrier", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "mars 2027", level: 2 })).toBeVisible();
  await expect(day(page, "lundi 1 mars 2027")).toBeVisible();

  await page.getByRole("link", { name: "Mois suivant" }).click();
  await expect(page.getByRole("heading", { name: "avril 2027", level: 2 })).toBeVisible();

  await page.getByRole("link", { name: "Semaine", exact: true }).click();
  await expect(page).toHaveURL(url("?view=week&date=2027-04-01"));
  await expect(page.getByRole("heading", { name: "29 mars – 4 avr. 2027", level: 2 })).toBeVisible();
  await page.getByRole("link", { name: "Semaine suivante" }).click();
  await expect(page.getByRole("heading", { name: "5 – 11 avr. 2027", level: 2 })).toBeVisible();

  await page.getByRole("link", { name: "Aujourd’hui" }).click();
  await expect(page).toHaveURL(url("?view=week"));
  await expect(page.getByRole("region", { name: formatDay(todayIso(), "EEEE d MMMM yyyy") })).toContainText(
    "(aujourd’hui)",
  );
});

test("création d'un rendez-vous avec horaire (heure de Paris), vérifiée après rechargement", async ({ page }) => {
  await page.goto(url("?date=2027-03-10"));
  await day(page, "mercredi 10 mars 2027").hover();
  await page.getByRole("button", { name: "Ajouter un rendez-vous le 10 mars 2027" }).click();
  const dialog = sheet(page, "Nouveau rendez-vous");
  await expect(dialog.getByLabel("Début", { exact: true })).toHaveValue("2027-03-10");

  // Validation : fin avant le début
  await dialog.getByLabel("Titre").fill("Atelier découverte");
  await fillTimes(page, dialog, "15:00", "14:00");
  await dialog.getByRole("button", { name: "Créer le rendez-vous" }).click();
  await expect(dialog.getByText("La fin doit être après le début.")).toBeVisible();

  await fillTimes(page, dialog, "14:30", "16:00");
  await dialog.getByLabel("Lieu").fill("Studio, Lyon");
  await dialog.getByRole("button", { name: "Créer le rendez-vous" }).click();
  await expect(byText(page, "Rendez-vous créé")).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.reload();
  await expect(day(page, "mercredi 10 mars 2027").getByRole("button", { name: /14:30\s*Atelier découverte/ })).toBeVisible();

  // Enregistré en UTC à partir de l'heure de Paris (UTC+1 en mars avant le changement d'heure)
  const { data } = await adminClient()
    .from("events")
    .select("starts_at, ends_at, location")
    .eq("workspace_id", workspaceId)
    .eq("title", "Atelier découverte")
    .single();
  expect(new Date(data!.starts_at).toISOString()).toBe(parisToUtcIso("2027-03-10", "14:30"));
  expect(new Date(data!.ends_at).toISOString()).toBe("2027-03-10T15:00:00.000Z");
  expect(data!.location).toBe("Studio, Lyon");

  // Vue semaine : horaire complet
  await page.goto(url("?view=week&date=2027-03-10"));
  await expect(page.getByRole("button", { name: /Atelier découverte.*14:30 – 16:00/ })).toBeVisible();
});

test("journée entière sur plusieurs jours : affichée chaque jour", async ({ page }) => {
  await page.goto(url("?date=2027-03-10"));
  await page.getByRole("button", { name: "Nouveau rendez-vous" }).click();
  const dialog = sheet(page, "Nouveau rendez-vous");
  await dialog.getByLabel("Titre").fill("Salon du design");
  await dialog.getByRole("switch", { name: "Journée entière" }).click();
  await expect(dialog.getByLabel("Heure de début")).toHaveCount(0);
  await dialog.getByLabel("Début", { exact: true }).fill("2027-03-17");
  await dialog.getByLabel("Fin", { exact: true }).fill("2027-03-19");
  await dialog.getByRole("button", { name: "Créer le rendez-vous" }).click();
  await expect(byText(page, "Rendez-vous créé")).toBeVisible();

  await page.reload();
  for (const label of ["mercredi 17 mars 2027", "jeudi 18 mars 2027", "vendredi 19 mars 2027"]) {
    await expect(day(page, label).getByRole("button", { name: /Salon du design/ })).toBeVisible();
  }
  await expect(day(page, "samedi 20 mars 2027").getByRole("button", { name: /Salon du design/ })).toHaveCount(0);

  const { data } = await adminClient()
    .from("events")
    .select("starts_at, ends_at, all_day")
    .eq("workspace_id", workspaceId)
    .eq("title", "Salon du design")
    .single();
  expect(data!.all_day).toBe(true);
  expect(new Date(data!.starts_at).toISOString()).toBe("2027-03-16T23:00:00.000Z"); // 17 mars 00:00 Paris
  expect(new Date(data!.ends_at).toISOString()).toBe("2027-03-19T23:00:00.000Z"); // 20 mars 00:00 Paris (exclu)
});

test("modification puis suppression d'un rendez-vous", async ({ page }) => {
  await page.goto(url("?date=2027-03-10"));
  await day(page, "mercredi 10 mars 2027").getByRole("button", { name: /Atelier découverte/ }).click();
  const dialog = sheet(page, "Modifier le rendez-vous");
  await expect(dialog.getByLabel("Heure de début")).toHaveValue("14:30");
  await dialog.getByLabel("Titre").fill("Atelier découverte (décalé)");
  await dialog.getByLabel("Début", { exact: true }).fill("2027-03-11");
  await dialog.getByLabel("Fin", { exact: true }).fill("2027-03-11");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(byText(page, "Modifications enregistrées")).toBeVisible();

  await page.reload();
  await expect(day(page, "mercredi 10 mars 2027").getByRole("button", { name: /Atelier découverte/ })).toHaveCount(0);
  await day(page, "jeudi 11 mars 2027").getByRole("button", { name: /Atelier découverte \(décalé\)/ }).click();
  await sheet(page, "Modifier le rendez-vous").getByRole("button", { name: "Supprimer" }).click();
  await page
    .getByRole("alertdialog", { name: "Supprimer ce rendez-vous ?" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(byText(page, "Rendez-vous supprimé")).toBeVisible();
  await page.reload();
  await expect(day(page, "jeudi 11 mars 2027").getByRole("button", { name: /Atelier découverte/ })).toHaveCount(0);
});

test("tâches, projets et devis apparaissent avec un lien ; filtres par type", async ({ page }) => {
  const admin = adminClient();
  const { data: client } = await admin
    .from("clients")
    .insert({ workspace_id: workspaceId, kind: "company", company_name: "Maison Opale", contact_name: "Léa" })
    .select("id")
    .single();
  const { data: project } = await admin
    .from("projects")
    .insert({ workspace_id: workspaceId, name: "Refonte du site", start_date: "2027-04-05", due_date: "2027-04-28" })
    .select("id")
    .single();
  const { error: taskError } = await admin
    .from("tasks")
    .insert({ workspace_id: workspaceId, title: "Livrer la maquette", due_date: "2027-04-15" });
  expect(taskError).toBeNull();
  const { data: quoteId } = await admin.rpc("save_quote", {
    p_workspace_id: workspaceId,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: client!.id, title: "Identité visuelle", issue_date: "2027-04-01", valid_until: "2027-04-20" },
    p_items: [{ label: "Logo", quantity: "1", unit_price_cents: 50000, vat_rate_bp: 2000 }],
  });
  await admin.rpc("set_quote_status", { p_workspace_id: workspaceId, p_quote_id: quoteId!, p_status: "sent" });

  await page.goto(url("?date=2027-04-01"));
  await expect(day(page, "lundi 5 avril 2027").getByRole("link", { name: "Refonte du site" })).toHaveAttribute(
    "href",
    `/w/${me.slug}/projets/${project!.id}`,
  );
  await expect(day(page, "mercredi 28 avril 2027").getByRole("link", { name: "Refonte du site" })).toBeVisible();
  await expect(day(page, "jeudi 15 avril 2027").getByRole("link", { name: "Livrer la maquette" })).toBeVisible();
  await expect(day(page, "mardi 20 avril 2027").getByRole("link", { name: /Identité visuelle/ })).toHaveAttribute(
    "href",
    `/w/${me.slug}/devis/${quoteId}`,
  );

  // Masquer les tâches
  await page.getByRole("switch", { name: "Tâches" }).click();
  await expect(page).toHaveURL(url("?date=2027-04-01&hide=task"));
  await expect(page.getByRole("switch", { name: "Tâches" })).toHaveAttribute("aria-checked", "false");
  await expect(day(page, "jeudi 15 avril 2027").getByRole("link", { name: "Livrer la maquette" })).toHaveCount(0);
  await expect(day(page, "lundi 5 avril 2027").getByRole("link", { name: "Refonte du site" })).toBeVisible();

  // Lien de la tâche : liste des tâches filtrée
  await page.getByRole("switch", { name: "Tâches" }).click();
  await day(page, "jeudi 15 avril 2027").getByRole("link", { name: "Livrer la maquette" }).click();
  await expect(page).toHaveURL(/\/taches\?q=Livrer\+la\+maquette&done=1$/);
});

test("mobile : liste des jours du mois, sans défilement horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(url("?date=2027-04-01"));
  await expect(page.getByRole("region", { name: "jeudi 15 avril 2027" })).toContainText("Livrer la maquette");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.goto(url(`?view=week&date=${todayIso()}`));
  await expect(page.getByRole("button", { name: "Nouveau rendez-vous" })).toBeVisible();
  const overflowWeek = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflowWeek).toBeLessThanOrEqual(0);
});

test("les rendez-vous d'un autre espace sont invisibles ; son calendrier est introuvable", async ({ page }) => {
  const other = await createTestUser("Autre Agenda");
  const { data: ws } = await adminClient().from("workspaces").select("id").eq("slug", other.slug).single();
  await adminClient().from("events").insert({
    workspace_id: ws!.id,
    title: "Rendez-vous confidentiel",
    starts_at: "2027-03-10T09:00:00Z",
    ends_at: "2027-03-10T10:00:00Z",
  });

  await page.goto(url("?date=2027-03-10"));
  await expect(day(page, "mercredi 10 mars 2027")).toBeVisible();
  await expect(page.getByText("Rendez-vous confidentiel")).toHaveCount(0);

  await page.goto(`/w/${other.slug}/calendrier`);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
