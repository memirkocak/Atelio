import { afterAll, beforeAll, describe, expect, it } from "vitest";

import fixtures from "../fixtures/quote-calculations.json";
import {
  adminClient,
  anonClient,
  deleteTestUsers,
  setupWorkspaceUser,
  type WorkspaceUser,
} from "../support/supabase-test";

/*
 * Tests de la migration 0006 (devis) : calculs côté base, numérotation, règles métier, sécurité.
 */
const PREFIX = "rls-quotes-";
const PERMISSION_DENIED = "42501";

let alice: WorkspaceUser;
let bruno: WorkspaceUser;
let aliceClientId: string;
let brunoClientId: string;

const item = (over: Record<string, unknown> = {}) => ({
  label: "Prestation",
  quantity: "1",
  unit_price_cents: 10000,
  vat_rate_bp: 2000,
  ...over,
});

async function save(user: WorkspaceUser, quote: Record<string, unknown>, items: unknown[], quoteId: string | null = null) {
  return user.client.rpc("save_quote", {
    p_workspace_id: user.workspaceId,
    p_quote_id: quoteId as string,
    p_quote: { client_id: aliceClientId, title: "Devis test", ...quote },
    p_items: items as never,
  });
}

beforeAll(async () => {
  await deleteTestUsers(PREFIX);
  [alice, bruno] = await Promise.all([
    setupWorkspaceUser(PREFIX, "Alice Martin"),
    setupWorkspaceUser(PREFIX, "Bruno Leroy"),
  ]);
  const ac = await alice.client
    .from("clients")
    .insert({ workspace_id: alice.workspaceId, kind: "company", company_name: "Client Alice", contact_name: "Paul" })
    .select("id")
    .single();
  const bc = await bruno.client
    .from("clients")
    .insert({ workspace_id: bruno.workspaceId, kind: "individual", contact_name: "Client Bruno" })
    .select("id")
    .single();
  aliceClientId = ac.data!.id;
  brunoClientId = bc.data!.id;
});

afterAll(async () => {
  await deleteTestUsers(PREFIX);
});

describe("calculs côté base — mêmes cas de référence que le calcul TypeScript", () => {
  it.each(fixtures.cases)("$name", async (c) => {
    if (c.vat_exempt) {
      await alice.client.from("workspaces").update({ vat_exempt: true }).eq("id", alice.workspaceId);
    }
    try {
      const { data: id, error } = await save(
        alice,
        {},
        c.items.map((i, n) => ({ label: `Ligne ${n + 1}`, ...i })),
      );
      expect(error).toBeNull();

      const { data: quote } = await alice.client
        .from("quotes")
        .select("subtotal_cents, vat_cents, total_cents, vat_exempt")
        .eq("id", id!)
        .single();
      const { data: lines } = await alice.client
        .from("quote_items")
        .select("line_subtotal_cents, line_vat_cents, vat_rate_bp")
        .eq("quote_id", id!)
        .order("position");

      expect(lines!.map((l) => [l.line_subtotal_cents, l.line_vat_cents])).toEqual(c.expected.lines);
      expect(quote).toMatchObject({
        subtotal_cents: c.expected.subtotal,
        vat_cents: c.expected.vat,
        total_cents: c.expected.total,
        vat_exempt: c.vat_exempt,
      });
      if (c.vat_exempt) expect(lines!.every((l) => l.vat_rate_bp === 0)).toBe(true);
    } finally {
      if (c.vat_exempt) {
        await alice.client.from("workspaces").update({ vat_exempt: false }).eq("id", alice.workspaceId);
      }
    }
  });

  it("ignore les montants envoyés par le navigateur", async () => {
    const { data: id } = await save(alice, { subtotal_cents: 1, total_cents: 1 }, [
      item({ line_subtotal_cents: 1, line_total_cents: 1 }),
    ]);
    const { data } = await alice.client.from("quotes").select("total_cents").eq("id", id!).single();
    expect(data?.total_cents).toBe(12000);
  });
});

describe("numérotation", () => {
  it("attribue des numéros consécutifs et uniques, même en création simultanée", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => save(alice, { issue_date: "2031-03-01" }, [item()])));
    expect(results.every((r) => r.error === null)).toBe(true);

    const { data } = await alice.client
      .from("quotes")
      .select("number")
      .in("id", results.map((r) => r.data!))
      .order("number");
    expect(data!.map((q) => q.number)).toEqual([
      "DEV-2031-0001",
      "DEV-2031-0002",
      "DEV-2031-0003",
      "DEV-2031-0004",
      "DEV-2031-0005",
      "DEV-2031-0006",
    ]);
  });

  it("le compteur est propre à chaque espace", async () => {
    const { data: id } = await bruno.client.rpc("save_quote", {
      p_workspace_id: bruno.workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: brunoClientId, title: "Devis Bruno", issue_date: "2031-05-01" },
      p_items: [item()],
    });
    const { data } = await bruno.client.from("quotes").select("number").eq("id", id!).single();
    expect(data?.number).toBe("DEV-2031-0001");
  });

  it("les compteurs ne sont pas accessibles par l'API", async () => {
    const { data } = await alice.client.from("quote_counters").select("*");
    expect(data ?? []).toEqual([]);
  });
});

