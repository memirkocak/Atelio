import { NextResponse, type NextRequest } from "next/server";

import { getHomePath } from "@/features/workspaces/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée HTTP « après connexion » (redirections du proxy et des liens reçus par e-mail) :
 * redirige vers l'espace de l'utilisateur. Les Server Actions, elles, redirigent directement
 * vers l'espace (une redirection d'action vers un Route Handler n'est pas suivie par le routeur).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const destination = userId ? await getHomePath(userId) : "/connexion";
  return NextResponse.redirect(new URL(destination, request.url));
}
