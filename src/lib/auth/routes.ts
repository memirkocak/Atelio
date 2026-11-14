/** Routes réservées aux utilisateurs connectés. */
export function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/demarrage" ||
    pathname.startsWith("/w/") ||
    pathname === "/reinitialiser-mot-de-passe"
  );
}

/** Pages d'authentification inutiles une fois connecté. */
export function isGuestOnlyPath(pathname: string): boolean {
  return ["/connexion", "/inscription", "/mot-de-passe-oublie"].includes(pathname);
}
