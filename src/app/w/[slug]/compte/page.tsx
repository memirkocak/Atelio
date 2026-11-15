import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccountDialog } from "@/features/account/components/delete-account-dialog";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage({ params }: PageProps<"/w/[slug]/compte">) {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Mon compte" description="Profil, mot de passe et suppression du compte." />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <AccountSection params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function AccountSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, workspace] = await Promise.all([requireUser(), getWorkspaceBySlug(slug)]);
  if (!workspace) notFound();

  if (user.isAnonymous) {
    return (
      <Panel title="Session de démonstration">
        <p className="text-muted-foreground">
          Vous explorez Atelio avec un compte de démonstration temporaire : il n’a ni adresse e-mail ni mot de passe,
          et il est supprimé automatiquement avec ses données sous 24 h. Créez un compte pour conserver vos données.
        </p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Profil">
        <ProfileForm fullName={user.fullName ?? ""} email={user.email} />
      </Panel>
      <Panel title="Mot de passe">
        <PasswordForm />
      </Panel>
      <Panel title="Supprimer le compte" className="border-destructive/40">
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Supprime définitivement votre compte et les espaces dont vous êtes le seul propriétaire, avec toutes leurs
            données. Pensez à télécharger les PDF de vos devis avant.
          </p>
          <DeleteAccountDialog workspaceName={workspace.name} />
        </div>
      </Panel>
    </div>
  );
}
