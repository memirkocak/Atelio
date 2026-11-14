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
import type { ClientOption } from "@/features/clients/queries";

import { createProjectAction, updateProjectAction } from "../actions";
import { emptyProjectForm, type ProjectFormInput } from "../schemas";

import { ProjectForm } from "./project-form";

type ProjectSheetProps = {
  slug: string;
  trigger: ReactNode;
  clientOptions: ClientOption[];
} & (
  | { mode: "create"; defaultClientId?: string }
  | { mode: "edit"; projectId: string; defaultValues: ProjectFormInput }
);

/** Panneau latéral de création / modification d'un projet. */
export function ProjectSheet(props: ProjectSheetProps) {
  const { slug, trigger, mode, clientOptions } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const action =
    mode === "create"
      ? (values: ProjectFormInput) => createProjectAction(slug, values)
      : (values: ProjectFormInput) => updateProjectAction(slug, props.projectId, values);

  const defaultValues =
    mode === "create" ? { ...emptyProjectForm, clientId: props.defaultClientId ?? "" } : props.defaultValues;

  function handleSuccess(id: string) {
    setOpen(false);
    if (mode === "create") {
      toast.success("Projet créé", {
        action: { label: "Voir le projet", onClick: () => router.push(`/w/${slug}/projets/${id}`) },
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
          <SheetTitle>{mode === "create" ? "Nouveau projet" : "Modifier le projet"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Seul le nom est obligatoire ; le reste peut être complété plus tard."
              : "Mettez à jour les informations de ce projet."}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <ProjectForm
            defaultValues={defaultValues}
            clientOptions={clientOptions}
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
                  {mode === "create" ? "Créer le projet" : "Enregistrer"}
                </SubmitButton>
              </SheetFooter>
            )}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
