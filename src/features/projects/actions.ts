"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { projectFormSchema, projectStatusSchema, toProjectRow } from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";
const WORKSPACE_NOT_FOUND = "Espace de travail introuvable.";
const PROJECT_NOT_FOUND = "Ce projet n’existe plus ou vous n’y avez pas accès.";
const WRITE_OVERRIDES = {
  // Clé étrangère composite : client absent ou d'un autre espace
  "23503": "Le client sélectionné n’existe plus dans cet espace.",
};

const uuid = z.uuid();

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

async function resolveWorkspace(slug: string) {
  if (typeof slug !== "string" || slug.length > 60) return null;
  return getWorkspaceBySlug(slug);
}

export async function createProjectAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ workspace_id: workspace.id, ...toProjectRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));

  refresh();
  return ok({ id: data.id });
}

export async function updateProjectAction(
  slug: string,
  projectId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(projectId).success) return fail(PROJECT_NOT_FOUND);
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update(toProjectRow(parsed.data))
    .eq("workspace_id", workspace.id)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));
  if (!data) return fail(PROJECT_NOT_FOUND);

  refresh();
  return ok({ id: data.id });
}

/** Changement de statut seul (Kanban, menu de carte). */
export async function updateProjectStatusAction(
  slug: string,
  projectId: string,
  status: unknown,
): Promise<ActionResult> {
  if (!uuid.safeParse(projectId).success) return fail(PROJECT_NOT_FOUND);
  const parsed = projectStatusSchema.safeParse(status);
  if (!parsed.success) return fail("Statut invalide.");

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ status: parsed.data })
    .eq("workspace_id", workspace.id)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(PROJECT_NOT_FOUND);

  refresh();
  return ok();
}

export async function deleteProjectAction(slug: string, projectId: string): Promise<ActionResult> {
  if (!uuid.safeParse(projectId).success) return fail(PROJECT_NOT_FOUND);

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", projectId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(PROJECT_NOT_FOUND);

  refresh();
  return ok();
}
