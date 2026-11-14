"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { requestPasswordReset } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

import { FormError, FormSuccess } from "./form-alert";
import { SubmitButton } from "./submit-button";
import { useServerActionForm } from "./use-server-action-form";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { onSubmit, pending, error } = useServerActionForm(form, requestPasswordReset, () =>
    setSent(true),
  );
  const { errors } = form.formState;

  if (sent) {
    return (
      <FormSuccess>
        Si un compte est associé à cette adresse, vous allez recevoir un e-mail contenant un lien
        pour choisir un nouveau mot de passe.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
      </FieldGroup>
    </form>
  );
}
