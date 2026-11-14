"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { quickAddSchema, taskFormSchema, toTaskRow } from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";
const WORKSPACE_NOT_FOUND = "Espace de travail introuvable.";
const TASK_NOT_FOUND = "Cette tâche n’existe plus ou vous n’y avez pas accès.";
const WRITE_OVERRIDES = {
  // Clé étrangère composite : projet absent ou d'un autre espace
  "23503": "Le projet sélectionné n’existe plus dans cet espace.",
};

const uuid = z.uuid();

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

async function resolveWorkspace(slug: string) {
  if (typeof slug !== "string" || slug.length > 60) return null;
  return getWorkspaceBySlug(slug);
}

/** Ajout rapide (titre seul, projet facultatif) : statut « à faire », priorité normale. */
export async function quickAddTaskAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = quickAddSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ workspace_id: workspace.id, title: parsed.data.title, project_id: parsed.data.projectId })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));

  refresh();
  return ok({ id: data.id });
}

export async function createTaskAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ workspace_id: workspace.id, ...toTaskRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));

  refresh();
  return ok({ id: data.id });
}

export async function updateTaskAction(
  slug: string,
  taskId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(taskId).success) return fail(TASK_NOT_FOUND);
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(toTaskRow(parsed.data))
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));
  if (!data) return fail(TASK_NOT_FOUND);

  refresh();
  return ok({ id: data.id });
}

/** Cocher / décocher : « terminée » ou retour à « à faire ». */
export async function setTaskDoneAction(slug: string, taskId: string, done: unknown): Promise<ActionResult> {
  if (!uuid.safeParse(taskId).success) return fail(TASK_NOT_FOUND);
  if (typeof done !== "boolean") return fail(INVALID_FORM);

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: done ? "done" : "todo" })
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(TASK_NOT_FOUND);

  refresh();
  return ok();
}

export async function deleteTaskAction(slug: string, taskId: string): Promise<ActionResult> {
  if (!uuid.safeParse(taskId).success) return fail(TASK_NOT_FOUND);

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", taskId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(TASK_NOT_FOUND);

  refresh();
  return ok();
}
