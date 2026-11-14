import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de la migration 0010 : suppression de son propre compte (public.delete_my_account).
 */
const PREFIX = "rls-account-";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let carla: WorkspaceUser;

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno, carla] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
    setupWorkspaceUser(PREFIX, "Carla Demo"),
  ]);
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("suppression de compte", () => {
  it("un visiteur anonyme ne peut rien supprimer", async () => {
    const { error } = await anonClient().rpc("delete_my_account");
    expect(error).not.toBeNull();
  });

  it("le compte de démonstration ne peut pas être supprimé", async () => {
    await adminClient().from("workspaces").update({ is_demo: true }).eq("id", carla.workspaceId);
    const { error } = await carla.client.rpc("delete_my_account");
    expect(error?.code).toBe("AT010");
    const { data } = await adminClient().auth.admin.getUserById(carla.id);
    expect(data.user?.id).toBe(carla.id);
  });

  it("supprime le compte, son espace et tout son contenu, sans toucher aux autres", async () => {
    const ws = alice.workspaceId;
    const { data: client } = await alice.client
      .from("clients")
      .insert({ workspace_id: ws, kind: "individual", contact_name: "Client d'Alice" })
      .select("id")
      .single();
    await alice.client.rpc("save_quote", {
      p_workspace_id: ws,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: client!.id, title: "Devis" },
      p_items: [{ label: "Ligne", quantity: "1", unit_price_cents: 1000, vat_rate_bp: 2000 }],
    });
    await alice.client.from("projects").insert({ workspace_id: ws, name: "Projet d'Alice" });
    await alice.client.from("tasks").insert({ workspace_id: ws, title: "Tâche d'Alice" });
    await alice.client.from("events").insert({
      workspace_id: ws,
      title: "Rendez-vous d'Alice",
      starts_at: "2026-11-20T09:00:00Z",
      ends_at: "2026-11-20T10:00:00Z",
    });
    await bruno.client.from("clients").insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client de Bruno" });

    const { error } = await alice.client.rpc("delete_my_account");
    expect(error).toBeNull();

    const admin = adminClient();
    const { data: user } = await admin.auth.admin.getUserById(alice.id);
    expect(user.user).toBeNull();
    const { count: workspaces } = await admin.from("workspaces").select("*", { count: "exact", head: true }).eq("id", ws);
    expect(workspaces).toBe(0);
    for (const table of ["clients", "quotes", "projects", "tasks", "events", "activity_logs"] as const) {
      const { count } = await admin.from(table).select("*", { count: "exact", head: true }).eq("workspace_id", ws);
      expect(count, table).toBe(0);
    }
    const { count: profiles } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("id", alice.id);
    expect(profiles).toBe(0);

    // Bruno n'est pas touché
    const { data: brunoClients } = await bruno.client.from("clients").select("contact_name");
    expect(brunoClients).toEqual([{ contact_name: "Client de Bruno" }]);
  });

  it("après suppression, la connexion avec l'ancien mot de passe est impossible", async () => {
    const { error } = await anonClient().auth.signInWithPassword({ email: alice.email, password: "Atelio-test-2026" });
    expect(error).not.toBeNull();
  });
});
