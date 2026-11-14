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
import type { ActionResult } from "@/lib/action-result";

type ConfirmDeleteDialogProps = {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  successMessage: string;
  onConfirm: () => Promise<ActionResult>;
  /** Page à ouvrir après suppression (ex. la liste, depuis une fiche). */
  redirectTo?: string;
};

/** Confirmation de suppression définitive, avec état d'envoi et notification. */
export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  successMessage,
  onConfirm,
  redirectTo,
}: ConfirmDeleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">{description}</div>
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
