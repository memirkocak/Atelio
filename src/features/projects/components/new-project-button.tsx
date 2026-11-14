"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClientOption } from "@/features/clients/queries";

import { ProjectSheet } from "./project-sheet";

export function NewProjectButton({
  slug,
  clientOptions,
  defaultClientId,
  label = "Nouveau projet",
  variant = "default",
}: {
  slug: string;
  clientOptions: ClientOption[];
  defaultClientId?: string;
  label?: string;
  variant?: "default" | "outline";
}) {
  return (
    <ProjectSheet
      mode="create"
      slug={slug}
      clientOptions={clientOptions}
      defaultClientId={defaultClientId}
      trigger={
        <Button variant={variant}>
          <Plus aria-hidden />
          {label}
        </Button>
      }
    />
  );
}

export function NewProjectButtonFallback({ label = "Nouveau projet" }: { label?: string }) {
  return (
    <Button disabled>
      <Plus aria-hidden />
      {label}
    </Button>
  );
}
