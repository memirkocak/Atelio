import "server-only";

import { todayIso } from "@/lib/dates";
import { containsPattern } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

import { QUOTES_PAGE_SIZE } from "./constants";
import type { QuoteListParams } from "./schemas";
import type { QuoteItemRow, QuoteListItem, QuoteRow } from "./types";

export type { QuoteListItem } from "./types";

const CLIENT_REF = "client:clients!quotes_client_same_workspace(id, kind, contact_name, company_name)";
const LIST_COLUMNS = `id, number, title, status, issue_date, valid_until, total_cents, subtotal_cents, ${CLIENT_REF}`;

export async function listQuotes(workspaceId: string, params: QuoteListParams) {
  const supabase = await createClient();
  const today = todayIso();
  const from = (params.page - 1) * QUOTES_PAGE_SIZE;

  let query = supabase.from("quotes").select(LIST_COLUMNS, { count: "exact" }).eq("workspace_id", workspaceId);
  if (params.q) query = query.ilike("search_text", containsPattern(params.q));
  if (params.client) query = query.eq("client_id", params.client);
  // « Expiré » est dérivé : envoyé et validité dépassée
  if (params.status === "expired") query = query.eq("status", "sent").lt("valid_until", today);
  else if (params.status === "sent") query = query.eq("status", "sent").gte("valid_until", today);
  else if (params.status) query = query.eq("status", params.status);

  const { data, count, error } = await query
    .order("issue_date", { ascending: false })
    .order("number", { ascending: false })
    .range(from, from + QUOTES_PAGE_SIZE - 1);
  if (error) throw error;
  const total = count ?? 0;
  return {
    quotes: (data ?? []) as unknown as QuoteListItem[],
    total,
    pageCount: Math.max(1, Math.ceil(total / QUOTES_PAGE_SIZE)),
  };
}

export async function countQuotes(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return count ?? 0;
}

export type QuoteDetail = QuoteRow & {
  client: {
    id: string;
    kind: "company" | "individual";
    contact_name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address_line: string | null;
    postal_code: string | null;
    city: string | null;
    country: string;
  };
  project: { id: string; name: string } | null;
  items: QuoteItemRow[];
};

/** Devis complet (client actuel, projet, lignes ordonnées). */
export async function getQuote(workspaceId: string, quoteId: string): Promise<QuoteDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `*, client:clients!quotes_client_same_workspace(id, kind, contact_name, company_name, email, phone, address_line, postal_code, city, country), project:projects!quotes_project_same_workspace(id, name), items:quote_items(*)`,
    )
    .eq("workspace_id", workspaceId)
    .eq("id", quoteId)
    .order("position", { referencedTable: "quote_items", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as QuoteDetail | null;
}

/** Devis d'un client (fiche client). */
export async function listQuotesForClient(workspaceId: string, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, number, title, status, issue_date, valid_until, total_cents")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .order("issue_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
