import { FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";

import { leaveDemoForSignUpAction } from "../actions";

/**
 * Bandeau permanent de l'espace de démonstration (données fictives).
 * Collant sous la barre du haut (h-14) : il reste visible pendant le défilement.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Mode démo"
      className="sticky top-14 z-[9] flex items-center justify-between gap-3 border-b border-status-warning bg-status-warning px-4 py-1.5 text-sm text-status-warning-foreground md:px-6"
    >
      <p className="flex min-w-0 items-center gap-2">
        <FlaskConical className="size-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Mode démo</strong>
          <span> — données fictives</span>
          <span className="hidden sm:inline">, visibles par vous seul et effacées automatiquement sous 24 h</span>.
        </span>
      </p>
      <form action={leaveDemoForSignUpAction} className="shrink-0">
        <Button type="submit" size="sm" variant="outline" className="h-7 bg-background/70">
          Créer un compte
        </Button>
      </form>
    </div>
  );
}
