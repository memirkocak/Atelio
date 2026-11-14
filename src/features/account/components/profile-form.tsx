"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-alert";
import { SubmitButton } from "@/components/shared/submit-button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerActionForm } from "@/hooks/use-server-action-form";

import { updateProfileAction } from "../actions";
import { profileSchema, type ProfileInput } from "../schemas";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const uid = useId();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { fullName } });
  const { onSubmit, pending, error } = useServerActionForm(form, updateProfileAction, () => {
    toast.success("Profil mis à jour");
    form.reset(form.getValues());
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <Field data-invalid={!!errors.fullName}>
          <FieldLabel htmlFor={`${uid}-name`}>Nom affiché</FieldLabel>
          <Input id={`${uid}-name`} autoComplete="name" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
          <FieldError errors={[errors.fullName]} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${uid}-email`}>Adresse e-mail</FieldLabel>
          <Input id={`${uid}-email`} value={email} readOnly disabled />
          <FieldDescription>L’adresse e-mail ne peut pas être modifiée pour le moment.</FieldDescription>
        </Field>
        <div>
          <SubmitButton pending={pending} className="w-auto">
            Enregistrer
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
