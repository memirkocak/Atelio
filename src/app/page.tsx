import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  ListChecks,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Brand } from "@/components/layout/brand";

// Version simple (phase 2). Version finale avec captures et accès démo en phase 12.

const modules: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "Clients",
    description: "Coordonnées, notes internes, historique des projets et des devis.",
  },
  {
    icon: FolderKanban,
    title: "Projets",
    description: "Budget, échéances, statut et avancement, en tableau ou en Kanban.",
  },
  {
    icon: ListChecks,
    title: "Tâches",
    description: "Priorités, échéances et repérage immédiat des tâches en retard.",
  },
  {
    icon: FileText,
    title: "Devis",
    description: "Lignes de prestation, TVA, totaux calculés et PDF professionnel.",
  },
  {
    icon: CalendarDays,
    title: "Calendrier",
    description: "Rendez-vous, échéances et dates clés réunis dans une seule vue.",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    description: "Évolution des devis, de l’activité et des indicateurs commerciaux.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6">
          <Brand />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 md:px-6 md:pt-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              En cours de développement
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Toute votre activité, au même endroit.
            </h1>
            <p className="mt-5 text-base text-pretty text-muted-foreground md:text-lg">
              Atelio réunit vos clients, projets, tâches, devis et rendez-vous dans une interface
              claire, pensée pour les indépendants, les TPE et les agences.
            </p>
          </div>
        </section>

        <section aria-labelledby="modules" className="border-t bg-canvas">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
            <h2 id="modules" className="text-sm font-medium text-muted-foreground">
              Les modules d’Atelio
            </h2>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {modules.map(({ icon: Icon, title, description }) => (
                <li key={title} className="bg-background p-6">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-muted-foreground">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between md:px-6">
          <span>© 2026 Atelio</span>
          <span>Projet en cours de développement</span>
        </div>
      </footer>
    </div>
  );
}
