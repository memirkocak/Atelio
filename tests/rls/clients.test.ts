import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de sécurité — migration 0002 (clients, activity_logs).
 */
const PREFIX = "rls-clients-";
const PERMISSION_DENIED = "42501";
const RLS_VIOLATION = "42501"; // « new row violates row-level security policy »

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let brunoClientId: string;

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const { data, error } = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "company", contact_name: "Paul Secret", company_name: "Secret SARL" })
    .select("id")
    .single();
  if (error) throw error;
  brunoClientId = data.id;
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("clients : droits du membre sur son espace", () => {
  let clientId: string;

  it("crée un client ; created_by et la recherche normalisée sont calculés par la base", async () => {
    const { data, error } = await alice.client
      .from("clients")
      .insert({
        workspace_id: alice.workspaceId,
        kind: "company",
        contact_name: "Élodie Lefèvre",
        company_name: "Studio Écume",
        email: "elodie@ecume.fr",
        city: "Nîmes",
      })
      .select("*")
      .single();
    expect(error).toBeNull();
    expect(data?.created_by).toBe(alice.id);
    expect(data?.country).toBe("France");
    expect(data?.search_text).toBe("elodie lefevre studio ecume elodie@ecume.fr nimes");
    clientId = data!.id;
  });

  it("lit, modifie et supprime son client", async () => {
    const read = await alice.client.from("clients").select("id").eq("id", clientId);
    expect(read.data).toEqual([{ id: clientId }]);

    const upd = await alice.client
      .from("clients")
      .update({ phone: "0601020304" })
      .eq("id", clientId)
      .select("phone")
      .single();
    expect(upd.data?.phone).toBe("0601020304");

    const del = await alice.client.from("clients").delete().eq("id", clientId).select("id");
    expect(del.data).toEqual([{ id: clientId }]);
  });

  it("les contraintes refusent une entreprise sans nom et un e-mail invalide", async () => {
    const noCompany = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "company", contact_name: "Sans Société" });
    const badEmail = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "X", email: "pas-un-email" });
    expect(noCompany.error?.code).toBe("23514");
    expect(badEmail.error?.code).toBe("23514");
  });

  it("ne peut ni choisir created_by ni déplacer un client vers un autre espace", async () => {
    // Les types générés ignorent les droits par colonne : created_by est refusé par la base.
    const forgedAuthor = await alice.client.from("clients").insert({
      workspace_id: alice.workspaceId,
      kind: "individual",
      contact_name: "Faux auteur",
      created_by: bruno.id,
    });
    expect(forgedAuthor.error?.code).toBe(PERMISSION_DENIED);

    const { data } = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "À déplacer" })
      .select("id")
      .single();
    const move = await alice.client
      .from("clients")
      .update({ workspace_id: bruno.workspaceId }) // colonne non autorisée en écriture
      .eq("id", data!.id);
    expect(move.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("clients : administration (clé secrète)", () => {
  it("le rôle d'administration peut créer un client (colonne de recherche calculée)", async () => {
    // Régression migration 0003 : service_role doit pouvoir exécuter private.normalize_search.
    const { data, error } = await adminClient()
      .from("clients")
      .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Créé par l'admin" })
      .select("search_text, created_by")
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({ search_text: "cree par l'admin", created_by: null });
  });
});

describe("clients : isolation entre espaces", () => {
  it("A ne voit pas les clients de B", async () => {
    const all = await alice.client.from("clients").select("id").eq("workspace_id", bruno.workspaceId);
    const byId = await alice.client.from("clients").select("id").eq("id", brunoClientId);
    expect(all.data).toEqual([]);
    expect(byId.data).toEqual([]);
  });

  it("A ne peut pas créer un client dans l'espace de B", async () => {
    const { error } = await alice.client
      .from("clients")
      .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Intrus" });
    expect(error?.code).toBe(RLS_VIOLATION);
  });

  it("A ne peut ni modifier ni supprimer un client de B", async () => {
    const upd = await alice.client
      .from("clients")
      .update({ notes: "piraté" })
      .eq("id", brunoClientId)
      .select("id");
    const del = await alice.client.from("clients").delete().eq("id", brunoClientId).select("id");
    expect(upd.data ?? []).toEqual([]);
    expect(del.data ?? []).toEqual([]);

    const { data } = await adminClient().from("clients").select("notes").eq("id", brunoClientId).single();
    expect(data?.notes).toBeNull();
  });

  it("un visiteur anonyme n'a aucun accès", async () => {
    const anon = anonClient();
    const read = await anon.from("clients").select("id");
    const insert = await anon
      .from("clients")
      .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Anonyme" });
    const logs = await anon.from("activity_logs").select("id");
    expect(read.error?.code).toBe(PERMISSION_DENIED);
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(logs.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("journal d'activité", () => {
  it("enregistre création, modification (champs modifiés) et suppression", async () => {
    const { data: created } = await alice.client
      .from("clients")
      .insert({ workspace_id: alice.workspaceId, kind: "individual", contact_name: "Journal Test" })
      .select("id")
      .single();
    const id = created!.id;
    await alice.client.from("clients").update({ city: "Lyon", phone: "0102030405" }).eq("id", id);
    await alice.client.from("clients").update({ city: "Lyon" }).eq("id", id); // sans changement réel
    await alice.client.from("clients").delete().eq("id", id);

    const { data: logs } = await alice.client
      .from("activity_logs")
      .select("action, summary, changes, actor_id, entity_type")
      .eq("entity_id", id)
      .order("created_at");
    expect(logs).toEqual([
      { action: "created", summary: "Journal Test", changes: [], actor_id: alice.id, entity_type: "client" },
      { action: "updated", summary: "Journal Test", changes: ["city", "phone"], actor_id: alice.id, entity_type: "client" },
      { action: "deleted", summary: "Journal Test", changes: [], actor_id: alice.id, entity_type: "client" },
    ]);
  });

  it("le libellé d'une entreprise est son nom d'entreprise", async () => {
    const { data } = await alice.client
      .from("activity_logs")
      .select("summary")
      .eq("action", "created")
      .ilike("summary", "Studio%");
    expect(data?.[0]?.summary).toBe("Studio Écume");
  });

  it("le journal est en lecture seule et cloisonné par espace", async () => {
    const insert = await alice.client.from("activity_logs").insert({
      workspace_id: alice.workspaceId,
      entity_type: "client",
      entity_id: alice.id,
      action: "created",
      summary: "Faux",
    });
    const update = await alice.client.from("activity_logs").update({ summary: "Falsifié" }).eq("workspace_id", alice.workspaceId);
    const del = await alice.client.from("activity_logs").delete().eq("workspace_id", alice.workspaceId);
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(del.error?.code).toBe(PERMISSION_DENIED);

    const foreign = await alice.client.from("activity_logs").select("id").eq("workspace_id", bruno.workspaceId);
    expect(foreign.data).toEqual([]);
  });

  it("la suppression d'un espace supprime ses clients et son journal sans erreur", async () => {
    const temp = await setupWorkspaceUser(PREFIX, "Temp Test");
    await temp.client
      .from("clients")
      .insert({ workspace_id: temp.workspaceId, kind: "individual", contact_name: "Éphémère" });

    const admin = adminClient();
    const { error } = await admin.from("workspaces").delete().eq("id", temp.workspaceId);
    expect(error).toBeNull();
    const { count } = await admin
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", temp.workspaceId);
    expect(count).toBe(0);
  });
});
