"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/errors";

/**
 * Relie un formulaire React Hook Form à une Server Action :
 * état d'envoi, erreur globale et erreurs de champ renvoyées par le serveur.
 * Une redirection déclenchée par l'action (redirect()) est gérée par Next.js.
 */
export function useServerActionForm<TValues extends FieldValues, TData>(
  form: UseFormReturn<TValues>,
  action: (values: TValues) => Promise<ActionResult<TData>>,
  onSuccess?: (data: TData) => void,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
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
        setError(GENERIC_AUTH_ERROR);
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
