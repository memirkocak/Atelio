"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";

/** Bouton « Nouveau devis » (lit l'espace dans l'URL : à placer dans <Suspense>). */
export function NewQuoteLink({ clientId, variant = "default" }: { clientId?: string; variant?: "default" | "outline" }) {
  const { slug } = useParams<{ slug: string }>();
  const href = `/w/${slug}/devis/nouveau${clientId ? `?client=${clientId}` : ""}`;
  return (
    <Button asChild variant={variant}>
      <Link href={href}>
        <Plus aria-hidden />
        Nouveau devis
      </Link>
    </Button>
  );
}
