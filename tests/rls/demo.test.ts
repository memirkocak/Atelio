import type { User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type TypedClient,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests des migrations 0011 / 0012 : espace de démonstration créé à la connexion anonyme,
 * isolation entre visiteurs, purge réservée au rôle service_role.
 */
const PREFIX = "rls-demo-";

type DemoVisitor = { client: TypedClient; user: User; workspaceId: string };
const visitors: DemoVisitor[] = [];
let real: WorkspaceUser;

async function startDemo(): Promise<DemoVisitor> {
  const client = anonClient();
  const { data, error } = await client.auth.signInAnonymously({ options: { data: { full_name: "Visiteur" } } });
  if (error || !data.user) throw error ?? new Error("Session anonyme impossible");
  const { data: ws } = await client.from("workspaces").select("id").single();
  const visitor = { client, user: data.user, workspaceId: ws!.id };
  visitors.push(visitor);
  return visitor;
}

let first: DemoVisitor;
let second: DemoVisitor;

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  real = await setupWorkspaceUser(PREFIX, "Rémi Réel");
  [first, second] = await Promise.all([startDemo(), startDemo()]);
});

afterAll(async () => {
  const admin = adminClient();
  for (const v of visitors) {
    await admin.from("workspaces").delete().eq("id", v.workspaceId);
    await admin.auth.admin.deleteUser(v.user.id);
  }
  await deleteTestUsers(PREFIX);
});

describe("espace de démonstration", () => {
  it("est créé, marqué is_demo et rempli à la connexion anonyme", async () => {
    const { data: ws } = await first.client.from("workspaces").select("name, slug, is_demo, company_name, siret").single();
    expect(ws).toMatchObject({ name: "Studio Lumen (démo)", is_demo: true, company_name: "Studio Lumen", siret: null });
    expect(ws!.slug).toMatch(/^studio-lumen-[a-f0-9]{4}$/);

    const counts: Record<string, number | null> = {};
    for (const table of ["clients", "projects", "tasks", "quotes", "events", "activity_logs"] as const) {
      const { count } = await first.client.from(table).select("*", { count: "exact", head: true });
      counts[table] = count;
    }
    expect(counts).toEqual({ clients: 8, projects: 7, tasks: 22, quotes: 14, events: 8, activity_logs: expect.any(Number) });
    expect(counts.activity_logs).toBeGreaterThan(0);
  });

  it("les montants des devis sont cohérents au centime (lignes = totaux, TVA 20 %)", async () => {
    const { data: quotes } = await first.client
      .from("quotes")
      .select("id, number, status, subtotal_cents, vat_cents, total_cents, client_snapshot, quote_items(line_subtotal_cents, line_vat_cents, line_total_cents)");
    for (const q of quotes!) {
      const items = q.quote_items as { line_subtotal_cents: number; line_vat_cents: number; line_total_cents: number }[];
      expect(items.reduce((s, i) => s + i.line_subtotal_cents, 0), q.number).toBe(q.subtotal_cents);
      expect(items.reduce((s, i) => s + i.line_vat_cents, 0), q.number).toBe(q.vat_cents);
      expect(q.total_cents).toBe(q.subtotal_cents + q.vat_cents);
      expect(q.vat_cents).toBe(Math.round(q.subtotal_cents * 0.2));
      // Instantané client figé dès l'envoi
      expect(q.client_snapshot === null, q.number).toBe(q.status === "draft");
    }
    const numbers = quotes!.map((q) => q.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("les indicateurs du tableau de bord sont remplis (données relatives à aujourd'hui)", async () => {
    const { data } = await first.client.rpc("get_dashboard_stats", { p_workspace_id: first.workspaceId });
    const stats = data as { clients: number; tasks_overdue: number; revenue: { count: number }; pipeline: { count: number } };
    expect(stats.clients).toBe(8);
    expect(stats.tasks_overdue).toBeGreaterThan(0);
    expect(stats.revenue.count).toBe(7);
    expect(stats.pipeline.count).toBe(2);
  });

  it("chaque visiteur a son propre espace, invisible des autres", async () => {
    expect(second.workspaceId).not.toBe(first.workspaceId);
    const { data } = await second.client.from("clients").select("id").eq("workspace_id", first.workspaceId);
    expect(data).toEqual([]);
    const { error } = await second.client.rpc("get_dashboard_stats", { p_workspace_id: first.workspaceId });
    expect(error?.code).toBe("42501");
  });

  it("un compte normal n'est pas rempli ni marqué démo", async () => {
    const { data: ws } = await real.client.from("workspaces").select("is_demo").single();
    expect(ws?.is_demo).toBe(false);
    const { count } = await real.client.from("clients").select("*", { count: "exact", head: true });
    expect(count).toBe(0);
  });

  it("le compte de démonstration ne peut pas être supprimé par le visiteur", async () => {
    const { error } = await first.client.rpc("delete_my_account");
    expect(error?.code).toBe("AT010");
  });

  it("le visiteur ne peut pas sortir son espace du mode démo", async () => {
    const { error } = await first.client.from("workspaces").update({ is_demo: false }).eq("id", first.workspaceId);
    expect(error?.code).toBe("42501");
  });
});

describe("purge des espaces de démonstration", () => {
  it("est refusée aux visiteurs, aux utilisateurs et aux anonymes", async () => {
    for (const client of [first.client, real.client, anonClient()]) {
      const { error } = await client.rpc("purge_demo_accounts", { p_max_age: "0 seconds" });
      expect(error).not.toBeNull();
    }
  });

  it("supprime les espaces et comptes anonymes plus anciens que l'âge donné, et eux seuls", async () => {
    const admin = adminClient();
    const recent = await startDemo();
    // Rien de plus vieux qu'un an : aucune suppression parmi nos visiteurs
    await admin.rpc("purge_demo_accounts", { p_max_age: "365 days" });
    expect((await admin.auth.admin.getUserById(recent.user.id)).data.user?.id).toBe(recent.user.id);

    await new Promise((r) => setTimeout(r, 1500));
    const { data: purged, error } = await admin.rpc("purge_demo_accounts", { p_max_age: "1 second" });
    expect(error).toBeNull();
    expect(purged).toBeGreaterThanOrEqual(3);
    for (const v of [first, second, recent]) {
      expect((await admin.auth.admin.getUserById(v.user.id)).data.user).toBeNull();
      const { count } = await admin.from("workspaces").select("*", { count: "exact", head: true }).eq("id", v.workspaceId);
      expect(count).toBe(0);
    }
    // Le compte réel n'est pas touché
    expect((await admin.auth.admin.getUserById(real.id)).data.user?.id).toBe(real.id);
  });

  it("refuse un âge négatif", async () => {
    const { error } = await adminClient().rpc("purge_demo_accounts", { p_max_age: "-1 hour" });
    expect(error?.code).toBe("22023");
  });
});
