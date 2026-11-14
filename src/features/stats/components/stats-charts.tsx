"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCompactEuros } from "@/features/dashboard/series";
import { formatCents } from "@/lib/money";

import type { DistributionPoint, TimePoint } from "../series";

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-60 items-center justify-center rounded-md border border-dashed px-4 text-center text-muted-foreground">
      {children}
    </div>
  );
}

const fullLabel = (_: unknown, payload: readonly { payload?: unknown }[]) =>
  (payload[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? "";

function TimeBars({
  data,
  config,
  keys,
  yFormatter,
  valueFormatter,
  summary,
}: {
  data: TimePoint[];
  config: ChartConfig;
  keys: (keyof TimePoint)[];
  yFormatter?: (v: number) => string;
  valueFormatter?: (v: number) => string;
  summary: string;
}) {
  return (
    <figure>
      <ChartContainer config={config} className="h-60 w-full" aria-hidden>
        <BarChart data={data} margin={{ left: 4, right: 4 }} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={yFormatter ? 64 : 32}
            allowDecimals={false}
            tickFormatter={yFormatter}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={fullLabel}
                formatter={
                  valueFormatter
                    ? (value, name) => (
                        <div className="flex w-full justify-between gap-4">
                          <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                          <span className="font-medium tabular-nums">{valueFormatter(Number(value))}</span>
                        </div>
                      )
                    : undefined
                }
              />
            }
          />
          {keys.length > 1 ? <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} /> : null}
          {keys.map((k) => (
            <Bar key={k} dataKey={k} name={String(config[k]?.label ?? k)} fill={`var(--color-${k})`} radius={3} />
          ))}
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

export function RevenueOverTime({ data }: { data: TimePoint[] }) {
  if (data.every((d) => d.acceptedSubtotalCents === 0)) {
    return <EmptyChart>Aucun devis accepté sur la période.</EmptyChart>;
  }
  return (
    <TimeBars
      data={data}
      config={{ acceptedSubtotalCents: { label: "CA accepté (HT)", color: "var(--chart-1)" } }}
      keys={["acceptedSubtotalCents"]}
      yFormatter={formatCompactEuros}
      valueFormatter={formatCents}
      summary={data.map((d) => `${d.fullLabel} : ${formatCents(d.acceptedSubtotalCents)} HT`).join(" ; ")}
    />
  );
}

export function QuotesOverTime({ data }: { data: TimePoint[] }) {
  if (data.every((d) => d.quotesCreated === 0 && d.quotesAccepted === 0)) {
    return <EmptyChart>Aucun devis créé ou accepté sur la période.</EmptyChart>;
  }
  return (
    <TimeBars
      data={data}
      config={{
        quotesCreated: { label: "Créés", color: "var(--chart-3)" },
        quotesAccepted: { label: "Acceptés", color: "var(--chart-1)" },
      }}
      keys={["quotesCreated", "quotesAccepted"]}
      summary={data.map((d) => `${d.fullLabel} : ${d.quotesCreated} créé(s), ${d.quotesAccepted} accepté(s)`).join(" ; ")}
    />
  );
}

export function CompletedOverTime({ data }: { data: TimePoint[] }) {
  if (data.every((d) => d.tasksCompleted === 0 && d.projectsCompleted === 0)) {
    return <EmptyChart>Aucune tâche ni aucun projet terminé sur la période.</EmptyChart>;
  }
  return (
    <TimeBars
      data={data}
      config={{
        tasksCompleted: { label: "Tâches", color: "var(--chart-2)" },
        projectsCompleted: { label: "Projets", color: "var(--chart-4)" },
      }}
      keys={["tasksCompleted", "projectsCompleted"]}
      summary={data
        .map((d) => `${d.fullLabel} : ${d.tasksCompleted} tâche(s), ${d.projectsCompleted} projet(s)`)
        .join(" ; ")}
    />
  );
}

/** Répartition (barres horizontales), ex. tâches par statut. */
export function DistributionBars({
  data,
  color,
  emptyLabel,
  seriesLabel,
}: {
  data: DistributionPoint[];
  color: string;
  emptyLabel: string;
  seriesLabel: string;
}) {
  if (data.every((d) => d.count === 0)) return <EmptyChart>{emptyLabel}</EmptyChart>;
  const config = { count: { label: seriesLabel, color } } satisfies ChartConfig;
  return (
    <figure>
      <ChartContainer config={config} className="w-full" style={{ height: 40 + data.length * 36 }} aria-hidden>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }} accessibilityLayer>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" width={96} tickLine={false} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={3} barSize={18} />
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">{data.map((d) => `${d.label} : ${d.count}`).join(" ; ")}</figcaption>
    </figure>
  );
}
