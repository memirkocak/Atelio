import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";
import { UserMenu } from "@/features/auth/components/user-menu";

// Accès réservé aux utilisateurs connectés : proxy.ts redirige, et UserMenu vérifie
// la session côté serveur. Le contrôle d'appartenance à l'espace arrive en phase 4.
// Avec cacheComponents, ni `params` ni la session ne sont lus au niveau du layout :
// ces lectures sont isolées dans des frontières <Suspense>.
export default function WorkspaceLayout({ children }: LayoutProps<"/w/[slug]">) {
  return (
    <AppShell
      userMenu={
        <Suspense fallback={<SidebarMenuSkeleton showIcon className="h-12" />}>
          <UserMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
