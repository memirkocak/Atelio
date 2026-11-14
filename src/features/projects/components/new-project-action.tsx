import { listClientOptions } from "@/features/clients/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { NewProjectButton } from "./new-project-button";

/** Bouton « Nouveau projet » de l'en-tête (charge la liste des clients) : à placer dans <Suspense>. */
export async function NewProjectAction({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return null;
  const clientOptions = await listClientOptions(workspace.id);
  return <NewProjectButton slug={slug} clientOptions={clientOptions} />;
}
