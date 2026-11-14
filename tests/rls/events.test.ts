import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de sécurité — migration 0008 (events : rendez-vous du calendrier).
 */
const PREFIX = "rls-events-";
const PERMISSION_DENIED = "42501";
const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let brunoClientId: string;
let brunoProjectId: string;
let brunoEventId: string;

const slot = { starts_at: "2026-11-20T09:00:00Z", ends_at: "2026-11-20T10:00:00Z" };

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const bc = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client Bruno" })
    .select("id")
    .single();
  const bp = await bruno.client
    .from("projects")
    .insert({ workspace_id: bruno.workspaceId, name: "Projet Bruno" })
    .select("id")
    .single();
  brunoClientId = bc.data!.id;
  brunoProjectId = bp.data!.id;
  const be = await bruno.client
    .from("events")
    .insert({ workspace_id: bruno.workspaceId, title: "Rendez-vous secret", ...slot })
    .select("id")
    .single();
  brunoEventId = be.data!.id;
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("rendez-vous : droits du membre", () => {
  it("crée, lit, modifie et supprime un rendez-vous de son espace", async () => {
    const { data: e, error } = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Point client", location: "Visio", ...slot })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(e).toMatchObject({ all_day: false, created_by: alice.id, client_id: null, project_id: null });

    const upd = await alice.client
      .from("events")
      .update({ title: "Point client (décalé)", ends_at: "2026-11-20T11:00:00Z" })
      .eq("id", e!.id)
      .select("title")
      .single();
    expect(upd.data?.title).toBe("Point client (décalé)");

    const del = await alice.client.from("events").delete().eq("id", e!.id).select("id");
    expect(del.data).toHaveLength(1);
  });

  it("refuse une fin avant ou égale au début, un titre vide, une durée de plus d'un an", async () => {
    const base = { workspace_id: alice.workspaceId, title: "Invalide" };
    const reversed = await alice.client
      .from("events")
      .insert({ ...base, starts_at: "2026-11-20T10:00:00Z", ends_at: "2026-11-20T09:00:00Z" });
    const zero = await alice.client
      .from("events")
      .insert({ ...base, starts_at: "2026-11-20T10:00:00Z", ends_at: "2026-11-20T10:00:00Z" });
    const empty = await alice.client.from("events").insert({ ...base, title: "   ", ...slot });
    const tooLong = await alice.client
      .from("events")
      .insert({ ...base, starts_at: "2026-01-01T00:00:00Z", ends_at: "2027-06-01T00:00:00Z" });
    expect(reversed.error?.code).toBe(CHECK_VIOLATION);
    expect(zero.error?.code).toBe(CHECK_VIOLATION);
    expect(empty.error?.code).toBe(CHECK_VIOLATION);
    expect(tooLong.error?.code).toBe(CHECK_VIOLATION);
  });

  it("created_by et workspace_id ne sont pas modifiables", async () => {
    const { data: e } = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Immobile", ...slot })
      .select("id")
      .single();
    const move = await alice.client.from("events").update({ workspace_id: bruno.workspaceId }).eq("id", e!.id);
    const author = await alice.client.from("events").update({ created_by: bruno.id }).eq("id", e!.id);
    expect(move.error?.code).toBe(PERMISSION_DENIED);
    expect(author.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("rendez-vous : intégrité entre espaces", () => {
  it("refuse de lier un rendez-vous au client ou au projet d'un autre espace", async () => {
    const withClient = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Vol de client", client_id: brunoClientId, ...slot });
    const withProject = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Vol de projet", project_id: brunoProjectId, ...slot });
    expect(withClient.error?.code).toBe(FOREIGN_KEY_VIOLATION);
    expect(withProject.error?.code).toBe(FOREIGN_KEY_VIOLATION);
  });

  it("A ne voit, ne modifie ni ne supprime les rendez-vous de B", async () => {
    const read = await alice.client.from("events").select("id").eq("id", brunoEventId);
    const upd = await alice.client.from("events").update({ title: "Piraté" }).eq("id", brunoEventId).select("id");
    const del = await alice.client.from("events").delete().eq("id", brunoEventId).select("id");
    expect(read.data).toEqual([]);
    expect(upd.data ?? []).toEqual([]);
    expect(del.data ?? []).toEqual([]);

    const { data } = await adminClient().from("events").select("title").eq("id", brunoEventId).single();
    expect(data?.title).toBe("Rendez-vous secret");
  });

  it("A ne peut pas créer de rendez-vous chez B", async () => {
    const { error } = await alice.client
      .from("events")
      .insert({ workspace_id: bruno.workspaceId, title: "Intrus", ...slot });
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("un visiteur anonyme n'a aucun accès", async () => {
    const { error } = await anonClient().from("events").select("id");
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("rendez-vous : détachement et journal", () => {
  it("supprimer le client ou le projet détache le rendez-vous sans le supprimer", async () => {
    const { data: c } = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "Client éphémère" })
      .select("id")
      .single();
    const { data: p } = await alice.client
      .from("projects")
      .insert({ workspace_id: alice.workspaceId, name: "Projet éphémère" })
      .select("id")
      .single();
    const { data: e } = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Survivant", client_id: c!.id, project_id: p!.id, ...slot })
      .select("id")
      .single();

    expect((await alice.client.from("clients").delete().eq("id", c!.id)).error).toBeNull();
    expect((await alice.client.from("projects").delete().eq("id", p!.id)).error).toBeNull();

    const { data } = await alice.client
      .from("events")
      .select("client_id, project_id, workspace_id")
      .eq("id", e!.id)
      .single();
    expect(data).toEqual({ client_id: null, project_id: null, workspace_id: alice.workspaceId });
  });

  it("le journal enregistre les rendez-vous", async () => {
    const { data: e } = await alice.client
      .from("events")
      .insert({ workspace_id: alice.workspaceId, title: "Journalisé", ...slot })
      .select("id")
      .single();
    await alice.client.from("events").update({ location: "Lyon" }).eq("id", e!.id);
    await alice.client.from("events").delete().eq("id", e!.id);

    const { data: logs } = await alice.client
      .from("activity_logs")
      .select("action, entity_type, summary, changes")
      .eq("entity_id", e!.id)
      .order("created_at");
    expect(logs).toEqual([
      { action: "created", entity_type: "event", summary: "Journalisé", changes: [] },
      { action: "updated", entity_type: "event", summary: "Journalisé", changes: ["location"] },
      { action: "deleted", entity_type: "event", summary: "Journalisé", changes: [] },
    ]);
  });
});
