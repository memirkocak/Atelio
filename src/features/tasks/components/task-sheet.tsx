"use client";

import { Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";

import { createTaskAction, deleteTaskAction, updateTaskAction } from "../actions";
import { emptyTaskForm, type TaskFormInput } from "../schemas";
import type { ProjectOption } from "../types";

import { TaskForm } from "./task-form";

type TaskSheetProps = {
  slug: string;
  trigger: ReactNode;
  projectOptions: ProjectOption[];
} & (
  | { mode: "create"; defaultProjectId?: string }
  | { mode: "edit"; taskId: string; taskTitle: string; defaultValues: TaskFormInput }
);

/** Panneau latéral de création / modification (et suppression) d'une tâche. */
export function TaskSheet(props: TaskSheetProps) {
  const { slug, trigger, mode, projectOptions } = props;
  const [open, setOpen] = useState(false);

  const action =
    mode === "create"
      ? (values: TaskFormInput) => createTaskAction(slug, values)
      : (values: TaskFormInput) => updateTaskAction(slug, props.taskId, values);

  const defaultValues =
    mode === "create" ? { ...emptyTaskForm, projectId: props.defaultProjectId ?? "" } : props.defaultValues;

  function handleSuccess() {
    setOpen(false);
    toast.success(mode === "create" ? "Tâche créée" : "Modifications enregistrées");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Seul le titre est obligatoire." : "Mettez à jour cette tâche."}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <TaskForm
            defaultValues={defaultValues}
            projectOptions={projectOptions}
            action={action}
            onSuccess={handleSuccess}
            footer={(pending) => (
              <SheetFooter className="flex-row items-center border-t">
                {mode === "edit" ? (
                  <ConfirmDeleteDialog
                    title="Supprimer cette tâche ?"
                    description={<p>« {props.taskTitle} » sera définitivement supprimée.</p>}
                    successMessage="Tâche supprimée"
                    onConfirm={async () => {
                      const result = await deleteTaskAction(slug, props.taskId);
                      if (result.ok) setOpen(false);
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
                    {mode === "create" ? "Créer la tâche" : "Enregistrer"}
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
