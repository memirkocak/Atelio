"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCents } from "@/lib/money";

import { formatCompactEuros, isEmptySeries, type RevenuePoint, type TasksPoint } from "../series";

const revenueConfig = {
  totalCents: { label: "Montant TTC", color: "var(--chart-1)" },
} satisfies ChartConfig;

const tasksConfig = {
  count: { label: "Tâches terminées", color: "var(--chart-2)" },
} satisfies ChartConfig;

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-muted-foreground">
      {children}
    </div>
  );
}

/** Chiffre d'affaires accepté par mois (date d'acceptation, heure de Paris). */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (isEmptySeries(data.map((d) => d.totalCents))) {
    return <EmptyChart>Aucun devis accepté sur les 6 derniers mois.</EmptyChart>;
  }
  return (
    <figure>
      <ChartContainer config={revenueConfig} className="h-56 w-full" aria-hidden>
        <BarChart data={data} margin={{ left: 4, right: 4 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatCompactEuros(v)}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => (payload[0]?.payload as RevenuePoint | undefined)?.fullLabel ?? ""}
                formatter={(value, _name, item) => {
                  const point = item.payload as RevenuePoint;
                  return (
                    <div className="flex w-full flex-col">
                      <span className="font-medium tabular-nums">{formatCents(Number(value))} TTC</span>
                      <span className="text-muted-foreground tabular-nums">{formatCents(point.subtotalCents)} HT</span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar dataKey="totalCents" fill="var(--color-totalCents)" radius={4} />
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">
        {data.map((d) => `${d.fullLabel} : ${formatCents(d.totalCents)} TTC`).join(" ; ")}
      </figcaption>
    </figure>
  );
}

/** Tâches terminées par semaine (lundi → dimanche). */
export function TasksChart({ data }: { data: TasksPoint[] }) {
  if (isEmptySeries(data.map((d) => d.count))) {
    return <EmptyChart>Aucune tâche terminée sur les 8 dernières semaines.</EmptyChart>;
  }
  return (
    <figure>
      <ChartContainer config={tasksConfig} className="h-56 w-full" aria-hidden>
        <BarChart data={data} margin={{ left: 4, right: 4 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => (payload[0]?.payload as TasksPoint | undefined)?.fullLabel ?? ""}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">
        {data.map((d) => `${d.fullLabel} : ${d.count} tâche${d.count > 1 ? "s" : ""}`).join(" ; ")}
      </figcaption>
    </figure>
  );
}
