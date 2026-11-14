import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import {
  acceptanceRate,
  averageBasket,
  pointsDifference,
  variation,
  type ResolvedPeriod,
  type Variation,
} from "../periods";
import type { Statistics } from "../schemas";
import { formatPercent } from "../series";

function Trend({ value, comparisonLabel }: { value: Variation; comparisonLabel: string }) {
  let text: string;
  let tone = "text-muted-foreground";
  let Icon: typeof ArrowUpRight | null = null;
  switch (value.kind) {
    case "none":
      text = "Aucune donnée à comparer";
      break;
    case "new":
      text = "Nouveau : 0 sur la période de comparaison";
      tone = "text-status-success-foreground";
      break;
    case "flat":
      text = `Stable ${comparisonLabel}`;
      break;
    default:
      text = `${value.kind === "up" ? "+" : "−"}${value.percent} % ${comparisonLabel}`;
      tone = value.kind === "up" ? "text-status-success-foreground" : "text-status-danger-foreground";
      Icon = value.kind === "up" ? ArrowUpRight : ArrowDownRight;
  }
  return (
    <p className={cn("flex items-center gap-1 text-xs", tone)}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
      {text}
    </p>
  );
}

function Kpi({ label, value, detail, children }: { label: string; value: string; detail?: string; children: React.ReactNode }) {
  return (
    <article aria-label={label} className="flex flex-col gap-1.5 rounded-lg border bg-background p-5">
      <h3 className="text-muted-foreground">{label}</h3>
      <p className="text-2xl font-semibold tracking-tight tabular-nums" data-testid="kpi-value">
        {value}
      </p>
      {detail ? <p className="text-xs text-muted-foreground tabular-nums">{detail}</p> : null}
      {children}
    </article>
  );
}

/** Indicateurs de la période, comparés à la période précédente. */
export function StatsKpis({
  current,
  previous,
  period,
}: {
  current: Statistics;
  previous: Statistics;
  period: ResolvedPeriod;
}) {
  const cmp = period.comparisonLabel;
  const rate = acceptanceRate(current);
  const previousRate = acceptanceRate(previous);
  const points = pointsDifference(rate, previousRate);
  const basket = averageBasket(current);
  const decided = current.accepted.count + current.refused + current.expired;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Chiffre d’affaires suivi (HT)"
        value={formatCents(current.accepted.subtotal_cents)}
        detail={`${formatCents(current.accepted.total_cents)} TTC`}
      >
        <Trend value={variation(current.accepted.subtotal_cents, previous.accepted.subtotal_cents)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi
        label="Taux d’acceptation"
        value={rate === null ? "—" : formatPercent(rate)}
        detail={
          decided === 0
            ? "Aucun devis accepté, refusé ou expiré"
            : `${current.accepted.count} accepté${current.accepted.count > 1 ? "s" : ""} sur ${decided} (refusés et expirés inclus)`
        }
      >
        <p className={cn("text-xs", points === null || points === 0 ? "text-muted-foreground" : points > 0 ? "text-status-success-foreground" : "text-status-danger-foreground")}>
          {points === null ? "Aucune donnée à comparer" : points === 0 ? `Stable ${cmp}` : `${points > 0 ? "+" : "−"}${Math.abs(points)} pt${Math.abs(points) > 1 ? "s" : ""} ${cmp}`}
        </p>
      </Kpi>

      <Kpi label="Panier moyen (HT)" value={basket === null ? "—" : formatCents(basket)} detail="Par devis accepté">
        <Trend value={variation(basket ?? 0, averageBasket(previous) ?? 0)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi label="Devis créés" value={String(current.quotes_created)} detail="Par date d’émission">
        <Trend value={variation(current.quotes_created, previous.quotes_created)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi label="Devis acceptés" value={String(current.accepted.count)}>
        <Trend value={variation(current.accepted.count, previous.accepted.count)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi label="Projets terminés" value={String(current.projects_completed)}>
        <Trend value={variation(current.projects_completed, previous.projects_completed)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi label="Tâches terminées" value={String(current.tasks_completed)}>
        <Trend value={variation(current.tasks_completed, previous.tasks_completed)} comparisonLabel={cmp} />
      </Kpi>

      <Kpi label="Actions enregistrées" value={String(current.activity_count)} detail="Créations, modifications, suppressions">
        <Trend value={variation(current.activity_count, previous.activity_count)} comparisonLabel={cmp} />
      </Kpi>
    </div>
  );
}
