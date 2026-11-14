"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { clientFormSchema, toClientRow } from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";
const WORKSPACE_NOT_FOUND = "Espace de travail introuvable.";
const CLIENT_NOT_FOUND = "Ce client n’existe plus ou vous n’y avez pas accès.";
const DELETE_OVERRIDES = {
  "23503": "Ce client ne peut pas être supprimé : des devis y sont rattachés (ils doivent être conservés).",
};

const uuid = z.uuid();

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

/** L'espace est résolu via la RLS : un slug inaccessible renvoie null. */
async function resolveWorkspace(slug: string) {
  if (typeof slug !== "string" || slug.length > 60) return null;
  return getWorkspaceBySlug(slug);
}

export async function createClientAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ workspace_id: workspace.id, ...toClientRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error));

  refresh();
  return ok({ id: data.id });
}

export async function updateClientAction(
  slug: string,
  clientId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(clientId).success) return fail(CLIENT_NOT_FOUND);
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(toClientRow(parsed.data))
    .eq("workspace_id", workspace.id)
    .eq("id", clientId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(CLIENT_NOT_FOUND);

  refresh();
  return ok({ id: data.id });
}

export async function deleteClientAction(slug: string, clientId: string): Promise<ActionResult> {
  if (!uuid.safeParse(clientId).success) return fail(CLIENT_NOT_FOUND);

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", clientId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error, DELETE_OVERRIDES));
  if (!data) return fail(CLIENT_NOT_FOUND);

  refresh();
  return ok();
}
