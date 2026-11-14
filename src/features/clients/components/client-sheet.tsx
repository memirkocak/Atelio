"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { createClientAction, updateClientAction } from "../actions";
import { emptyClientForm, type ClientFormInput } from "../schemas";

import { ClientForm } from "./client-form";

type ClientSheetProps = {
  slug: string;
  trigger: ReactNode;
} & ({ mode: "create" } | { mode: "edit"; clientId: string; defaultValues: ClientFormInput });

/** Panneau latéral de création / modification d'un client. */
export function ClientSheet(props: ClientSheetProps) {
  const { slug, trigger, mode } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const action =
    mode === "create"
      ? (values: ClientFormInput) => createClientAction(slug, values)
      : (values: ClientFormInput) => updateClientAction(slug, props.clientId, values);

  function handleSuccess(id: string) {
    setOpen(false);
    if (mode === "create") {
      toast.success("Client ajouté", {
        action: { label: "Voir la fiche", onClick: () => router.push(`/w/${slug}/clients/${id}`) },
      });
    } else {
      toast.success("Modifications enregistrées");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "create" ? "Nouveau client" : "Modifier le client"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Ajoutez un client à votre espace. Seuls le nom et, pour une entreprise, sa raison sociale sont obligatoires."
              : "Mettez à jour les informations de ce client."}
          </SheetDescription>
        </SheetHeader>
        {/* Monté uniquement à l'ouverture : le formulaire repart des valeurs à jour. */}
        {open ? (
          <ClientForm
            defaultValues={mode === "create" ? emptyClientForm : props.defaultValues}
            action={action}
            onSuccess={handleSuccess}
            footer={(pending) => (
              <SheetFooter className="flex-row justify-end border-t">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={pending}>
                    Annuler
                  </Button>
                </SheetClose>
                <SubmitButton pending={pending} className="w-auto">
                  {mode === "create" ? "Ajouter le client" : "Enregistrer"}
                </SubmitButton>
              </SheetFooter>
            )}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
