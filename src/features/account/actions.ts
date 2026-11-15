"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { authErrorMessage } from "@/lib/auth/errors";
import { verifyPassword, type PasswordCheck } from "@/lib/auth/verify-password";
import { createClient } from "@/lib/supabase/server";

import { changePasswordSchema, deleteAccountSchema, profileSchema } from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";
const SESSION_EXPIRED = "Votre session a expiré. Reconnectez-vous.";
const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans un instant.";
const DEMO_FORBIDDEN = "Indisponible en mode démo : créez un compte pour gérer votre mot de passe.";

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

/** Utilisateur de la session (identité vérifiée par getClaims, jamais getSession). */
async function sessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return { supabase, id: claims?.sub ?? null, email: claims?.email ?? null, isAnonymous: claims?.is_anonymous === true };
}

function passwordFailure(check: Exclude<PasswordCheck, "ok">, field: string) {
  if (check === "invalid") {
    return fail("Mot de passe incorrect.", { [field]: ["Mot de passe incorrect."] });
  }
  return fail(check === "rate_limited" ? authErrorMessage({ status: 429 }) : GENERIC_ERROR);
}

/** Nom affiché : métadonnées du compte (lues dans le jeton) ET profil (lu par les autres membres). */
export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const { supabase, id } = await sessionUser();
  if (!id) return fail(SESSION_EXPIRED);

  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  if (error) return fail(authErrorMessage(error));
  const { error: profileError } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", id);
  if (profileError) return fail(GENERIC_ERROR);
  // Nouveau jeton : le nom à jour est lu immédiatement par getClaims()
  await supabase.auth.refreshSession();

  refresh();
  return ok();
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const { supabase, id, email, isAnonymous } = await sessionUser();
  if (isAnonymous) return fail(DEMO_FORBIDDEN);
  if (!id || !email) return fail(SESSION_EXPIRED);

  const check = await verifyPassword(email, parsed.data.currentPassword);
  if (check !== "ok") return passwordFailure(check, "currentPassword");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));
  return ok();
}

/** Suppression définitive du compte (après vérification du mot de passe), puis déconnexion. */
export async function deleteAccountAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const { supabase, id, email, isAnonymous } = await sessionUser();
  if (isAnonymous) return fail(DEMO_FORBIDDEN);
  if (!id || !email) return fail(SESSION_EXPIRED);

  const check = await verifyPassword(email, parsed.data.password);
  if (check !== "ok") return passwordFailure(check, "password");

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return fail(error.code === "AT010" ? "Le compte de démonstration ne peut pas être supprimé." : GENERIC_ERROR);
  }
  // Le compte n'existe plus : on efface seulement les cookies de session locaux.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/connexion?info=compte-supprime");
}
