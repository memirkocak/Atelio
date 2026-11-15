import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DemoBanner } from "@/features/demo/components/demo-banner";
import { requireUser } from "@/lib/auth/session";

import { getWorkspaceBySlug } from "../queries";

/**
 * Garde d'accès à un espace : session valide ET appartenance (RLS).
 * Espace inexistant ou inaccessible → 404 (on ne révèle pas son existence).
 * Lit la session et les params : à placer dans <Suspense>.
 */
export async function WorkspaceGate({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}) {
  await requireUser();
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();
  return (
    <>
      {workspace.is_demo ? <DemoBanner /> : null}
      {children}
    </>
  );
}
