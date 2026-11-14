"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { updatePassword } from "../actions";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";

import { FormError } from "@/components/shared/form-alert";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "@/components/shared/submit-button";
import { useServerActionForm } from "@/hooks/use-server-action-form";

export function ResetPasswordForm() {
  const uid = useId();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { onSubmit, pending, error } = useServerActionForm(form, updatePassword);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor={`${uid}-password`}>Nouveau mot de passe</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldDescription>8 caractères minimum, dont au moins une lettre et un chiffre.</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor={`${uid}-confirmPassword`}>Confirmer le mot de passe</FieldLabel>
          <PasswordInput
            id={`${uid}-confirmPassword`}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <SubmitButton pending={pending}>Enregistrer le mot de passe</SubmitButton>
      </FieldGroup>
    </form>
  );
}
