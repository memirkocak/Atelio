"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans un instant.";

/**
 * Relie un formulaire React Hook Form à une Server Action :
 * état d'envoi, erreur globale et erreurs de champ renvoyées par le serveur.
 * Une redirection déclenchée par l'action (redirect()) est gérée par Next.js.
 *
 * L'action reçoit les valeurs SAISIES (après validation côté client) : le serveur
 * applique lui-même le schéma Zod (validation et transformations) et fait foi.
 */
export function useServerActionForm<TValues extends FieldValues, TData, TOutput = TValues>(
  form: UseFormReturn<TValues, unknown, TOutput>,
  action: (values: TValues) => Promise<ActionResult<TData>>,
  onSuccess?: (data: TData) => void,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      try {
        const result = await action(values);
        if (!result) return; // redirection
        if (result.ok) {
          onSuccess?.(result.data);
          return;
        }
        setError(result.error);
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages[0]) form.setError(field as Path<TValues>, { message: messages[0] });
        }
      } catch (e) {
        // Les redirections de Next.js sont propagées, pas affichées comme erreurs.
        if (isNextRedirect(e)) throw e;
        setError(GENERIC_ERROR);
      }
    });
  });

  return { onSubmit, pending, error };
}

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
