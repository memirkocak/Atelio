import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de sécurité — migration 0005 (tasks).
 */
const PREFIX = "rls-tasks-";
const PERMISSION_DENIED = "42501";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let aliceProjectId: string;
let brunoProjectId: string;
let brunoTaskId: string;

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const ap = await alice.client
    .from("projects")
    .insert({ workspace_id: alice.workspaceId, name: "Projet Alice" })
    .select("id")
    .single();
  const bp = await bruno.client
    .from("projects")
    .insert({ workspace_id: bruno.workspaceId, name: "Projet Bruno" })
    .select("id")
    .single();
  aliceProjectId = ap.data!.id;
  brunoProjectId = bp.data!.id;
  const bt = await bruno.client
    .from("tasks")
    .insert({ workspace_id: bruno.workspaceId, title: "Tâche secrète", project_id: brunoProjectId })
    .select("id")
    .single();
  brunoTaskId = bt.data!.id;
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("tâches : droits du membre", () => {
  it("crée une tâche avec les valeurs par défaut", async () => {
    const { data, error } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "Écrire le brief", project_id: aliceProjectId })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({
      status: "todo",
      priority: "medium",
      completed_at: null,
      created_by: alice.id,
      search_text: "ecrire le brief",
    });
  });

  it("completed_at suit le passage au statut terminée et n'est pas modifiable", async () => {
    const { data: t } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "À cocher" })
      .select("id")
      .single();
    const done = await alice.client.from("tasks").update({ status: "done" }).eq("id", t!.id).select("completed_at").single();
    expect(done.data?.completed_at).not.toBeNull();
    const reopened = await alice.client.from("tasks").update({ status: "todo" }).eq("id", t!.id).select("completed_at").single();
    expect(reopened.data?.completed_at).toBeNull();

    const forged = await alice.client
      .from("tasks")
      .update({ completed_at: "2020-01-01T00:00:00Z" }) // colonne non autorisée en écriture
      .eq("id", t!.id);
    expect(forged.error?.code).toBe(PERMISSION_DENIED);
  });

  it("les contraintes refusent un titre vide", async () => {
    const { error } = await alice.client.from("tasks").insert({ workspace_id: alice.workspaceId, title: "  " });
    expect(error?.code).toBe("23514");
  });
});

describe("tâches : intégrité entre espaces", () => {
  it("refuse de lier une tâche au projet d'un autre espace", async () => {
    const insert = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "Vol de projet", project_id: brunoProjectId });
    expect(insert.error?.code).toBe("23503");

    const { data: t } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "À relier" })
      .select("id")
      .single();
    const update = await alice.client.from("tasks").update({ project_id: brunoProjectId }).eq("id", t!.id);
    expect(update.error?.code).toBe("23503");
  });

  it("A ne voit, ne modifie ni ne supprime les tâches de B", async () => {
    const read = await alice.client.from("tasks").select("id").eq("id", brunoTaskId);
    const upd = await alice.client.from("tasks").update({ status: "done" }).eq("id", brunoTaskId).select("id");
    const del = await alice.client.from("tasks").delete().eq("id", brunoTaskId).select("id");
    expect(read.data).toEqual([]);
    expect(upd.data ?? []).toEqual([]);
    expect(del.data ?? []).toEqual([]);

    const { data } = await adminClient().from("tasks").select("status").eq("id", brunoTaskId).single();
    expect(data?.status).toBe("todo");
  });

  it("A ne peut ni créer de tâche chez B ni déplacer une tâche", async () => {
    const insert = await alice.client.from("tasks").insert({ workspace_id: bruno.workspaceId, title: "Intrus" });
    expect(insert.error?.code).toBe(PERMISSION_DENIED);

    const { data: t } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "Immobile" })
      .select("id")
      .single();
    const move = await alice.client
      .from("tasks")
      .update({ workspace_id: bruno.workspaceId }) // colonne non autorisée en écriture
      .eq("id", t!.id);
    expect(move.error?.code).toBe(PERMISSION_DENIED);
  });

  it("un visiteur anonyme n'a aucun accès", async () => {
    const { error } = await anonClient().from("tasks").select("id");
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("tâches : suppression du projet et journal", () => {
  it("supprimer le projet détache ses tâches sans les supprimer", async () => {
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Projet éphémère" })
      .select("id")
      .single();
    const { data: t } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "Survivante", project_id: p!.id })
      .select("id")
      .single();
    expect((await alice.client.from("projects").delete().eq("id", p!.id)).error).toBeNull();

    const { data } = await alice.client.from("tasks").select("project_id, workspace_id").eq("id", t!.id).single();
    expect(data).toEqual({ project_id: null, workspace_id: alice.workspaceId });
  });

  it("le journal enregistre les tâches", async () => {
    const { data: t } = await alice.client
      .from("tasks")
      .insert({ workspace_id: alice.workspaceId, title: "Journalisée" })
      .select("id")
      .single();
    await alice.client.from("tasks").update({ status: "done" }).eq("id", t!.id);

    const { data: logs } = await alice.client
      .from("activity_logs")
      .select("action, entity_type, summary, changes")
      .eq("entity_id", t!.id)
      .order("created_at");
    expect(logs).toEqual([
      { action: "created", entity_type: "task", summary: "Journalisée", changes: [] },
      { action: "updated", entity_type: "task", summary: "Journalisée", changes: ["completed_at", "status"] },
    ]);
  });
});
