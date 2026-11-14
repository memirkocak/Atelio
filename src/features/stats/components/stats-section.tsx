import Link from "next/link";
import { notFound } from "next/navigation";

import { workspaceHref } from "@/components/layout/navigation";
import { Panel } from "@/components/shared/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { formatIsoDate, todayIso } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import { DEFAULT_PERIOD, STATS_PERIODS, parsePeriodParam, resolvePeriod, type StatsPeriodKey } from "../periods";
import { getStatistics } from "../queries";
import type { Statistics } from "../schemas";
import {
  projectStatusDistribution,
  taskPriorityDistribution,
  taskStatusDistribution,
  timeSeries,
} from "../series";

import { CompletedOverTime, DistributionBars, QuotesOverTime, RevenueOverTime } from "./stats-charts";
import { StatsKpis } from "./stats-kpis";

type SearchParams = Record<string, string | string[] | undefined>;

function PeriodPicker({ slug, current }: { slug: string; current: StatsPeriodKey }) {
  const base = workspaceHref(slug, "statistiques");
  return (
    <nav aria-label="Période" className="flex flex-wrap gap-1.5">
      {(Object.keys(STATS_PERIODS) as StatsPeriodKey[]).map((key) => (
        <Link
          key={key}
          href={key === DEFAULT_PERIOD ? base : `${base}?periode=${key}`}
          aria-current={key === current ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
            key === current && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
          )}
        >
          {STATS_PERIODS[key]}
        </Link>
      ))}
    </nav>
  );
}

function TopClients({ slug, clients }: { slug: string; clients: Statistics["top_clients"] }) {
  if (clients.length === 0) {
    return <p className="text-muted-foreground">Aucun devis accepté sur la période.</p>;
  }
  return (
    <ol className="-mx-2 divide-y" aria-label="Meilleurs clients">
      {clients.map((c, i) => (
        <li key={c.id}>
          <Link
            href={`${workspaceHref(slug, "clients")}/${c.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
          >
            <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
            <span className="text-xs text-muted-foreground">
              {c.quotes} devis
            </span>
            <span className="font-medium tabular-nums">{formatCents(c.subtotal_cents)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Contenu de la page Statistiques (données d'exécution : à placer dans <Suspense>). */
export async function StatsSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const period = resolvePeriod(parsePeriodParam(rawSearch), todayIso());
  const [current, previous] = await Promise.all([
    getStatistics(workspace.id, period.from, period.to),
    getStatistics(workspace.id, period.previousFrom, period.previousTo),
  ]);
  const series = timeSeries(current);
  const unit = current.granularity === "week" ? "par semaine" : "par mois";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <PeriodPicker slug={slug} current={period.key} />
        <p className="text-xs text-muted-foreground">
          Du {formatIsoDate(period.from)} au {formatIsoDate(period.to)} · comparaison : du{" "}
          {formatIsoDate(period.previousFrom)} au {formatIsoDate(period.previousTo)}
        </p>
      </div>

      <StatsKpis current={current} previous={previous} period={period} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Chiffre d’affaires accepté ${unit} (HT)`} className="min-w-0">
          <RevenueOverTime data={series} />
        </Panel>
        <Panel title={`Devis créés et acceptés ${unit}`} className="min-w-0">
          <QuotesOverTime data={series} />
        </Panel>
        <Panel title={`Tâches et projets terminés ${unit}`} className="min-w-0">
          <CompletedOverTime data={series} />
        </Panel>
        <Panel title="Meilleurs clients (CA accepté HT)" className="min-w-0">
          <TopClients slug={slug} clients={current.top_clients} />
        </Panel>
      </div>

      <section aria-label="État actuel" className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">
            État actuel
          </h2>
          <p className="text-muted-foreground">Indépendant de la période choisie.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Tâches par statut" className="min-w-0">
            <DistributionBars
              data={taskStatusDistribution(current)}
              color="var(--chart-2)"
              seriesLabel="Tâches"
              emptyLabel="Aucune tâche."
            />
          </Panel>
          <Panel title="Tâches à faire par priorité" className="min-w-0">
            <DistributionBars
              data={taskPriorityDistribution(current)}
              color="var(--chart-3)"
              seriesLabel="Tâches"
              emptyLabel="Aucune tâche à faire."
            />
          </Panel>
          <Panel title="Projets par statut" className="min-w-0">
            <DistributionBars
              data={projectStatusDistribution(current)}
              color="var(--chart-4)"
              seriesLabel="Projets"
              emptyLabel="Aucun projet."
            />
          </Panel>
        </div>
      </section>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-8 w-full max-w-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
