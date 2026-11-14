import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
};

/**
 * Utilisateur connecté, d'après le JWT vérifié par getClaims() (jamais getSession()).
 * Lit les cookies : à appeler dans une frontière <Suspense> (cacheComponents).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // createClient() appelle connection() : la session est évaluée au moment de la requête.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : null;

  return { id: claims.sub, email: claims.email ?? "", fullName };
}

/** Comme getCurrentUser, mais redirige vers /connexion si personne n'est connecté. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
