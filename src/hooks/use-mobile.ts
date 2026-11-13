import { useMediaQuery } from "./use-media-query";

const MOBILE_BREAKPOINT = 768;

// Réécrit (version shadcn : setState dans un effet, refusé par react-hooks).
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
