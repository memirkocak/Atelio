import { notFound } from "next/navigation";

import { Panel } from "@/components/shared/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { getDashboardStats, getRecentActivity } from "../queries";
import { revenueSeries, tasksSeries } from "../series";

import { RevenueChart, TasksChart } from "./dashboard-charts";
import { KpiCards } from "./kpi-cards";
import { RecentActivity } from "./recent-activity";

/** Contenu du tableau de bord (données d'exécution : à placer dans <Suspense>). */
export async function DashboardSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const [stats, activity] = await Promise.all([getDashboardStats(workspace.id), getRecentActivity(workspace.id)]);

  return (
    <div className="flex flex-col gap-6">
      <KpiCards slug={slug} stats={stats} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Panel title="Chiffre d’affaires accepté par mois (TTC)">
            <RevenueChart data={revenueSeries(stats)} />
          </Panel>
          <Panel title="Tâches terminées par semaine">
            <TasksChart data={tasksSeries(stats)} />
          </Panel>
        </div>
        <Panel title="Activité récente" className="min-w-0">
          <RecentActivity slug={slug} items={activity} />
        </Panel>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-background p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
