import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Tâche quotidienne (cron Vercel, vercel.json), protégée par CRON_SECRET :
 *  1. supprime les espaces de démonstration et les sessions anonymes de plus de 24 h ;
 *  2. ce faisant, sollicite la base (le projet Supabase gratuit n'est pas mis en pause).
 * Seul usage de la clé secrète en dehors des scripts : tâche d'administration, jamais
 * déclenchée par un utilisateur (DT-002, DT-036).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await createAdminClient().rpc("purge_demo_accounts", { p_max_age: "24 hours" });
  if (error) {
    console.error("[cron] purge_demo_accounts:", error.code ?? error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, purgedDemoAccounts: data });
}
