import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de sécurité — migration 0004 (projects).
 */
const PREFIX = "rls-projects-";
const PERMISSION_DENIED = "42501";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let aliceClientId: string;
let brunoClientId: string;
let brunoProjectId: string;

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const ac = await alice.client
    .from("clients")
    .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "Client Alice" })
    .select("id")
    .single();
  const bc = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client Bruno" })
    .select("id")
    .single();
  aliceClientId = ac.data!.id;
  brunoClientId = bc.data!.id;
  const bp = await bruno.client
    .from("projects")
    .insert({ workspace_id: bruno.workspaceId, name: "Projet secret", client_id: brunoClientId })
    .select("id")
    .single();
  brunoProjectId = bp.data!.id;
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("projets : droits du membre", () => {
  it("crée un projet lié à son client, avec des valeurs par défaut", async () => {
    const { data, error } = await alice.client
      .from("projects")
      .insert({
        workspace_id: alice.workspaceId,
        client_id: aliceClientId,
        name: "Refonte du site",
        budget_cents: 150050,
        start_date: "2026-11-01",
        due_date: "2026-12-15",
      })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      status: "upcoming",
      progress: 0,
      completed_at: null,
      created_by: alice.id,
      budget_cents: 150050,
      search_text: "refonte du site",
    });
  });

  it("completed_at suit le passage au statut terminé", async () => {
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "À terminer" })
      .select("id")
      .single();
    const done = await alice.client
      .from("projects")
      .update({ status: "completed" })
      .eq("id", p!.id)
      .select("completed_at")
      .single();
    expect(done.data?.completed_at).not.toBeNull();

    const reopened = await alice.client
      .from("projects")
      .update({ status: "in_progress" })
      .eq("id", p!.id)
      .select("completed_at")
      .single();
    expect(reopened.data?.completed_at).toBeNull();

    // La colonne n'est pas modifiable directement
    const forged = await alice.client
      .from("projects")
      // Les types générés ignorent les droits par colonne : refus attendu de la base.
      .update({ completed_at: "2020-01-01T00:00:00Z" })
      .eq("id", p!.id);
    expect(forged.error?.code).toBe(PERMISSION_DENIED);
  });

  it.each([
    ["échéance avant le début", { start_date: "2026-12-10", due_date: "2026-12-01" }],
    ["budget négatif", { budget_cents: -1 }],
    ["avancement > 100", { progress: 101 }],
    ["nom vide", { name: "   " }],
  ])("les contraintes refusent : %s", async (_label, patch) => {
    const { error } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Contraintes", ...patch });
    expect(error?.code).toBe("23514");
  });
});

describe("projets : intégrité entre espaces", () => {
  it("refuse de lier un projet au client d'un autre espace (création)", async () => {
    const { error } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Vol de client", client_id: brunoClientId });
    expect(error?.code).toBe("23503"); // clé étrangère composite
  });

  it("refuse de lier un projet au client d'un autre espace (modification)", async () => {
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "À relier" })
      .select("id")
      .single();
    const { error } = await alice.client.from("projects").update({ client_id: brunoClientId }).eq("id", p!.id);
    expect(error?.code).toBe("23503");
  });

  it("A ne voit, ne modifie ni ne supprime les projets de B", async () => {
    const read = await alice.client.from("projects").select("id").eq("id", brunoProjectId);
    const upd = await alice.client.from("projects").update({ name: "Piraté" }).eq("id", brunoProjectId).select("id");
    const del = await alice.client.from("projects").delete().eq("id", brunoProjectId).select("id");
    expect(read.data).toEqual([]);
    expect(upd.data ?? []).toEqual([]);
    expect(del.data ?? []).toEqual([]);

    const { data } = await adminClient().from("projects").select("name").eq("id", brunoProjectId).single();
    expect(data?.name).toBe("Projet secret");
  });

  it("A ne peut pas créer de projet dans l'espace de B ni déplacer un projet", async () => {
    const insert = await alice.client
      .from("projects")
      .insert({ workspace_id: bruno.workspaceId, name: "Intrus" });
    expect(insert.error?.code).toBe(PERMISSION_DENIED);

    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Immobile" })
      .select("id")
      .single();
    const move = await alice.client
      .from("projects")
      .update({ workspace_id: bruno.workspaceId }) // colonne non autorisée en écriture
      .eq("id", p!.id);
    expect(move.error?.code).toBe(PERMISSION_DENIED);
  });

  it("un visiteur anonyme n'a aucun accès", async () => {
    const { error } = await anonClient().from("projects").select("id");
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("projets : suppression du client et journal", () => {
  it("supprimer le client détache ses projets sans les supprimer", async () => {
    const { data: c } = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "Client éphémère" })
      .select("id")
      .single();
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Survivant", client_id: c!.id })
      .select("id")
      .single();

    const del = await alice.client.from("clients").delete().eq("id", c!.id);
    expect(del.error).toBeNull();

    const { data } = await alice.client
      .from("projects")
      .select("client_id, workspace_id")
      .eq("id", p!.id)
      .single();
    expect(data).toEqual({ client_id: null, workspace_id: alice.workspaceId });
  });

  it("le journal enregistre les projets", async () => {
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Journalisé" })
      .select("id")
      .single();
    await alice.client.from("projects").update({ status: "in_progress", progress: 30 }).eq("id", p!.id);

    const { data: logs } = await alice.client
      .from("activity_logs")
      .select("action, entity_type, summary, changes")
      .eq("entity_id", p!.id)
      .order("created_at");
    expect(logs).toEqual([
      { action: "created", entity_type: "project", summary: "Journalisé", changes: [] },
      { action: "updated", entity_type: "project", summary: "Journalisé", changes: ["progress", "status"] },
    ]);
  });
});
