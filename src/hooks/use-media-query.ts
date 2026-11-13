import { useSyncExternalStore } from "react";

/**
 * Suit une media query CSS. Côté serveur (et au premier rendu), renvoie
 * `serverValue` ; la vraie valeur est appliquée dès l'hydratation.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
