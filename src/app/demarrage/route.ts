import { NextResponse, type NextRequest } from "next/server";

import { getDefaultWorkspace } from "@/features/workspaces/queries";
import { DEFAULT_WORKSPACE_SEGMENT, workspaceHref } from "@/components/layout/navigation";
import { NO_WORKSPACE_PATH } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée HTTP « après connexion » (redirections du proxy et des liens reçus par e-mail) :
 * redirige vers l'espace de l'utilisateur. Les Server Actions, elles, redirigent directement
 * vers l'espace (une redirection d'action vers un Route Handler n'est pas suivie par le routeur).
 *
 * Session valide mais aucun espace (compte supprimé dont le jeton n'a pas encore expiré,
 * anomalie) : la session est fermée AVANT de rediriger vers /connexion, sinon le proxy
 * renverrait l'utilisateur connecté vers /demarrage → boucle de redirection infinie.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const workspace = await getDefaultWorkspace(userId, supabase);
  if (!workspace) {
    console.error("[demarrage] aucun espace pour l'utilisateur", userId);
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL(NO_WORKSPACE_PATH, request.url));
  }

  return NextResponse.redirect(new URL(workspaceHref(workspace.slug, DEFAULT_WORKSPACE_SEGMENT), request.url));
}