describe("cycle de vie", () => {
  let quoteId: string;

  it("brouillon modifiable, validité par défaut de 30 jours", async () => {
    const { data: id } = await save(alice, { issue_date: "2026-11-01" }, [item()]);
    quoteId = id!;
    const { error } = await save(alice, { issue_date: "2026-11-01", title: "Devis modifié" }, [item(), item()], quoteId);
    expect(error).toBeNull();

    const { data } = await alice.client.from("quotes").select("title, valid_until, total_cents").eq("id", quoteId).single();
    expect(data).toEqual({ title: "Devis modifié", valid_until: "2026-12-01", total_cents: 24000 });
    const { count } = await alice.client
      .from("quote_items")
      .select("*", { count: "exact", head: true })
      .eq("quote_id", quoteId);
    expect(count).toBe(2);
  });

  it("l'envoi fige les coordonnées du client et de l'émetteur", async () => {
    await alice.client
      .from("workspaces")
      .update({ company_name: "Studio Alice", siret: "12345678901234" })
      .eq("id", alice.workspaceId);
    expect((await alice.client.rpc("set_quote_status", { p_workspace_id: alice.workspaceId, p_quote_id: quoteId, p_status: "sent" })).error).toBeNull();

    // Le client change ensuite d'adresse : l'instantané ne bouge pas.
    await alice.client.from("clients").update({ city: "Lyon" }).eq("id", aliceClientId);
    const { data } = await alice.client
      .from("quotes")
      .select("status, sent_at, client_snapshot, issuer_snapshot")
      .eq("id", quoteId)
      .single();
    expect(data?.status).toBe("sent");
    expect(data?.sent_at).not.toBeNull();
    expect(data?.client_snapshot).toMatchObject({ company_name: "Client Alice", city: null });
    expect(data?.issuer_snapshot).toMatchObject({ company_name: "Studio Alice", siret: "12345678901234" });
  });

  it("un devis envoyé n'est plus modifiable ni supprimable", async () => {
    const edit = await save(alice, {}, [item()], quoteId);
    expect(edit.error?.code).toBe("AT001");

    const del = await alice.client.from("quotes").delete().eq("id", quoteId).select("id");
    expect(del.data ?? []).toEqual([]);
    const { count } = await alice.client.from("quotes").select("*", { count: "exact", head: true }).eq("id", quoteId);
    expect(count).toBe(1);
  });

  it("transitions : envoyé → accepté ; aucun retour arrière", async () => {
    const accept = await alice.client.rpc("set_quote_status", {
      p_workspace_id: alice.workspaceId,
      p_quote_id: quoteId,
      p_status: "accepted",
    });
    expect(accept.error).toBeNull();
    const back = await alice.client.rpc("set_quote_status", {
      p_workspace_id: alice.workspaceId,
      p_quote_id: quoteId,
      p_status: "sent",
    });
    expect(back.error?.code).toBe("AT003");
  });

  it("dupliquer crée un brouillon avec un nouveau numéro et les mêmes lignes", async () => {
    const { data: copyId, error } = await alice.client.rpc("duplicate_quote", {
      p_workspace_id: alice.workspaceId,
      p_quote_id: quoteId,
    });
    expect(error).toBeNull();
    const [{ data: source }, { data: copy }] = await Promise.all([
      alice.client.from("quotes").select("number, total_cents").eq("id", quoteId).single(),
      alice.client.from("quotes").select("number, status, total_cents, client_snapshot").eq("id", copyId!).single(),
    ]);
    expect(copy).toMatchObject({ status: "draft", total_cents: source!.total_cents, client_snapshot: null });
    expect(copy!.number).not.toBe(source!.number);
  });

  it("un brouillon peut être supprimé (avec ses lignes)", async () => {
    const { data: id } = await save(alice, {}, [item()]);
    const del = await alice.client.from("quotes").delete().eq("id", id!).select("id");
    expect(del.data).toEqual([{ id }]);
    const { count } = await adminClient().from("quote_items").select("*", { count: "exact", head: true }).eq("quote_id", id!);
    expect(count).toBe(0);
  });

  it("un client ayant des devis ne peut pas être supprimé", async () => {
    const { error } = await alice.client.from("clients").delete().eq("id", aliceClientId);
    expect(error?.code).toBe("23503");
  });
});

