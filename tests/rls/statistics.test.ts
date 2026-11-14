import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { statisticsSchema, type Statistics } from "@/features/stats/schemas";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de la migration 0009 : public.get_statistics.
 * Les dates sont fixées en 2025 (passé) et ajustées par le client d'administration.
 */
const PREFIX = "rls-stats-";
const PERMISSION_DENIED = "42501";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let aliceClients: string[] = [];
let year2025: Statistics;

const admin = () => adminClient();

/** Devis de `qty` × 100 € HT (TVA 20 %) amené au statut voulu, puis dates forcées. */
async function quote(
  user: WorkspaceUser,
  clientId: string,
  qty: number,
  target: "draft" | "sent" | "accepted" | "refused",
  dates: { issue_date: string; valid_until: string; decided_at?: string },
) {
  const { data: id, error } = await user.client.rpc("save_quote", {
    p_workspace_id: user.workspaceId,
    p_quote_id: null as unknown as string,
    p_quote: { client_id: clientId, title: `Devis ${qty}`, issue_date: dates.issue_date, valid_until: dates.valid_until },
    p_items: [{ label: "Prestation", quantity: String(qty), unit_price_cents: 10000, vat_rate_bp: 2000 }],
  });
  if (error) throw error;
  if (target !== "draft") {
    await user.client.rpc("set_quote_status", { p_workspace_id: user.workspaceId, p_quote_id: id!, p_status: "sent" });
  }
  if (target === "accepted" || target === "refused") {
    await user.client.rpc("set_quote_status", { p_workspace_id: user.workspaceId, p_quote_id: id!, p_status: target });
    const decision = target === "accepted" ? { accepted_at: dates.decided_at } : { refused_at: dates.decided_at };
    await admin().from("quotes").update(decision).eq("id", id!);
  }
  return id!;
}

async function stats(user: WorkspaceUser, from: string, to: string, workspaceId = user.workspaceId) {
  return user.client.rpc("get_statistics", { p_workspace_id: workspaceId, p_from: from, p_to: to });
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
      { workspace_id: ws, kind: "company", company_name: "Opale", contact_name: "Léa" },
      { workspace_id: ws, kind: "individual", company_name: null, contact_name: "Nina Robert" },
    ])
    .select("id");
  aliceClients = clients!.map((c) => c.id);
  const [opale, nina] = aliceClients as [string, string];

  // 2025 : 2 acceptés chez Opale (300 + 200), 1 accepté chez Nina (100), 1 refusé, 1 expiré, 1 brouillon
  await quote(alice, opale, 3, "accepted", { issue_date: "2025-02-01", valid_until: "2025-03-01", decided_at: "2025-02-10T10:00:00Z" });
  await quote(alice, opale, 2, "accepted", { issue_date: "2025-06-01", valid_until: "2025-07-01", decided_at: "2025-06-15T10:00:00Z" });
  await quote(alice, nina, 1, "accepted", { issue_date: "2025-06-02", valid_until: "2025-07-01", decided_at: "2025-06-20T10:00:00Z" });
  await quote(alice, nina, 4, "refused", { issue_date: "2025-03-01", valid_until: "2025-04-01", decided_at: "2025-03-05T10:00:00Z" });
  await quote(alice, nina, 5, "sent", { issue_date: "2025-09-01", valid_until: "2025-09-30" }); // expiré sans réponse
  await quote(alice, nina, 6, "draft", { issue_date: "2025-10-01", valid_until: "2025-10-31" });
  // Accepté le 31/12/2025 à 23:30 heure de Paris (= 22:30 UTC) : compte en 2025
  await quote(alice, opale, 7, "accepted", { issue_date: "2025-12-01", valid_until: "2025-12-31", decided_at: "2025-12-31T22:30:00Z" });
  // Accepté le 1er/01/2026 à 00:30 heure de Paris (= 31/12/2025 23:30 UTC) : compte en 2026
  await quote(alice, nina, 8, "accepted", { issue_date: "2025-12-01", valid_until: "2025-12-31", decided_at: "2025-12-31T23:30:00Z" });

  const { data: tasks } = await alice.client
    .from("tasks")
    .insert([
      { workspace_id: ws, title: "T1", status: "done", priority: "high" },
      { workspace_id: ws, title: "T2", status: "done", priority: "low" },
      { workspace_id: ws, title: "T3", status: "todo", priority: "urgent" },
      { workspace_id: ws, title: "T4", status: "in_progress", priority: "urgent" },
      { workspace_id: ws, title: "T5", status: "todo", priority: "medium" },
    ])
    .select("id, title");
  const t = (title: string) => tasks!.find((x) => x.title === title)!.id;
  await admin().from("tasks").update({ completed_at: "2025-06-03T08:00:00Z" }).eq("id", t("T1"));
  await admin().from("tasks").update({ completed_at: "2024-06-03T08:00:00Z" }).eq("id", t("T2"));

  const { data: projects } = await alice.client
    .from("projects")
    .insert([
      { workspace_id: ws, name: "P1", status: "completed" },
      { workspace_id: ws, name: "P2", status: "in_progress" },
    ])
    .select("id, name");
  await admin().from("projects").update({ completed_at: "2025-11-20T10:00:00Z" }).eq("id", projects!.find((p) => p.name === "P1")!.id);

  // Données de Bruno : jamais visibles chez Alice
  const { data: bc } = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client Bruno" })
    .select("id")
    .single();
  await quote(bruno, bc!.id, 50, "accepted", { issue_date: "2025-05-01", valid_until: "2025-06-01", decided_at: "2025-05-02T10:00:00Z" });

  const { data, error } = await stats(alice, "2025-01-01", "2025-12-31");
  if (error) throw error;
  year2025 = statisticsSchema.parse(data);
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("valeurs exactes sur 2025", () => {
  it("indicateurs commerciaux", () => {
    expect(year2025.quotes_created).toBe(8); // émis en 2025, brouillon compris
    expect(year2025.accepted).toEqual({ count: 4, subtotal_cents: 130000, total_cents: 156000 });
    expect(year2025.refused).toBe(1);
    expect(year2025.expired).toBe(1);
  });

  it("projets et tâches terminés dans la période uniquement", () => {
    expect(year2025.projects_completed).toBe(1);
    expect(year2025.tasks_completed).toBe(1); // T2 terminée en 2024
  });

  it("séries mensuelles complètes (12 mois, zéros compris)", () => {
    expect(year2025.granularity).toBe("month");
    expect(year2025.series).toHaveLength(12);
    expect(year2025.series[0]!.start).toBe("2025-01-01");
    const june = year2025.series.find((s) => s.start === "2025-06-01")!;
    expect(june).toMatchObject({ quotes_created: 2, quotes_accepted: 2, accepted_subtotal_cents: 30000, tasks_completed: 1 });
    expect(year2025.series.find((s) => s.start === "2025-12-01")).toMatchObject({ quotes_accepted: 1, accepted_subtotal_cents: 70000 });
    expect(year2025.series.reduce((sum, s) => sum + s.accepted_subtotal_cents, 0)).toBe(130000);
  });

  it("meilleurs clients par CA HT (nom de l'entreprise, sinon du contact)", () => {
    expect(year2025.top_clients).toEqual([
      { id: aliceClients[0], name: "Opale", quotes: 3, subtotal_cents: 120000 },
      { id: aliceClients[1], name: "Nina Robert", quotes: 1, subtotal_cents: 10000 },
    ]);
  });

  it("état actuel : tâches par statut et par priorité (à faire), projets par statut", () => {
    expect(year2025.tasks_by_status).toEqual({ done: 2, todo: 2, in_progress: 1 });
    expect(year2025.open_tasks_by_priority).toEqual({ urgent: 2, medium: 1 });
    expect(year2025.projects_by_status).toEqual({ completed: 1, in_progress: 1 });
  });
});

