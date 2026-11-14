import "server-only";

import { containsPattern } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

import { PROJECTS_KANBAN_LIMIT, PROJECTS_PAGE_SIZE } from "./constants";
import type { ProjectListParams } from "./schemas";

import type { ClientRef, ProjectListItem, ProjectRow } from "./types";

export { clientLabel, type ProjectListItem, type ProjectRow } from "./types";

// Relation via la clé étrangère composite (client du même espace)
const LIST_COLUMNS =
  "id, name, status, budget_cents, start_date, due_date, progress, client_id, created_at, client:clients!projects_client_same_workspace(id, kind, contact_name, company_name)";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Construit (sans l'exécuter) la requête filtrée et triée de la liste des projets. */
function buildListQuery(supabase: ServerClient, workspaceId: string, params: ProjectListParams) {
  let query = supabase
    .from("projects")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("workspace_id", workspaceId);
  if (params.q) query = query.ilike("search_text", containsPattern(params.q));
  if (params.status) query = query.eq("status", params.status);
  if (params.client) query = query.eq("client_id", params.client);

  switch (params.sort) {
    case "name":
      return query.order("name", { ascending: true }).order("id");
    case "recent":
      return query.order("created_at", { ascending: false }).order("id");
    default:
      return query
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
  }
}

/** Vue tableau : liste paginée. */
export async function listProjects(workspaceId: string, params: ProjectListParams) {
  const from = (params.page - 1) * PROJECTS_PAGE_SIZE;
  const supabase = await createClient();
  const { data, count, error } = await buildListQuery(supabase, workspaceId, params).range(
    from,
    from + PROJECTS_PAGE_SIZE - 1,
  );
  if (error) throw error;
  const total = count ?? 0;
  return {
    projects: (data ?? []) as unknown as ProjectListItem[],
    total,
    pageCount: Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE)),
  };
}

/** Vue Kanban : tous les projets filtrés (plafonnés), répartis ensuite par statut. */
export async function listProjectsForBoard(workspaceId: string, params: ProjectListParams) {
  const supabase = await createClient();
  // Le statut n'est pas filtré : il détermine la colonne.
  const { data, error } = await buildListQuery(supabase, workspaceId, { ...params, status: undefined }).limit(
    PROJECTS_KANBAN_LIMIT,
  );
  if (error) throw error;
  return (data ?? []) as unknown as ProjectListItem[];
}

export async function countProjects(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return count ?? 0;
}

export async function getProject(workspaceId: string, projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`*, client:clients!projects_client_same_workspace(id, kind, contact_name, company_name)`)
    .eq("workspace_id", workspaceId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data as (ProjectRow & { client: ClientRef | null }) | null;
}

/** Projets d'un client (fiche client). */
export async function listProjectsForClient(workspaceId: string, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, due_date, progress")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
