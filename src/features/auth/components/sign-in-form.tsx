"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signIn } from "../actions";
import { signInSchema, type SignInInput } from "../schemas";

import { FormError } from "./form-alert";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";
import { useServerActionForm } from "./use-server-action-form";

const LINK_ERRORS: Record<string, string> = {
  "lien-invalide": "Ce lien est invalide ou a expiré. Connectez-vous ou faites une nouvelle demande.",
};

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const linkError = LINK_ERRORS[searchParams.get("erreur") ?? ""] ?? null;

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { onSubmit, pending, error } = useServerActionForm(form, (values) => signIn(values, next));
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error ?? linkError} />

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
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Link
              href="/mot-de-passe-oublie"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <SubmitButton pending={pending}>Se connecter</SubmitButton>
      </FieldGroup>
    </form>
  );
}