describe("bornes de période (heure de Paris)", () => {
  it("le 1er janvier 2026 à 00:30 à Paris compte en 2026, le 31 décembre 23:30 en 2025", async () => {
    const { data } = await stats(alice, "2026-01-01", "2026-01-31");
    const jan = statisticsSchema.parse(data);
    expect(jan.accepted).toEqual({ count: 1, subtotal_cents: 80000, total_cents: 96000 });
    expect(jan.top_clients).toEqual([{ id: aliceClients[1], name: "Nina Robert", quotes: 1, subtotal_cents: 80000 }]);
  });

  it("période courte : séries par semaine (lundi), bornes incluses", async () => {
    const { data } = await stats(alice, "2025-06-01", "2025-06-30");
    const june = statisticsSchema.parse(data);
    expect(june.granularity).toBe("week");
    expect(june.series[0]!.start).toBe("2025-05-26"); // lundi de la semaine du 1er juin
    expect(june.series.at(-1)!.start).toBe("2025-06-30");
    expect(june.accepted.count).toBe(2);
    expect(june.tasks_completed).toBe(1);
  });

  it("période sans données : zéros et listes vides", async () => {
    const { data } = await stats(alice, "2023-01-01", "2023-03-31");
    const empty = statisticsSchema.parse(data);
    expect(empty.accepted).toEqual({ count: 0, subtotal_cents: 0, total_cents: 0 });
    expect(empty.top_clients).toEqual([]);
    expect(empty.series.every((s) => s.quotes_created === 0)).toBe(true);
  });

  it("période invalide (fin avant début, plus de 3 ans) : refusée", async () => {
    const reversed = await stats(alice, "2025-12-31", "2025-01-01");
    const tooLong = await stats(alice, "2020-01-01", "2025-12-31");
    expect(reversed.error?.code).toBe("22023");
    expect(tooLong.error?.code).toBe("22023");
  });
});

describe("sécurité", () => {
  it("un autre utilisateur ne peut pas lire les statistiques d'Alice", async () => {
    const { data, error } = await stats(bruno, "2025-01-01", "2025-12-31", alice.workspaceId);
    expect(data).toBeNull();
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("chacun ne voit que son espace", async () => {
    const { data } = await stats(bruno, "2025-01-01", "2025-12-31");
    const s = statisticsSchema.parse(data);
    expect(s.accepted).toEqual({ count: 1, subtotal_cents: 500000, total_cents: 600000 });
    expect(s.top_clients).toHaveLength(1);
    expect(s.tasks_by_status).toEqual({});
  });

  it("anonyme : refusé", async () => {
    const { data, error } = await anonClient().rpc("get_statistics", {
      p_workspace_id: alice.workspaceId,
      p_from: "2025-01-01",
      p_to: "2025-12-31",
    });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
