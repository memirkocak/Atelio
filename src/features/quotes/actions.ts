"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { QUOTE_STATUSES, type QuoteStatus } from "./constants";
import { quoteFormSchema, toSaveQuotePayload } from "./schemas";

const QUOTE_NOT_FOUND = "Ce devis n’existe plus ou vous n’y avez pas accès.";
const ERRORS: Record<string, string> = {
  AT001: "Ce devis n’est plus modifiable : dupliquez-le pour en créer une nouvelle version.",
  AT002: QUOTE_NOT_FOUND,
  AT003: "Ce changement de statut n’est pas possible.",
  AT004: "Un devis doit contenir entre 1 et 100 lignes.",
  "22P02": "Certaines valeurs sont invalides. Vérifiez les lignes du devis.",
  "23503": "Le client ou le projet sélectionné n’existe plus dans cet espace.",
};

const uuid = z.uuid();

async function resolveWorkspace(slug: string) {
  if (typeof slug !== "string" || slug.length > 60) return null;
  return getWorkspaceBySlug(slug);
}

/** Création (quoteId null) ou modification d'un brouillon via public.save_quote. */
export async function saveQuoteAction(
  slug: string,
  quoteId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (quoteId !== null && !uuid.safeParse(quoteId).success) return fail(QUOTE_NOT_FOUND);
  const parsed = quoteFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Certains champs sont invalides.", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
  }

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail("Espace de travail introuvable.");

  const { quote, items } = toSaveQuotePayload(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_quote", {
    p_workspace_id: workspace.id,
    p_quote_id: quoteId as string,
    p_quote: quote,
    p_items: items,
  });
  if (error) return fail(dbErrorMessage(error, ERRORS));

  refresh();
  return ok({ id: data });
}

export async function setQuoteStatusAction(slug: string, quoteId: string, status: unknown): Promise<ActionResult> {
  if (!uuid.safeParse(quoteId).success) return fail(QUOTE_NOT_FOUND);
  if (!QUOTE_STATUSES.includes(status as QuoteStatus)) return fail("Statut invalide.");

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail("Espace de travail introuvable.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_quote_status", {
    p_workspace_id: workspace.id,
    p_quote_id: quoteId,
    p_status: status as QuoteStatus,
  });
  if (error) return fail(dbErrorMessage(error, ERRORS));

  refresh();
  return ok();
}

export async function duplicateQuoteAction(slug: string, quoteId: string): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(quoteId).success) return fail(QUOTE_NOT_FOUND);
  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail("Espace de travail introuvable.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_quote", { p_workspace_id: workspace.id, p_quote_id: quoteId });
  if (error) return fail(dbErrorMessage(error, ERRORS));

  refresh();
  return ok({ id: data });
}

/** Suppression : brouillons uniquement (politique RLS). */
export async function deleteQuoteAction(slug: string, quoteId: string): Promise<ActionResult> {
  if (!uuid.safeParse(quoteId).success) return fail(QUOTE_NOT_FOUND);
  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail("Espace de travail introuvable.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", quoteId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail("Seul un devis en brouillon peut être supprimé.");

  refresh();
  return ok();
}
