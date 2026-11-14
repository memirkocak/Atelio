import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/redirect";
import { isGuestOnlyPath, isProtectedPath } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * 1. Rafraîchit la session Supabase à chaque requête.
 * 2. Redirige selon l'état de connexion (confort de navigation).
 * La vraie autorisation reste vérifiée côté serveur et par la RLS.
 */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (isAuthenticated && isGuestOnlyPath(pathname)) {
    return redirectWithCookies(new URL(DEFAULT_AFTER_LOGIN, request.url), response);
  }

  return response;
}

/** Redirige en conservant les cookies de session éventuellement rafraîchis. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques, les images optimisées et les fichiers publics
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
