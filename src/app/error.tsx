"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-destructive">Erreur</p>
        <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
        <p className="text-muted-foreground">
          Le contenu n’a pas pu être affiché. Réessayez ; si le problème persiste, rechargez la page.
        </p>
        <Button className="mt-3" onClick={() => retry()}>
          Réessayer
        </Button>
      </div>
    </main>
  );
}
