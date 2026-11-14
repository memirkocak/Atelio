"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ClientFormInput } from "../schemas";

import { ClientSheet } from "./client-sheet";
import { DeleteClientDialog } from "./delete-client-dialog";

/** Boutons Modifier / Supprimer de la fiche client. */
export function ClientActions({
  slug,
  clientId,
  clientLabel,
  projectCount,
  defaultValues,
}: {
  slug: string;
  clientId: string;
  clientLabel: string;
  projectCount: number;
  defaultValues: ClientFormInput;
}) {
  return (
    <>
      <ClientSheet
        mode="edit"
        slug={slug}
        clientId={clientId}
        defaultValues={defaultValues}
        trigger={
          <Button variant="outline">
            <Pencil aria-hidden />
            Modifier
          </Button>
        }
      />
      <DeleteClientDialog
        slug={slug}
        clientId={clientId}
        clientLabel={clientLabel}
        projectCount={projectCount}
        redirectTo={`/w/${slug}/clients`}
        trigger={
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden />
            Supprimer
          </Button>
        }
      />
    </>
  );
}
