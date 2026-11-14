import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env";

export type PasswordCheck = "ok" | "invalid" | "rate_limited" | "error";

/**
 * Vérifie le mot de passe de l'utilisateur connecté (opérations sensibles : changement de
 * mot de passe, suppression du compte). Utilise un client ISOLÉ, sans cookie ni stockage,
 * pour ne jamais toucher à la session en cours ; la session ouverte par la vérification
 * est aussitôt révoquée (portée « local » : uniquement celle-ci).
 */
export async function verifyPassword(email: string, password: string): Promise<PasswordCheck> {
  const { url, publishableKey } = getSupabasePublicEnv();
  const isolated = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await isolated.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return "rate_limited";
    return error.code === "invalid_credentials" ? "invalid" : "error";
  }
  if (data.session) await isolated.auth.signOut({ scope: "local" });
  return "ok";
}
