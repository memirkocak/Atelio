import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { listProjectOptions } from "../queries";

import { TaskSheet } from "./task-sheet";

/** Bouton « Nouvelle tâche » (formulaire complet) de l'en-tête : à placer dans <Suspense>. */
export async function NewTaskAction({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;
  const projectOptions = await listProjectOptions(workspace.id);
  return (
    <TaskSheet
      mode="create"
      slug={slug}
      projectOptions={projectOptions}
      trigger={
        <Button>
          <Plus aria-hidden />
          Nouvelle tâche
        </Button>
      }
    />
  );
}

export function NewTaskButtonFallback() {
  return (
    <Button disabled>
      <Plus aria-hidden />
      Nouvelle tâche
    </Button>
  );
}
