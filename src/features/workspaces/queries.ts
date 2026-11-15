import "server-only";

import { cache } from "react";

import { DEFAULT_WORKSPACE_SEGMENT, workspaceHref } from "@/components/layout/navigation";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  /** Espace de démonstration (session anonyme, supprimé après 24 h). */
  is_demo: boolean;
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
    .select("id, name, slug, is_demo")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

const SETTINGS_COLUMNS =
  "id, name, slug, company_name, address_line, postal_code, city, country, email, phone, siret, vat_number, vat_exempt, default_vat_rate_bp, quote_validity_days, quote_terms, quote_footer";

/** Paramètres complets de l'espace (émetteur des devis, préférences). */
export async function getWorkspaceSettings(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workspaces").select(SETTINGS_COLUMNS).eq("id", workspaceId).single();
  if (error) throw error;
  return data;
}

/** Rôle de l'utilisateur courant dans l'espace (null s'il n'est pas membre). */
export async function getMyRole(workspaceId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

/**
 * Chemin d'accueil d'un utilisateur : le tableau de bord de son espace par défaut.
 * null si aucun espace (anomalie) : l'appelant doit fermer la session (voir /demarrage).
 */
export async function getHomePath(userId: string, client?: ServerClient): Promise<string | null> {
  const workspace = await getDefaultWorkspace(userId, client);
  if (!workspace) {
    console.error("[workspaces] aucun espace pour l'utilisateur", userId);
    return null;
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
    .select("role, created_at, workspaces(id, name, slug, is_demo)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const memberships = data ?? [];
  const preferred = memberships.find((m) => m.role === "owner") ?? memberships[0];
  return preferred?.workspaces ?? null;
}
