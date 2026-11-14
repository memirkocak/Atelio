import "server-only";

import { containsPattern } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { CLIENTS_PAGE_SIZE } from "./constants";
import type { ClientListParams } from "./schemas";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ClientListItem = Pick<
  ClientRow,
  "id" | "kind" | "contact_name" | "company_name" | "email" | "phone" | "city" | "created_at"
>;
export type ActivityItem = Pick<
  Database["public"]["Tables"]["activity_logs"]["Row"],
  "id" | "action" | "changes" | "created_at" | "actor_id"
> & { actorName: string | null };

/**
 * Liste paginée des clients d'un espace (filtrée par la RLS ET par workspace_id).
 * Recherche insensible à la casse et aux accents sur la colonne générée `search_text`.
 */
export async function listClients(workspaceId: string, params: ClientListParams) {
  const supabase = await createClient();
  const from = (params.page - 1) * CLIENTS_PAGE_SIZE;

  let query = supabase
    .from("clients")
    .select("id, kind, contact_name, company_name, email, phone, city, created_at", { count: "exact" })
    .eq("workspace_id", workspaceId);

  if (params.q) query = query.ilike("search_text", containsPattern(params.q));
  if (params.type) query = query.eq("kind", params.type);

  query =
    params.sort === "name"
      ? query.order("contact_name", { ascending: true }).order("id")
      : query.order("created_at", { ascending: params.sort === "oldest" }).order("id");

  const { data, count, error } = await query.range(from, from + CLIENTS_PAGE_SIZE - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    clients: (data ?? []) as ClientListItem[],
    total,
    pageCount: Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE)),
  };
}

/** Nombre total de clients de l'espace (pour distinguer « aucun client » et « aucun résultat »). */
export async function countClients(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return count ?? 0;
}

export async function getClient(workspaceId: string, clientId: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Historique d'un client (journal d'activité), du plus récent au plus ancien. */
export async function getClientActivity(workspaceId: string, clientId: string): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, changes, created_at, actor_id")
    .eq("workspace_id", workspaceId)
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const actorIds = [...new Set((data ?? []).map((l) => l.actor_id).filter((id): id is string => !!id))];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name);
  }

  return (data ?? []).map((l) => ({ ...l, actorName: l.actor_id ? (names.get(l.actor_id) ?? null) : null }));
}
