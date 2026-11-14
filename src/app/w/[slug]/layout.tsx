import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";
import { UserMenu } from "@/features/auth/components/user-menu";
import { WorkspaceGate } from "@/features/workspaces/components/workspace-gate";
import { WorkspaceName } from "@/features/workspaces/components/workspace-name";

/*
 * Accès à un espace :
 *  1. proxy.ts redirige les visiteurs non connectés ;
 *  2. WorkspaceGate vérifie la session et l'appartenance (RLS) → 404 sinon ;
 *  3. chaque requête de données reste filtrée par la RLS.
 * Avec cacheComponents, ni `params` ni la session ne sont lus au niveau du layout :
 * ces lectures sont isolées dans des frontières <Suspense> (la coquille reste statique).
 */
export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[slug]">) {
  return (
    <AppShell
      workspaceName={
        <Suspense fallback={<Skeleton className="h-4 w-28" />}>
          <WorkspaceName params={params} />
        </Suspense>
      }
      userMenu={
        <Suspense fallback={<SidebarMenuSkeleton showIcon className="h-12" />}>
          <UserMenu />
        </Suspense>
      }
    >
      <Suspense fallback={<PageSkeleton />}>
        <WorkspaceGate params={params}>{children}</WorkspaceGate>
      </Suspense>
    </AppShell>
  );
}

function PageSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-2" aria-busy>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </PageContainer>
  );
}
