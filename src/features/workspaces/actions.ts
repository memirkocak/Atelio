"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";

import { getWorkspaceBySlug } from "./queries";
import { toSettingsRow, workspaceSettingsSchema } from "./settings-schema";

/** Met à jour les paramètres de l'espace (owner / admin : contrôlé par la RLS). */
export async function updateWorkspaceSettingsAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = workspaceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Certains champs sont invalides.", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
  }

  const workspace = typeof slug === "string" && slug.length <= 60 ? await getWorkspaceBySlug(slug) : null;
  if (!workspace) return fail("Espace de travail introuvable.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update(toSettingsRow(parsed.data))
    .eq("id", workspace.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail("Seuls le propriétaire et les administrateurs peuvent modifier ces paramètres.");

  refresh();
  return ok({ id: data.id });
}
