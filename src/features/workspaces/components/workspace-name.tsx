import { getWorkspaceBySlug } from "../queries";

/** Nom de l'espace courant (sidebar). Lit les params et la base : à placer dans <Suspense>. */
export async function WorkspaceName({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  return <>{workspace?.name ?? "Atelio"}</>;
}
