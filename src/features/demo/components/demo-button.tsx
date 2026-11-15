"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { startDemoAction } from "../actions";

/** Bouton « Essayer la démo » : ouvre un espace de démonstration privé, sans inscription. */
export function DemoButton({
  className,
  size = "lg",
  variant = "secondary",
}: {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await startDemoAction();
        if (result && !result.ok) setError(result.error);
      } catch (e) {
        // La redirection vers l'espace de démo est propagée par Next.js
        if (typeof e === "object" && e && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError("La démo est momentanément indisponible. Réessayez dans un instant.");
      }
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button type="button" size={size} variant={variant} onClick={start} disabled={pending} aria-busy={pending}>
        <Sparkles aria-hidden />
        {pending ? "Préparation de la démo…" : "Essayer la démo"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
