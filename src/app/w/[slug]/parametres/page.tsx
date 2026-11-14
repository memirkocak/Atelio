import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { getMyRole, getWorkspaceBySlug, getWorkspaceSettings } from "@/features/workspaces/queries";
import { toSettingsInput } from "@/features/workspaces/settings-schema";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage({ params }: PageProps<"/w/[slug]/parametres">) {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Paramètres" description="Espace de travail, informations de l’entreprise et devis." />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <SettingsSection params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function SettingsSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, workspace] = await Promise.all([requireUser(), getWorkspaceBySlug(slug)]);
  if (!workspace) notFound();
  const [settings, role] = await Promise.all([getWorkspaceSettings(workspace.id), getMyRole(workspace.id, user.id)]);

  return (
    <WorkspaceSettingsForm
      slug={slug}
      defaultValues={toSettingsInput(settings)}
      canEdit={role === "owner" || role === "admin"}
    />
  );
}
