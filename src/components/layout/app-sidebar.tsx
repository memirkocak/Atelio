"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { BrandMark } from "./brand";
import {
  DEFAULT_WORKSPACE_SEGMENT,
  findActiveNavItem,
  mainNavItems,
  secondaryNavItems,
  workspaceHref,
  type NavItem,
} from "./navigation";

/*
 * Avec cacheComponents, l'URL (useParams / usePathname) est une donnée d'exécution :
 * les parties qui la lisent sont placées dans <Suspense>, le reste de la coquille
 * est pré-rendu statiquement.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <Suspense fallback={<BrandContent />}>
          <BrandLink />
        </Suspense>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={<NavMenuSkeleton count={mainNavItems.length} />}>
              <NavMenu items={mainNavItems} />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Suspense fallback={<NavMenuSkeleton count={secondaryNavItems.length} />}>
          <NavMenu items={secondaryNavItems} />
        </Suspense>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function BrandContent() {
  return (
    <span className="flex items-center gap-2 px-1">
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
        Atelio
      </span>
    </span>
  );
}

function BrandLink() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <Link
      href={workspaceHref(slug, DEFAULT_WORKSPACE_SEGMENT)}
      aria-label="Atelio, tableau de bord"
      className="rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <BrandContent />
    </Link>
  );
}

function NavMenuSkeleton({ count }: { count: number }) {
  return (
    <SidebarMenu className="gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function NavMenu({ items }: { items: readonly NavItem[] }) {
  const { slug } = useParams<{ slug: string }>();
  const activeSegment = findActiveNavItem(usePathname())?.segment;
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => {
        const isActive = item.segment === activeSegment;
        return (
          <SidebarMenuItem key={item.segment}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className="text-sidebar-foreground data-[active=true]:text-primary [&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-primary"
            >
              <Link
                href={workspaceHref(slug, item.segment)}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
