"use server";

import { redirect } from "next/navigation";

import { getHomePath } from "@/features/workspaces/queries";
import { fail, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

const UNAVAILABLE = "La démo est momentanément indisponible. Réessayez dans un instant.";
const RATE_LIMITED = "Trop de démos ont été lancées depuis votre connexion. Réessayez dans une heure.";

/**
 * « Essayer la démo » : ouvre une session ANONYME ; la base crée alors un espace de
 * démonstration rempli de données fictives (trigger, migration 0011), supprimé après 24 h.
 * Une personne déjà connectée est simplement renvoyée vers son espace.
 */
export async function startDemoAction(): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: current } = await supabase.auth.getClaims();
  if (current?.claims?.sub) {
    const home = await getHomePath(current.claims.sub, supabase);
    if (home) redirect(home);
  }

  const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { full_name: "Visiteur" } } });
  if (error || !data.user) {
    if (error) console.error("[demo] signInAnonymously:", error.code ?? error.message);
    return fail(error?.status === 429 ? RATE_LIMITED : UNAVAILABLE);
  }

  const home = await getHomePath(data.user.id, supabase);
  if (!home) return fail(UNAVAILABLE);
  redirect(home);
}

/** Quitter la démo pour créer un vrai compte (la session anonyme est fermée). */
export async function leaveDemoForSignUpAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/inscription");
}
