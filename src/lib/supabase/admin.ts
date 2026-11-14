import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env";

/**
 * Client d'administration (clé secrète) : CONTOURNE LA RLS.
 * Réservé aux scripts d'administration (seed, reset démo) et aux tests.
 * Ne jamais l'utiliser dans un flux déclenché par un utilisateur.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Variable d'environnement manquante : SUPABASE_SECRET_KEY");
  }
  return createClient(getSupabasePublicEnv().url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
