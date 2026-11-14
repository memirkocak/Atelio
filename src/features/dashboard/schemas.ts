import { z } from "zod";

const count = z.number().int().nonnegative();
const amounts = z.object({
  count,
  subtotal_cents: z.number().int().nonnegative(),
  total_cents: z.number().int().nonnegative(),
});

/** Réponse de public.get_dashboard_stats (validée : la fonction renvoie du JSON non typé). */
export const dashboardStatsSchema = z.object({
  today: z.iso.date(),
  clients: count,
  projects_in_progress: count,
  tasks_open: count,
  tasks_overdue: count,
  revenue: amounts,
  pipeline: amounts,
  revenue_by_month: z.array(
    z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      subtotal_cents: z.number().int().nonnegative(),
      total_cents: z.number().int().nonnegative(),
    }),
  ),
  tasks_completed_by_week: z.array(z.object({ week_start: z.iso.date(), count })),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
