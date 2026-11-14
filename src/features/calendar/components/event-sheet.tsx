"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
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
} from "@/components/ui/sheet";

import { createEventAction, deleteEventAction, updateEventAction } from "../actions";
import type { EventFormInput } from "../schemas";
import type { Option } from "../types";

import { EventForm } from "./event-form";

/** Ce que le panneau édite : un nouveau rendez-vous (valeurs préremplies) ou un existant. */
export type EventSheetTarget =
  | { mode: "create"; values: EventFormInput }
  | { mode: "edit"; eventId: string; values: EventFormInput };

/** Panneau latéral contrôlé : création / modification / suppression d'un rendez-vous. */
export function EventSheet({
  slug,
  target,
  onClose,
  clientOptions,
  projectOptions,
}: {
  slug: string;
  target: EventSheetTarget | null;
  onClose: () => void;
  clientOptions: Option[];
  projectOptions: Option[];
}) {
  const action = (values: EventFormInput) =>
    target?.mode === "edit" ? updateEventAction(slug, target.eventId, values) : createEventAction(slug, values);

  function handleSuccess() {
    toast.success(target?.mode === "edit" ? "Modifications enregistrées" : "Rendez-vous créé");
    onClose();
  }

  return (
    <Sheet open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{target?.mode === "edit" ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</SheetTitle>
          <SheetDescription>
            {target?.mode === "edit" ? "Mettez à jour ce rendez-vous." : "Le titre et les dates sont obligatoires."}
          </SheetDescription>
        </SheetHeader>
        {target ? (
          <EventForm
            // Nouveau formulaire pour chaque cible (valeurs par défaut différentes)
            key={target.mode === "edit" ? target.eventId : `new-${target.values.startDate}`}
            defaultValues={target.values}
            clientOptions={clientOptions}
            projectOptions={projectOptions}
            action={action}
            onSuccess={handleSuccess}
            footer={(pending) => (
              <SheetFooter className="flex-row items-center border-t">
                {target.mode === "edit" ? (
                  <ConfirmDeleteDialog
                    title="Supprimer ce rendez-vous ?"
                    description={<p>« {target.values.title} » sera définitivement supprimé.</p>}
                    successMessage="Rendez-vous supprimé"
                    onConfirm={async () => {
                      const result = await deleteEventAction(slug, target.eventId);
                      if (result.ok) onClose();
                      return result;
                    }}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        className="mr-auto text-destructive hover:text-destructive"
                        disabled={pending}
                      >
                        <Trash2 aria-hidden />
                        Supprimer
                      </Button>
                    }
                  />
                ) : null}
                <div className="ml-auto flex gap-2">
                  <SheetClose asChild>
                    <Button type="button" variant="outline" disabled={pending}>
                      Annuler
                    </Button>
                  </SheetClose>
                  <SubmitButton pending={pending} className="w-auto">
                    {target.mode === "edit" ? "Enregistrer" : "Créer le rendez-vous"}
                  </SubmitButton>
                </div>
              </SheetFooter>
            )}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
