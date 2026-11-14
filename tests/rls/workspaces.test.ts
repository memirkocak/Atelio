import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  createConfirmedUser,
  deleteTestUsers,
  signedInClient,
  type TypedClient,
} from "../support/supabase-test";

/*
 * Tests de sécurité (Row Level Security) — migration 0001.
 * Deux utilisateurs réels, A (Alice) et B (Bruno), sur le projet Supabase de dev.
 */
const PREFIX = "rls-";
const PERMISSION_DENIED = "42501";

type Ctx = { id: string; workspaceId: string; slug: string; client: TypedClient };
let alice: Ctx;
let bruno: Ctx;

async function setupUser(fullName: string): Promise<Ctx> {
  const user = await createConfirmedUser(PREFIX, fullName);
  const { data, error } = await adminClient()
    .from("workspace_members")
    .select("workspace_id, workspaces(slug)")
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return {
    id: user.id,
    workspaceId: data.workspace_id,
    slug: data.workspaces!.slug,
    client: await signedInClient(user.email),
  };
}

beforeAll(async () => {
  await deleteTestUsers(PREFIX); // restes d'une exécution interrompue
  alice = await setupUser("Alice Martin");
  bruno = await setupUser("Bruno Leroy");
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("création automatique à l'inscription", () => {
  it("crée le profil, l'espace personnel et le rôle propriétaire", async () => {
    const admin = adminClient();
    const { data: profile } = await admin.from("profiles").select("*").eq("id", alice.id).single();
    expect(profile?.full_name).toBe("Alice Martin");

    const { data: ws } = await admin.from("workspaces").select("*").eq("id", alice.workspaceId).single();
    expect(ws?.name).toBe("Espace de Alice");
    expect(ws?.slug).toMatch(/^espace-de-alice-[a-f0-9]{4}$/);
    expect(ws?.created_by).toBe(alice.id);
    expect(ws?.default_vat_rate_bp).toBe(2000);

    const { data: members } = await admin
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", alice.workspaceId);
    expect(members).toEqual([{ user_id: alice.id, role: "owner" }]);
  });

  it("gère un compte sans nom (« Mon espace »)", async () => {
    const anonymous = await createConfirmedUser(PREFIX, "");
    const { data } = await adminClient()
      .from("workspaces")
      .select("name, slug")
      .eq("created_by", anonymous.id)
      .single();
    expect(data?.name).toBe("Mon espace");
    expect(data?.slug).toMatch(/^mon-espace-[a-f0-9]{4}$/);
  });
});

describe("isolation entre espaces", () => {
  it("A ne voit que son propre espace", async () => {
    const { data, error } = await alice.client.from("workspaces").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([{ id: alice.workspaceId }]);
  });

  it("A ne voit pas l'espace de B, ni par identifiant ni par slug", async () => {
    const byId = await alice.client.from("workspaces").select("id").eq("id", bruno.workspaceId);
    const bySlug = await alice.client.from("workspaces").select("id").eq("slug", bruno.slug);
    expect(byId.data).toEqual([]);
    expect(bySlug.data).toEqual([]);
  });

  it("A ne voit pas les membres de l'espace de B", async () => {
    const { data } = await alice.client
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", bruno.workspaceId);
    expect(data).toEqual([]);
  });

  it("A ne peut pas modifier l'espace de B", async () => {
    const { data } = await alice.client
      .from("workspaces")
      .update({ name: "Piraté" })
      .eq("id", bruno.workspaceId)
      .select();
    expect(data ?? []).toEqual([]);

    const { data: check } = await adminClient()
      .from("workspaces")
      .select("name")
      .eq("id", bruno.workspaceId)
      .single();
    expect(check?.name).toBe("Espace de Bruno");
  });

  it("A ne peut pas s'ajouter à l'espace de B", async () => {
    const { error } = await alice.client
      .from("workspace_members")
      .insert({ workspace_id: bruno.workspaceId, user_id: alice.id, role: "owner" });
    expect(error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("droits sur son propre espace", () => {
  it("le propriétaire peut renommer son espace et changer le taux de TVA", async () => {
    const { data, error } = await alice.client
      .from("workspaces")
      .update({ name: "Studio Alice", default_vat_rate_bp: 1000 })
      .eq("id", alice.workspaceId)
      .select("name, default_vat_rate_bp")
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({ name: "Studio Alice", default_vat_rate_bp: 1000 });
  });

  it("les contraintes refusent un taux de TVA invalide", async () => {
    const { error } = await alice.client
      .from("workspaces")
      .update({ default_vat_rate_bp: 20000 })
      .eq("id", alice.workspaceId);
    expect(error?.code).toBe("23514"); // check_violation
  });

  it.each([
    ["slug", { slug: "nouveau-slug" }],
    ["is_demo", { is_demo: true }],
    ["created_by", { created_by: "00000000-0000-0000-0000-000000000000" }],
  ])("le propriétaire ne peut pas modifier la colonne protégée %s", async (_col, patch) => {
    const { error } = await alice.client.from("workspaces").update(patch).eq("id", alice.workspaceId);
    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it("personne ne peut changer son rôle, créer ou supprimer un espace (V1)", async () => {
    const role = await alice.client
      .from("workspace_members")
      .update({ role: "admin" })
      .eq("workspace_id", alice.workspaceId);
    const insert = await alice.client.from("workspaces").insert({ name: "Autre", slug: "autre-espace" });
    const del = await alice.client.from("workspaces").delete().eq("id", alice.workspaceId);
    expect(role.error?.code).toBe(PERMISSION_DENIED);
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(del.error?.code).toBe(PERMISSION_DENIED);
  });
});

describe("profils", () => {
  it("A voit son profil mais pas celui de B (aucun espace commun)", async () => {
    const { data } = await alice.client.from("profiles").select("id");
    expect(data).toEqual([{ id: alice.id }]);
  });

  it("A peut modifier son profil, pas celui de B", async () => {
    const own = await alice.client
      .from("profiles")
      .update({ full_name: "Alice M." })
      .eq("id", alice.id)
      .select("full_name")
      .single();
    expect(own.data?.full_name).toBe("Alice M.");

    const other = await alice.client
      .from("profiles")
      .update({ full_name: "Piraté" })
      .eq("id", bruno.id)
      .select();
    expect(other.data ?? []).toEqual([]);
  });
});

describe("collaboration (préparation V2)", () => {
  it("un simple membre voit l'espace et ses membres mais ne peut pas le modifier", async () => {
    // Ajout de B comme « member » de l'espace de A (par l'administrateur : pas encore d'invitations)
    const { error } = await adminClient()
      .from("workspace_members")
      .insert({ workspace_id: alice.workspaceId, user_id: bruno.id, role: "member" });
    expect(error).toBeNull();

    const spaces = await bruno.client.from("workspaces").select("id").order("created_at");
    expect(spaces.data?.map((w) => w.id).sort()).toEqual([alice.workspaceId, bruno.workspaceId].sort());

    const profiles = await bruno.client.from("profiles").select("id").eq("id", alice.id);
    expect(profiles.data).toEqual([{ id: alice.id }]);

    const update = await bruno.client
      .from("workspaces")
      .update({ name: "Modifié par un membre" })
      .eq("id", alice.workspaceId)
      .select();
    expect(update.data ?? []).toEqual([]);
  });
});

describe("accès sans connexion et fonctions internes", () => {
  it("un visiteur anonyme ne lit aucune table", async () => {
    const anon = anonClient();
    for (const table of ["workspaces", "workspace_members", "profiles"] as const) {
      const { data, error } = await anon.from(table).select("*");
      expect(error?.code ?? "no-error").toBe(PERMISSION_DENIED);
      expect(data ?? []).toEqual([]);
    }
  });

  it("les fonctions du schéma private ne sont pas appelables par l'API", async () => {
    // Fonctions absentes des types générés (schéma non exposé) : appel non typé volontaire.
    const client = alice.client as unknown as {
      rpc: (fn: string, args: object) => PromiseLike<{ data: unknown; error: unknown }>;
    };
    const { data, error } = await client.rpc("is_workspace_member", { ws: bruno.workspaceId });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
