import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dashboardStatsSchema, type DashboardStats } from "@/features/dashboard/schemas";
import { todayIso } from "@/lib/dates";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de la migration 0007 : public.get_dashboard_stats.
 * Valeurs exactes sur un jeu de données connu, fuseau de Paris, isolation entre espaces.
 */
const PREFIX = "rls-dashboard-";
const PERMISSION_DENIED = "42501";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let stats: DashboardStats;

const today = todayIso();
const currentMonth = today.slice(0, 7);

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Crée un devis (100 € HT × quantité, TVA 20 %) et l'amène au statut voulu. */
async function quote(
  user: WorkspaceUser,
  clientId: string,
  quantity: string,
  target: "draft" | "sent" | "accepted" | "refused",
  dates: { issue_date?: string; valid_until?: string } = {},
) {
  const { data: id, error } = await user.client.rpc("save_quote", {
    p_workspace_id: user.workspaceId,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: clientId, title: `Devis ${quantity}`, ...dates },
    p_items: [{ label: "Prestation", quantity, unit_price_cents: 10000, vat_rate_bp: 2000 }],
  });
  if (error) throw error;
  if (target !== "draft") {
    await user.client.rpc("set_quote_status", { p_workspace_id: user.workspaceId, p_quote_id: id!, p_status: "sent" });
  }
  if (target === "accepted" || target === "refused") {
    await user.client.rpc("set_quote_status", { p_workspace_id: user.workspaceId, p_quote_id: id!, p_status: target });
  }
  return id!;
}

async function fetchStats(user: WorkspaceUser, workspaceId = user.workspaceId) {
  return user.client.rpc("get_dashboard_stats", { p_workspace_id: workspaceId });
}

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const ws = alice.workspaceId;

  const { data: clients } = await alice.client
    .from("clients")
    .insert([
      { workspace_id: ws, kind: "individual", contact_name: "Client 1" },
      { workspace_id: ws, kind: "individual", contact_name: "Client 2" },
    ])
    .select("id");
  const clientId = clients![0]!.id;

  await alice.client.from("projects").insert([
    { workspace_id: ws, name: "En cours 1", status: "in_progress" },
    { workspace_id: ws, name: "En cours 2", status: "in_progress" },
    { workspace_id: ws, name: "À venir", status: "upcoming" },
    { workspace_id: ws, name: "Terminé", status: "completed" },
  ]);

  const { data: tasks } = await alice.client
    .from("tasks")
    .insert([
      { workspace_id: ws, title: "En retard", status: "todo", due_date: addDays(today, -1) },
      { workspace_id: ws, title: "En retard en cours", status: "in_progress", due_date: addDays(today, -10) },
      { workspace_id: ws, title: "Échéance aujourd'hui", status: "todo", due_date: today },
      { workspace_id: ws, title: "Sans échéance", status: "todo" },
      { workspace_id: ws, title: "Terminée cette semaine", status: "done", due_date: addDays(today, -5) },
      { workspace_id: ws, title: "Terminée il y a longtemps", status: "done" },
    ])
    .select("id, title");
  const oldDone = tasks!.find((t) => t.title === "Terminée il y a longtemps")!.id;
  // Hors de la fenêtre de 8 semaines
  await adminClient().from("tasks").update({ completed_at: "2020-01-15T10:00:00Z" }).eq("id", oldDone);

  await quote(alice, clientId, "1", "accepted"); // 100 € HT / 120 € TTC, accepté ce mois-ci
  const oldAccepted = await quote(alice, clientId, "3", "accepted"); // 300 / 360, accepté il y a longtemps
  await adminClient().from("quotes").update({ accepted_at: "2020-03-10T10:00:00Z" }).eq("id", oldAccepted);
  await quote(alice, clientId, "2", "sent"); // pipeline : 200 / 240
  await quote(alice, clientId, "5", "sent", { issue_date: "2020-01-01", valid_until: "2020-01-31" }); // expiré
  await quote(alice, clientId, "7", "draft");
  await quote(alice, clientId, "11", "refused");

  // Données de Bruno : ne doivent jamais apparaître chez Alice
  const { data: bc } = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client Bruno" })
    .select("id")
    .single();
  await quote(bruno, bc!.id, "50", "accepted");
  await bruno.client.from("tasks").insert({ workspace_id: bruno.workspaceId, title: "Tâche Bruno", status: "todo" });

  const { data, error } = await fetchStats(alice);
  if (error) throw error;
  stats = dashboardStatsSchema.parse(data);
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("valeurs exactes", () => {
  it("renvoie le jour de Paris", () => {
    expect(stats.today).toBe(today);
  });

  it("compte clients, projets en cours et tâches", () => {
    expect(stats.clients).toBe(2);
    expect(stats.projects_in_progress).toBe(2);
    expect(stats.tasks_open).toBe(4);
    expect(stats.tasks_overdue).toBe(2); // l'échéance du jour n'est pas en retard
  });

  it("CA suivi = tous les devis acceptés (HT et TTC)", () => {
    expect(stats.revenue).toEqual({ count: 2, subtotal_cents: 40000, total_cents: 48000 });
  });

  it("pipeline = devis envoyés non expirés (brouillons, refusés et expirés exclus)", () => {
    expect(stats.pipeline).toEqual({ count: 1, subtotal_cents: 20000, total_cents: 24000 });
  });

  it("CA par mois : 6 mois consécutifs, mois courant en dernier, ancien devis hors période", () => {
    expect(stats.revenue_by_month).toHaveLength(6);
    expect(stats.revenue_by_month.at(-1)).toEqual({ month: currentMonth, subtotal_cents: 10000, total_cents: 12000 });
    const sum = stats.revenue_by_month.reduce((s, m) => s + m.total_cents, 0);
    expect(sum).toBe(12000);
    const months = stats.revenue_by_month.map((m) => m.month);
    expect([...months].sort()).toEqual(months);
  });

  it("tâches terminées par semaine : 8 lundis consécutifs, semaine courante en dernier", () => {
    const weeks = stats.tasks_completed_by_week;
    expect(weeks).toHaveLength(8);
    for (const w of weeks) expect(new Date(`${w.week_start}T12:00:00Z`).getUTCDay()).toBe(1);
    expect(weeks.at(-1)!.week_start <= today).toBe(true);
    expect(addDays(weeks.at(-1)!.week_start, 7) > today).toBe(true);
    expect(weeks.at(-1)!.count).toBe(1);
    expect(weeks.reduce((s, w) => s + w.count, 0)).toBe(1);
  });
});

