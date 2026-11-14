"use client";

import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { accountNavItem, workspaceHref } from "@/components/layout/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { initials } from "@/lib/initials";

import { signOut } from "../actions";

const SIGN_OUT_FORM_ID = "sign-out-form";

export function UserMenuDropdown({ name, email }: { name: string; email: string }) {
  const { isMobile } = useSidebar();
  const { slug } = useParams<{ slug?: string }>();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              {/* Nom accessible = « Menu du compte » + texte visible (critère WCAG 2.5.3) */}
              <span className="sr-only">Menu du compte :</span>
              <Avatar className="size-8 rounded-md" aria-hidden>
                <AvatarFallback className="rounded-md bg-accent text-xs font-medium text-primary">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium text-foreground">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {slug ? (
              <DropdownMenuItem asChild>
                <Link href={workspaceHref(slug, accountNavItem.segment)}>
                  <UserRound aria-hidden />
                  Mon compte
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              {/* Bouton relié au formulaire ci-dessous (hors du portail du menu) */}
              <button type="submit" form={SIGN_OUT_FORM_ID} className="w-full">
                <LogOut aria-hidden />
                Se déconnecter
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <form id={SIGN_OUT_FORM_ID} action={signOut} hidden />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
