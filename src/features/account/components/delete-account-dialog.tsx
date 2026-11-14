"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/shared/form-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useServerActionForm } from "@/hooks/use-server-action-form";

import { deleteAccountAction } from "../actions";
import { deleteAccountSchema, type DeleteAccountInput } from "../schemas";

/** Suppression définitive du compte : confirmation par le mot de passe (vérifié côté serveur). */
export function DeleteAccountDialog({ workspaceName }: { workspaceName: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const form = useForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema), defaultValues: { password: "" } });
  // En cas de succès, l'action redirige vers la page de connexion.
  const { onSubmit, pending, error } = useServerActionForm(form, deleteAccountAction);
  const { errors } = form.formState;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          <Trash2 aria-hidden />
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Votre compte et l’espace « {workspaceName} » seront supprimés, avec tous leurs clients, projets,
                  tâches, devis et rendez-vous.
                </p>
                <p className="font-medium text-foreground">Cette action est irréversible.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormError message={error} />
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor={`${uid}-password`}>Saisissez votre mot de passe pour confirmer</FieldLabel>
            <PasswordInput
              id={`${uid}-password`}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Annuler
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
