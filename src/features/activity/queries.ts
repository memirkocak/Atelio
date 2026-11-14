import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ActivityEntityType = "client" | "project" | "task" | "quote";

export type ActivityItem = Pick<
  Database["public"]["Tables"]["activity_logs"]["Row"],
  "id" | "action" | "changes" | "created_at" | "actor_id"
> & { actorName: string | null };

/** Historique d'une entité (journal d'activité), du plus récent au plus ancien. */
export async function getEntityActivity(
  workspaceId: string,
  entityType: ActivityEntityType,
  entityId: string,
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, changes, created_at, actor_id")
    .eq("workspace_id", workspaceId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
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
