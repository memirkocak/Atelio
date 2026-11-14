"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

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

import { deleteClientAction } from "../actions";

type DeleteClientDialogProps = {
  slug: string;
  clientId: string;
  clientLabel: string;
  trigger: ReactNode;
  /** Page à ouvrir après suppression (ex. la liste, depuis la fiche). */
  redirectTo?: string;
};

export function DeleteClientDialog({ slug, clientId, clientLabel, trigger, redirectTo }: DeleteClientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClientAction(slug, clientId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(`« ${clientLabel} » a été supprimé`);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
          <AlertDialogDescription>
            « {clientLabel} » et ses informations seront définitivement supprimés. Cette action est
            irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          {/* Bouton simple (pas AlertDialogAction) : la fenêtre reste ouverte pendant l'envoi. */}
          <Button variant="destructive" onClick={handleDelete} disabled={pending} aria-busy={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            Supprimer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
