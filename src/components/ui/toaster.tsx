"use client";

import { Toaster as Sonner } from "sonner";

/** Notifications (sonner), thème clair uniquement (DT-017) : pas de dépendance à next-themes. */
export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-background !text-foreground !shadow-md",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
