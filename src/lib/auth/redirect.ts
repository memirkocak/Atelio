/** Page d'arrivée après connexion (phase 3 ; remplacée par l'espace de travail en phase 4). */
export const DEFAULT_AFTER_LOGIN = "/demarrage";

const BASE = "http://atelio.invalid";

/**
 * Valide un paramètre `next` pour éviter les redirections ouvertes :
 * seul un chemin interne au site est accepté, sinon `fallback`.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_AFTER_LOGIN,
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