describe("validation et sécurité", () => {
  it.each([
    ["aucune ligne", []],
    ["quantité nulle", [item({ quantity: "0" })]],
    ["prix négatif", [item({ unit_price_cents: -100 })]],
    ["taux de TVA hors limites", [item({ vat_rate_bp: 12000 })]],
    ["désignation vide", [item({ label: "  " })]],
  ])("refuse : %s", async (_label, items) => {
    const { error } = await save(alice, {}, items);
    expect(error).not.toBeNull();
  });

  it("refuse une date de validité antérieure à l'émission", async () => {
    const { error } = await save(alice, { issue_date: "2026-11-10", valid_until: "2026-11-01" }, [item()]);
    expect(error?.code).toBe("23514");
  });

  it("refuse le client d'un autre espace", async () => {
    const { error } = await save(alice, { client_id: brunoClientId }, [item()]);
    expect(error?.code).toBe("23503");
  });

  it("A ne peut ni créer, ni lire, ni modifier, ni changer le statut des devis de B", async () => {
    const { data: brunoQuoteId } = await bruno.client.rpc("save_quote", {
      p_workspace_id: bruno.workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: brunoClientId, title: "Devis secret" },
      p_items: [item()],
    });

    const create = await alice.client.rpc("save_quote", {
      p_workspace_id: bruno.workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: brunoClientId, title: "Intrus" },
      p_items: [item()],
    });
    expect(create.error?.code).toBe(PERMISSION_DENIED);

    // Avec son propre espace mais l'identifiant du devis de B : introuvable
    const edit = await save(alice, {}, [item()], brunoQuoteId!);
    expect(edit.error?.code).toBe("AT002");
    const status = await alice.client.rpc("set_quote_status", {
      p_workspace_id: alice.workspaceId,
      p_quote_id: brunoQuoteId!,
      p_status: "sent",
    });
    expect(status.error?.code).toBe("AT002");
    const dup = await alice.client.rpc("duplicate_quote", { p_workspace_id: alice.workspaceId, p_quote_id: brunoQuoteId! });
    expect(dup.error?.code).toBe("AT002");

    const read = await alice.client.from("quotes").select("id").eq("id", brunoQuoteId!);
    const items = await alice.client.from("quote_items").select("id").eq("quote_id", brunoQuoteId!);
    const del = await alice.client.from("quotes").delete().eq("id", brunoQuoteId!).select("id");
    expect(read.data).toEqual([]);
    expect(items.data).toEqual([]);
    expect(del.data ?? []).toEqual([]);
  });

  it("aucune écriture directe dans les tables (tout passe par les fonctions)", async () => {
    const insert = await alice.client.from("quotes").insert({
      workspace_id: alice.workspaceId,
      number: "DEV-2026-9999",
      client_id: aliceClientId,
      title: "Direct",
      valid_until: "2027-01-01",
    });
    const { data: q } = await alice.client.from("quotes").select("id").eq("status", "draft").limit(1).single();
    const update = await alice.client.from("quotes").update({ total_cents: 1, subtotal_cents: 1 }).eq("id", q!.id);
    const itemInsert = await alice.client.from("quote_items").insert({
      quote_id: q!.id,
      workspace_id: alice.workspaceId,
      position: 99,
      label: "x",
      quantity: 1,
      unit_price_cents: 1,
      vat_rate_bp: 0,
      line_subtotal_cents: 1,
      line_vat_cents: 0,
      line_total_cents: 1,
    });
    expect(insert.error?.code).toBe(PERMISSION_DENIED);
    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(itemInsert.error?.code).toBe(PERMISSION_DENIED);
  });

  it("un visiteur anonyme n'a aucun accès (tables et fonctions)", async () => {
    const anon = anonClient();
    const read = await anon.from("quotes").select("id");
    const rpc = await anon.rpc("save_quote", {
      p_workspace_id: alice.workspaceId,
      p_quote_id: null as unknown as string,
      p_quote: { client_id: aliceClientId, title: "Anonyme" },
      p_items: [item()],
    });
    expect(read.error?.code).toBe(PERMISSION_DENIED);
    expect(rpc.error).not.toBeNull();
  });

  it("le journal enregistre les devis par leur numéro", async () => {
    const { data: id } = await save(alice, {}, [item()]);
    const { data: q } = await alice.client.from("quotes").select("number").eq("id", id!).single();
    const { data: logs } = await alice.client
      .from("activity_logs")
      .select("entity_type, action, summary")
      .eq("entity_id", id!);
    expect(logs).toEqual([{ entity_type: "quote", action: "created", summary: q!.number }]);
  });
});
