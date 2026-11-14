"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useId } from "react";
import { useForm } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signUp } from "../actions";
import { signUpSchema, type SignUpInput } from "../schemas";

import { FormError, FormSuccess } from "@/components/shared/form-alert";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "@/components/shared/submit-button";
import { useServerActionForm } from "@/hooks/use-server-action-form";

export function SignUpForm() {
  const uid = useId();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { onSubmit, pending, error } = useServerActionForm(form, signUp, () =>
    setSentTo(form.getValues("email").trim()),
  );
  const { errors } = form.formState;

  if (sentTo) {
    return (
      <FormSuccess>
        Si l’adresse <strong>{sentTo}</strong> peut être utilisée, un e-mail de confirmation vient
        d’y être envoyé. Cliquez sur le lien qu’il contient pour activer votre compte.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />

        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor={`${uid}-fullName`}>Nom complet</FieldLabel>
          <Input
            id={`${uid}-fullName`}
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor={`${uid}-email`}>Adresse e-mail</FieldLabel>
          <Input
            id={`${uid}-email`}
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor={`${uid}-password`}>Mot de passe</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={`${uid}-password-hint`}
            {...form.register("password")}
          />
          <FieldDescription id={`${uid}-password-hint`}>
            8 caractères minimum, dont au moins une lettre et un chiffre.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
      </FieldGroup>
    </form>
  );
}