describe("fuseau Europe/Paris", () => {
  it("un devis accepté à 00h30 à Paris le 1er du mois compte dans ce mois (et non le précédent en UTC)", async () => {
    const { data: c } = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "Client fuseau" })
      .select("id")
      .single();
    const id = await quote(alice, c!.id, "4", "accepted");
    // 1er du mois courant, 00:30 heure de Paris (= veille au soir en UTC)
    const [y, m] = currentMonth.split("-").map(Number) as [number, number];
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "shortOffset" })
      .formatToParts(new Date(Date.UTC(y, m - 1, 1, 12)))
      .find((p) => p.type === "timeZoneName")!.value; // « GMT+1 » ou « GMT+2 »
    const hours = Number(offset.replace("GMT", "")) || 0;
    const acceptedAt = new Date(Date.UTC(y, m - 1, 1, 0, 30) - hours * 3600_000).toISOString();
    expect(acceptedAt < `${currentMonth}-01T00:00:00.000Z`).toBe(true);
    await adminClient().from("quotes").update({ accepted_at: acceptedAt }).eq("id", id);

    const { data } = await fetchStats(alice);
    const s = dashboardStatsSchema.parse(data);
    expect(s.revenue_by_month.at(-1)!.total_cents).toBe(12000 + 48000);
  });
});

describe("sécurité", () => {
  it("un autre utilisateur ne peut pas lire les indicateurs d'Alice", async () => {
    const { data, error } = await fetchStats(bruno, alice.workspaceId);
    expect(data).toBeNull();
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("chacun ne voit que son espace", async () => {
    const { data, error } = await fetchStats(bruno);
    expect(error).toBeNull();
    const s = dashboardStatsSchema.parse(data);
    expect(s.clients).toBe(1);
    expect(s.tasks_open).toBe(1);
    expect(s.revenue).toEqual({ count: 1, subtotal_cents: 500000, total_cents: 600000 });
    expect(s.pipeline.count).toBe(0);
  });

  it("anonyme : refusé", async () => {
    const { data, error } = await anonClient().rpc("get_dashboard_stats", { p_workspace_id: alice.workspaceId });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("espace inexistant ou nul : refusé", async () => {
    const { error } = await fetchStats(alice, "00000000-0000-0000-0000-000000000000");
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});
