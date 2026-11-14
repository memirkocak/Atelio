import { z } from "zod";

const count = z.number().int().nonnegative();
const cents = z.number().int().nonnegative();
const counts = z.record(z.string(), count);

/** Réponse de public.get_statistics (validée : la fonction renvoie du JSON non typé). */
export const statisticsSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  granularity: z.enum(["week", "month"]),
  quotes_created: count,
  accepted: z.object({ count, subtotal_cents: cents, total_cents: cents }),
  refused: count,
  expired: count,
  projects_completed: count,
  tasks_completed: count,
  activity_count: count,
  series: z.array(
    z.object({
      start: z.iso.date(),
      quotes_created: count,
      quotes_accepted: count,
      accepted_subtotal_cents: cents,
      tasks_completed: count,
      projects_completed: count,
    }),
  ),
  tasks_by_status: counts,
  open_tasks_by_priority: counts,
  projects_by_status: counts,
  top_clients: z.array(
    z.object({ id: z.uuid(), name: z.string(), quotes: count, subtotal_cents: cents }),
  ),
});

export type Statistics = z.infer<typeof statisticsSchema>;
