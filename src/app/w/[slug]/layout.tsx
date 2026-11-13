import { AppShell } from "@/components/layout/app-shell";

// Phase 2 : coquille sans authentification (local uniquement).
// Le contrôle de session et d'appartenance à l'espace arrive en phases 3 et 4.
// Avec cacheComponents, `params` n'est pas lu ici : la sidebar lit l'espace via useParams().
export default function WorkspaceLayout({ children }: LayoutProps<"/w/[slug]">) {
  return <AppShell>{children}</AppShell>;
}
