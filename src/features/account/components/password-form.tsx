"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-alert";
import { SubmitButton } from "@/components/shared/submit-button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useServerActionForm } from "@/hooks/use-server-action-form";

import { changePasswordAction } from "../actions";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";

const EMPTY: ChangePasswordInput = { currentPassword: "", password: "", confirmPassword: "" };

export function PasswordForm() {
  const uid = useId();
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });
  const { onSubmit, pending, error } = useServerActionForm(form, changePasswordAction, () => {
    toast.success("Mot de passe modifié");
    form.reset(EMPTY);
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor={`${uid}-current`}>Mot de passe actuel</FieldLabel>
          <PasswordInput
            id={`${uid}-current`}
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...form.register("currentPassword")}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor={`${uid}-new`}>Nouveau mot de passe</FieldLabel>
            <PasswordInput
              id={`${uid}-new`}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldDescription>8 caractères minimum, dont une lettre et un chiffre.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor={`${uid}-confirm`}>Confirmer le nouveau mot de passe</FieldLabel>
            <PasswordInput
              id={`${uid}-confirm`}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...form.register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
        </div>
        <div>
          <SubmitButton pending={pending} className="w-auto">
            Modifier le mot de passe
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
