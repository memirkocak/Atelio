import "server-only";

import type { ActivityEntityType } from "@/features/activity/queries";
import { createClient } from "@/lib/supabase/server";

import { dashboardStatsSchema, type DashboardStats } from "./schemas";
import type { RecentActivityItem } from "./types";

export const RECENT_ACTIVITY_LIMIT = 10;

const ENTITY_TABLES = {
  client: "clients",
  project: "projects",
  task: "tasks",
  quote: "quotes",
  event: "events",
} as const satisfies Record<ActivityEntityType, string>;

const ACTIONS = new Set<RecentActivityItem["action"]>(["created", "updated", "deleted"]);

/** Indicateurs du tableau de bord (un seul appel, calculé et filtré par la base). */
export async function getDashboardStats(workspaceId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats", { p_workspace_id: workspaceId });
  if (error) throw error;
  return dashboardStatsSchema.parse(data);
}

/** Derniers événements de l'espace, avec l'auteur et l'existence actuelle de l'élément. */
export async function getRecentActivity(workspaceId: string): Promise<RecentActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, entity_type, entity_id, action, summary, changes, created_at, actor_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(RECENT_ACTIVITY_LIMIT);
  if (error) throw error;
  const logs = (data ?? []).filter(
    (l): l is typeof l & { entity_type: ActivityEntityType; action: RecentActivityItem["action"] } =>
      l.entity_type in ENTITY_TABLES && ACTIONS.has(l.action as RecentActivityItem["action"]),
  );
  if (logs.length === 0) return [];

  // Éléments encore présents (une requête par type présent dans le flux)
  const existing = new Set<string>();
  const byType = new Map<ActivityEntityType, string[]>();
  for (const l of logs) byType.set(l.entity_type, [...(byType.get(l.entity_type) ?? []), l.entity_id]);
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter((id): id is string => !!id))];

  const [profiles] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ...[...byType].map(async ([type, ids]) => {
      const { data: rows, error: e } = await supabase
        .from(ENTITY_TABLES[type])
        .select("id")
        .eq("workspace_id", workspaceId)
        .in("id", [...new Set(ids)]);
      if (e) throw e;
      for (const r of rows ?? []) existing.add(`${type}:${r.id}`);
    }),
  ]);
  const names = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));

  return logs.map((l) => ({
    id: l.id,
    entityType: l.entity_type,
    entityId: l.entity_id,
    action: l.action,
    summary: l.summary,
    changes: l.changes,
    createdAt: l.created_at,
    actorName: l.actor_id ? (names.get(l.actor_id) ?? null) : null,
    exists: existing.has(`${l.entity_type}:${l.entity_id}`),
  }));
}
