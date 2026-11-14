"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import type { ClientOption } from "@/features/clients/queries";

import { deleteProjectAction } from "../actions";
import type { ProjectFormInput } from "../schemas";

import { ProjectSheet } from "./project-sheet";

/** Boutons Modifier / Supprimer de la fiche projet. */
export function ProjectActions({
  slug,
  projectId,
  projectName,
  defaultValues,
  clientOptions,
}: {
  slug: string;
  projectId: string;
  projectName: string;
  defaultValues: ProjectFormInput;
  clientOptions: ClientOption[];
}) {
  return (
    <>
      <ProjectSheet
        mode="edit"
        slug={slug}
        projectId={projectId}
        defaultValues={defaultValues}
        clientOptions={clientOptions}
        trigger={
          <Button variant="outline">
            <Pencil aria-hidden />
            Modifier
          </Button>
        }
      />
      <ConfirmDeleteDialog
        title="Supprimer ce projet ?"
        description={<p>« {projectName} » sera définitivement supprimé. Cette action est irréversible.</p>}
        successMessage={`« ${projectName} » a été supprimé`}
        onConfirm={() => deleteProjectAction(slug, projectId)}
        redirectTo={`/w/${slug}/projets`}
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
