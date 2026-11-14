import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Outils partagés par les tests RLS et E2E (projet Supabase de dev).
 * Les comptes de test utilisent le domaine réservé example.com et un préfixe dédié.
 */
export const TEST_PASSWORD = "Atelio-test-2026";

export type TypedClient = SupabaseClient<Database>;

function env(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Tests : variable ${name} manquante (.env.local).`);
  return value;
}

const noSession = { auth: { autoRefreshToken: false, persistSession: false } } as const;

/** Client administrateur : contourne la RLS. Réservé à la préparation et au nettoyage. */
export function adminClient(): TypedClient {
  return createClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), noSession);
}

/** Client anonyme (clé publique, sans session). */
export function anonClient(): TypedClient {
  return createClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    noSession,
  );
}

export function uniqueTestEmail(prefix: string): string {
  return `${prefix}${randomUUID().slice(0, 8)}@example.com`;
}

/** Crée un compte confirmé (le trigger crée profil + espace) et renvoie son identifiant. */
export async function createConfirmedUser(prefix: string, fullName: string) {
  const email = uniqueTestEmail(prefix);
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw error ?? new Error("Création du compte de test impossible");
  return { id: data.user.id, email, password: TEST_PASSWORD, fullName };
}

/** Slug de l'espace personnel créé à l'inscription. */
export async function getWorkspaceSlug(userId: string): Promise<string> {
  const { data, error } = await adminClient()
    .from("workspaces")
    .select("slug")
    .eq("created_by", userId)
    .single();
  if (error) throw error;
  return data.slug;
}

/** Client connecté en tant qu'utilisateur (clé publique + session) : la RLS s'applique. */
export async function signedInClient(email: string, password = TEST_PASSWORD): Promise<TypedClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

/**
 * Supprime les comptes de test du préfixe donné ET leurs espaces
 * (sinon les espaces resteraient orphelins : created_by passe à NULL).
 */
export async function deleteTestUsers(prefix: string) {
  const admin = adminClient();
  const ids: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email?.startsWith(prefix) && u.email.endsWith("@example.com")) ids.push(u.id);
    }
    if (data.users.length < 200) break;
  }
  if (ids.length === 0) return;

  const { error: wsError } = await admin.from("workspaces").delete().in("created_by", ids);
  if (wsError) throw wsError;
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
}
