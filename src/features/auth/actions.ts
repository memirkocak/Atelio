"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { authErrorMessage } from "@/lib/auth/errors";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

const INVALID_FORM = "Certains champs sont invalides.";

/** Les liens des e-mails passent par /auth/confirm, qui ouvre la session puis redirige. */
function confirmUrl(next: string): string {
  return `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;
}

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export async function signIn(input: unknown, next?: string | null): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(authErrorMessage(error));

  redirect(safeNextPath(next));
}

export type SignUpResult = ActionResult<{ needsEmailConfirmation: boolean }>;

export async function signUp(input: unknown): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: confirmUrl(DEFAULT_AFTER_LOGIN),
    },
  });
  if (error) return fail(authErrorMessage(error));

  // Confirmation désactivée (projet de dev) : session immédiate.
  if (data.session) redirect(DEFAULT_AFTER_LOGIN);

  // Confirmation activée : même réponse que le compte existe ou non (pas d'énumération).
  return ok({ needsEmailConfirmation: true });
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/reinitialiser-mot-de-passe"),
  });

  // Seule la limitation de débit est signalée ; sinon réponse neutre
  // pour ne pas révéler si l'adresse possède un compte.
  if (error?.status === 429) return fail(authErrorMessage(error));
  if (error) console.error("[auth] resetPasswordForEmail:", error.code ?? error.message);
  return ok();
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_FORM, fieldErrors(parsed.error));

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return fail(authErrorMessage({ code: "session_expired" }));

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));

  redirect(DEFAULT_AFTER_LOGIN);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
