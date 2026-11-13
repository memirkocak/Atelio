"use client";

import { useState, type ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

/** À partir de cette largeur, la sidebar est dépliée par défaut (sinon : icônes seules). */
const WIDE_SCREEN_QUERY = "(min-width: 1280px)";

export function AppShell({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery(WIDE_SCREEN_QUERY, true);
  // null = l'utilisateur n'a pas encore choisi : on suit la largeur d'écran.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider open={userOpen ?? isWide} onOpenChange={setUserOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-canvas">
          <AppTopbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
