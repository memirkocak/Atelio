import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  /** Segment d'URL sous /w/[slug]/ */
  segment: string;
  icon: LucideIcon;
};

export const mainNavItems: readonly NavItem[] = [
  { title: "Tableau de bord", segment: "tableau-de-bord", icon: LayoutDashboard },
  { title: "Clients", segment: "clients", icon: Users },
  { title: "Projets", segment: "projets", icon: FolderKanban },
  { title: "Tâches", segment: "taches", icon: ListChecks },
  { title: "Devis", segment: "devis", icon: FileText },
  { title: "Calendrier", segment: "calendrier", icon: CalendarDays },
  { title: "Statistiques", segment: "statistiques", icon: BarChart3 },
];

export const secondaryNavItems: readonly NavItem[] = [
  { title: "Paramètres", segment: "parametres", icon: Settings },
];

export const allNavItems: readonly NavItem[] = [...mainNavItems, ...secondaryNavItems];

export const DEFAULT_WORKSPACE_SEGMENT = "tableau-de-bord";

export function workspaceHref(slug: string, segment: string): string {
  return `/w/${encodeURIComponent(slug)}/${segment}`;
}

/**
 * Retourne l'élément de navigation correspondant à l'URL courante
 * (/w/<slug>/<segment>/...), ou undefined.
 */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  const [, root, , segment] = pathname.split("/");
  if (root !== "w" || !segment) return undefined;
  return allNavItems.find((item) => item.segment === segment);
}
