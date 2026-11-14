"use client";

import { Check, Copy, Download, LoaderCircle, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
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

import { deleteQuoteAction, duplicateQuoteAction, setQuoteStatusAction } from "../actions";
import type { QuoteStatus } from "../constants";

/** Actions de la fiche devis, selon son statut. */
export function QuoteActions({
  slug,
  quoteId,
  number,
  status,
}: {
  slug: string;
  quoteId: string;
  number: string;
  status: QuoteStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendOpen, setSendOpen] = useState(false);

  function changeStatus(next: QuoteStatus, message: string, onDone?: () => void) {
    startTransition(async () => {
      const result = await setQuoteStatusAction(slug, quoteId, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onDone?.();
      toast.success(message);
    });
  }

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateQuoteAction(slug, quoteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Devis dupliqué en nouveau brouillon");
      router.push(`/w/${slug}/devis/${result.data.id}/modifier`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/w/${slug}/devis/${quoteId}/modifier`}>
              <Pencil aria-hidden />
              Modifier
            </Link>
          </Button>
          <AlertDialog open={sendOpen} onOpenChange={(o) => !pending && setSendOpen(o)}>
            <AlertDialogTrigger asChild>
              <Button disabled={pending}>
                <Send aria-hidden />
                Marquer comme envoyé
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Marquer {number} comme envoyé ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le devis sera figé : il ne pourra plus être modifié ni supprimé, et les coordonnées du client
                  et de votre entreprise y seront enregistrées telles qu’aujourd’hui. Pour le corriger ensuite,
                  vous pourrez le dupliquer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
                <Button
                  onClick={() => changeStatus("sent", "Devis marqué comme envoyé", () => setSendOpen(false))}
                  disabled={pending}
                >
                  {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                  Confirmer l’envoi
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}

      {status === "sent" ? (
        <>
          <Button onClick={() => changeStatus("accepted", "Devis accepté")} disabled={pending}>
            <Check aria-hidden />
            Accepté
          </Button>
          <Button variant="outline" onClick={() => changeStatus("refused", "Devis refusé")} disabled={pending}>
            <X aria-hidden />
            Refusé
          </Button>
        </>
      ) : null}

      <Button asChild variant="outline">
        {/* Route Handler : lien classique (pas de navigation client) */}
        <a href={`/w/${slug}/devis/${quoteId}/pdf`} download={`${number}.pdf`}>
          <Download aria-hidden />
          PDF
        </a>
      </Button>

      <Button variant="outline" onClick={duplicate} disabled={pending}>
        <Copy aria-hidden />
        Dupliquer
      </Button>

      {status === "draft" ? (
        <ConfirmDeleteDialog
          title="Supprimer ce brouillon ?"
          description={<p>Le brouillon {number} sera définitivement supprimé.</p>}
          successMessage={`${number} a été supprimé`}
          onConfirm={() => deleteQuoteAction(slug, quoteId)}
          redirectTo={`/w/${slug}/devis`}
          trigger={
            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={pending}>
              <Trash2 aria-hidden />
              Supprimer
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
