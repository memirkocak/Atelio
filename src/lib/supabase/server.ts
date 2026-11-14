import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/env";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * Il agit avec la session de l'utilisateur (cookies) : la RLS s'applique toujours.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient(url, publishableKey, {
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
