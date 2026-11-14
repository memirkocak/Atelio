import "server-only";

import { todayIso } from "@/lib/dates";
import { containsPattern } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

import { NO_PROJECT, TASKS_PAGE_SIZE } from "./constants";
import { includesDone, type TaskListParams } from "./schemas";
import { dueRange } from "./status";
import type { ProjectOption, TaskListItem } from "./types";

export type { ProjectOption, TaskListItem } from "./types";

// Relation via la clé étrangère composite (projet du même espace)
const LIST_COLUMNS =
  "id, title, description, status, priority, due_date, project_id, completed_at, created_at, project:projects!tasks_project_same_workspace(id, name)";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Tri : non terminées d'abord par échéance (sans échéance à la fin), puis priorité
 * décroissante (ordre de l'enum : low < medium < high < urgent), puis les plus récentes.
 */
function buildListQuery(supabase: ServerClient, workspaceId: string, params: TaskListParams) {
  let query = supabase
    .from("tasks")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("workspace_id", workspaceId);

  if (params.q) query = query.ilike("search_text", containsPattern(params.q));
  if (params.status) query = query.eq("status", params.status);
  else if (!includesDone(params)) query = query.neq("status", "done");
  if (params.priority) query = query.eq("priority", params.priority);
  if (params.project === NO_PROJECT) query = query.is("project_id", null);
  else if (params.project) query = query.eq("project_id", params.project);

  if (params.due) {
    const range = dueRange(params.due, todayIso());
    if (range.kind === "none") query = query.is("due_date", null);
    else if (range.kind === "before") query = query.lt("due_date", range.date).neq("status", "done");
    else query = query.gte("due_date", range.from).lte("due_date", range.to);
  }

  return query
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function listTasks(workspaceId: string, params: TaskListParams) {
  const supabase = await createClient();
  const from = (params.page - 1) * TASKS_PAGE_SIZE;
  const { data, count, error } = await buildListQuery(supabase, workspaceId, params).range(
    from,
    from + TASKS_PAGE_SIZE - 1,
  );
  if (error) throw error;
  const total = count ?? 0;
  return {
    tasks: (data ?? []) as unknown as TaskListItem[],
    total,
    pageCount: Math.max(1, Math.ceil(total / TASKS_PAGE_SIZE)),
  };
}

/** Compteurs de l'espace : total, non terminées, en retard. */
export async function getTaskCounts(workspaceId: string) {
  const supabase = await createClient();
  const today = todayIso();
  const [all, open, overdue] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("status", "done")
      .lt("due_date", today),
  ]);
  for (const r of [all, open, overdue]) if (r.error) throw r.error;
  return { total: all.count ?? 0, open: open.count ?? 0, overdue: overdue.count ?? 0 };
}

/** Projets de l'espace pour une liste de choix (tâches). */
export async function listProjectOptions(workspaceId: string): Promise<ProjectOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .order("name")
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, label: p.name }));
}

/** Tâches d'un projet (fiche projet) : non terminées d'abord. */
export async function listTasksForProject(workspaceId: string, projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(LIST_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as TaskListItem[];
}
