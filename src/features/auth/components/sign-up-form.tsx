"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

import { FormError, FormSuccess } from "./form-alert";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";
import { useServerActionForm } from "./use-server-action-form";

export function SignUpForm() {
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
          <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

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

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="password-hint"
            {...form.register("password")}
          />
          <FieldDescription id="password-hint">
            8 caractères minimum, dont au moins une lettre et un chiffre.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
      </FieldGroup>
    </form>
  );
}
