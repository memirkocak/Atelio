import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Il agit avec la session de l'utilisateur (cookies) : la RLS s'applique toujours.
 */
export async function createClient() {
  // Toute requête Supabase dépend de la session, donc de l'heure courante (expiration
  // du JWT) : elle doit s'exécuter au moment de la requête, jamais lors d'un pré-rendu
  // (y compris le pré-rendu avec cookies de partialPrefetching). Voir DT-020.
  await connection();
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : écriture impossible, sans gravité
          // car le proxy rafraîchit la session à chaque requête.
        }
      },
    },
  });
}
