"use client";

import { Plus } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import { ClientSheet } from "./client-sheet";

/** Bouton « Ajouter un client ». Lit l'espace dans l'URL : à placer dans <Suspense>. */
export function NewClientButton({ label = "Ajouter un client" }: { label?: string }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <ClientSheet
      mode="create"
      slug={slug}
      trigger={
        <Button>
          <Plus aria-hidden />
          {label}
        </Button>
      }
    />
  );
}

export function NewClientButtonFallback({ label = "Ajouter un client" }: { label?: string }) {
  return (
    <Button disabled>
      <Plus aria-hidden />
      {label}
    </Button>
  );
}
