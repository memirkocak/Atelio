"use client";

import type { ReactNode } from "react";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";

import { deleteClientAction } from "../actions";

type DeleteClientDialogProps = {
  slug: string;
  clientId: string;
  clientLabel: string;
  /** Nombre de projets rattachés (ils seront détachés, pas supprimés). */
  projectCount?: number;
  trigger: ReactNode;
  redirectTo?: string;
};

export function DeleteClientDialog({
  slug,
  clientId,
  clientLabel,
  projectCount = 0,
  trigger,
  redirectTo,
}: DeleteClientDialogProps) {
  return (
    <ConfirmDeleteDialog
      trigger={trigger}
      title="Supprimer ce client ?"
      description={
        <>
          <p>
            « {clientLabel} » et ses informations seront définitivement supprimés. Cette action est
            irréversible.
          </p>
          {projectCount > 0 ? (
            <p className="font-medium text-foreground">
              {projectCount === 1
                ? "1 projet est rattaché à ce client : il sera conservé, sans client."
                : `${projectCount} projets sont rattachés à ce client : ils seront conservés, sans client.`}
            </p>
          ) : null}
        </>
      }
      successMessage={`« ${clientLabel} » a été supprimé`}
      onConfirm={() => deleteClientAction(slug, clientId)}
      redirectTo={redirectTo}
    />
  );
}
