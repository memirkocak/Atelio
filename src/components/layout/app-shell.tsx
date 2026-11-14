"use client";

import { useId, useState, type ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

/** À partir de cette largeur, la sidebar est dépliée par défaut (sinon : icônes seules). */
const WIDE_SCREEN_QUERY = "(min-width: 1280px)";

type AppShellProps = {
  children: ReactNode;
  /** Emplacements rendus côté serveur (dans des frontières <Suspense>). */
  userMenu: ReactNode;
  workspaceName: ReactNode;
};

export function AppShell({ children, userMenu, workspaceName }: AppShellProps) {
  const contentId = useId();
  const isWide = useMediaQuery(WIDE_SCREEN_QUERY, true);
  // null = l'utilisateur n'a pas encore choisi : on suit la largeur d'écran.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);

  return (
    <TooltipProvider delayDuration={300}>
      {/* Lien d’évitement : premier élément focalisable de la page (WCAG 2.4.1) */}
      <a
        href={`#${contentId}`}
        className="sr-only z-50 rounded-md bg-background px-3 py-2 font-medium shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2 focus:ring-ring"
      >
        Aller au contenu
      </a>
      <SidebarProvider open={userOpen ?? isWide} onOpenChange={setUserOpen}>
        <AppSidebar userMenu={userMenu} workspaceName={workspaceName} />
        <SidebarInset id={contentId} tabIndex={-1} className="min-w-0 bg-canvas outline-none">
          <AppTopbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
