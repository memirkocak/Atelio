import {
  Briefcase,
  CircleCheckBig,
  FileClock,
  FileText,
  ListTodo,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { workspaceHref } from "@/components/layout/navigation";
import { formatCents } from "@/lib/money";

import type { DashboardStats } from "../schemas";

function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className="relative flex flex-col gap-2 rounded-lg border bg-background p-5 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Le lien couvre toute la carte (pseudo-élément) ; les liens secondaires passent au-dessus. */}
        <Link href={href} className="text-muted-foreground outline-none after:absolute after:inset-0 after:rounded-lg">
          {label}
        </Link>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums" data-testid="kpi-value">
        {value}
      </p>
      {children ? <div className="text-xs text-muted-foreground">{children}</div> : null}
    </article>
  );
}

/** Cartes d'indicateurs ; chacune renvoie vers la liste filtrée correspondante. */
export function KpiCards({ slug, stats }: { slug: string; stats: DashboardStats }) {
  const href = (segment: string, query = "") => `${workspaceHref(slug, segment)}${query}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard label="Clients" value={String(stats.clients)} href={href("clients")} icon={Users} />

      <KpiCard
        label="Projets en cours"
        value={String(stats.projects_in_progress)}
        href={href("projets", "?status=in_progress")}
        icon={Briefcase}
      />

      <KpiCard label="Tâches à terminer" value={String(stats.tasks_open)} href={href("taches")} icon={ListTodo}>
        {stats.tasks_overdue > 0 ? (
          <Link
            href={href("taches", "?due=overdue")}
            className="relative z-10 font-medium text-destructive hover:underline"
          >
            dont {plural(stats.tasks_overdue, "en retard", "en retard")}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1">
            <CircleCheckBig className="size-3.5 text-status-success-foreground" aria-hidden />
            Aucune tâche en retard
          </span>
        )}
      </KpiCard>

      <KpiCard
        label="Devis en attente"
        value={String(stats.pipeline.count)}
        href={href("devis", "?status=sent")}
        icon={FileClock}
      >
        Envoyés, en cours de validité
      </KpiCard>

      <KpiCard
        label="Chiffre d’affaires suivi"
        value={formatCents(stats.revenue.total_cents)}
        href={href("devis", "?status=accepted")}
        icon={TrendingUp}
      >
        <span className="tabular-nums">{formatCents(stats.revenue.subtotal_cents)} HT</span> ·{" "}
        {plural(stats.revenue.count, "devis accepté", "devis acceptés")}
      </KpiCard>

      <KpiCard
        label="Pipeline"
        value={formatCents(stats.pipeline.total_cents)}
        href={href("devis", "?status=sent")}
        icon={FileText}
      >
        <span className="tabular-nums">{formatCents(stats.pipeline.subtotal_cents)} HT</span> · devis envoyés non
        expirés
      </KpiCard>
    </div>
  );
}
