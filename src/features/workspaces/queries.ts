import "server-only";

import { cache } from "react";

import { DEFAULT_WORKSPACE_SEGMENT, workspaceHref } from "@/components/layout/navigation";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Espace correspondant au slug, uniquement si l'utilisateur en est membre
 * (la RLS filtre les autres : null = inexistant OU inaccessible, indiscernables).
 * Mis en cache pour la durée de la requête (garde + sidebar).
 */
export const getWorkspaceBySlug = cache(async (slug: string): Promise<WorkspaceSummary | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

/** Chemin d'accueil d'un utilisateur : le tableau de bord de son espace par défaut. */
export async function getHomePath(userId: string, client?: ServerClient): Promise<string> {
  const workspace = await getDefaultWorkspace(userId, client);
  if (!workspace) {
    // Ne devrait pas arriver : l'espace est créé par trigger à l'inscription.
    console.error("[workspaces] aucun espace pour l'utilisateur", userId);
    return "/connexion?erreur=aucun-espace";
  }
  return workspaceHref(workspace.slug, DEFAULT_WORKSPACE_SEGMENT);
}

/** Espace d'arrivée après connexion : le plus ancien espace dont l'utilisateur est propriétaire, sinon membre. */
export async function getDefaultWorkspace(
  userId: string,
  client?: ServerClient,
): Promise<WorkspaceSummary | null> {
  // Le client de l'action en cours peut être réutilisé (session fraîchement ouverte).
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, created_at, workspaces(id, name, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const memberships = data ?? [];
  const preferred = memberships.find((m) => m.role === "owner") ?? memberships[0];
  return preferred?.workspaces ?? null;
}
