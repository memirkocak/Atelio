"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";

import { eventFormSchema, toEventRow } from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";
const WORKSPACE_NOT_FOUND = "Espace de travail introuvable.";
const EVENT_NOT_FOUND = "Ce rendez-vous n’existe plus ou vous n’y avez pas accès.";
const WRITE_OVERRIDES = {
  // Clés étrangères composites : client / projet absent ou d'un autre espace
  "23503": "Le client ou le projet sélectionné n’existe plus dans cet espace.",
};

const uuid = z.uuid();

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

async function resolveWorkspace(slug: string) {
  if (typeof slug !== "string" || slug.length > 60) return null;
  return getWorkspaceBySlug(slug);
}

export async function createEventAction(slug: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ workspace_id: workspace.id, ...toEventRow(parsed.data) })
    .select("id")
    .single();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));

  refresh();
  return ok({ id: data.id });
}

export async function updateEventAction(
  slug: string,
  eventId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(eventId).success) return fail(EVENT_NOT_FOUND);
  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update(toEventRow(parsed.data))
    .eq("workspace_id", workspace.id)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error, WRITE_OVERRIDES));
  if (!data) return fail(EVENT_NOT_FOUND);

  refresh();
  return ok({ id: data.id });
}

export async function deleteEventAction(slug: string, eventId: string): Promise<ActionResult> {
  if (!uuid.safeParse(eventId).success) return fail(EVENT_NOT_FOUND);

  const workspace = await resolveWorkspace(slug);
  if (!workspace) return fail(WORKSPACE_NOT_FOUND);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error));
  if (!data) return fail(EVENT_NOT_FOUND);

  refresh();
  return ok();
}
