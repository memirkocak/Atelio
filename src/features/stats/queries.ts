import "server-only";

import { createClient } from "@/lib/supabase/server";

import { statisticsSchema, type Statistics } from "./schemas";

/** Statistiques d'une période (jours de Paris, bornes incluses), calculées et filtrées par la base. */
export async function getStatistics(workspaceId: string, from: string, to: string): Promise<Statistics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_statistics", {
    p_workspace_id: workspaceId,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return statisticsSchema.parse(data);
}
