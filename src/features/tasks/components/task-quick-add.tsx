"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { quickAddTaskAction } from "../actions";

/**
 * Ajout rapide : taper un titre puis Entrée. Le champ garde le focus pour enchaîner.
 * `projectId` rattache directement la tâche (fiche projet).
 */
export function TaskQuickAdd({
  slug,
  projectId,
  placeholder = "Ajouter une tâche… (Entrée pour valider)",
  className,
}: {
  slug: string;
  projectId?: string;
  placeholder?: string;
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const value = title.trim();
    if (!value || pending) return;
    startTransition(async () => {
      const result = await quickAddTaskAction(slug, { title: value, projectId: projectId ?? "" });
      if (!result.ok) {
        toast.error(result.fieldErrors?.title?.[0] ?? result.error);
        return;
      }
      setTitle("");
      inputRef.current?.focus();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dashed bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
        className,
      )}
    >
      {pending ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setTitle("")}
        maxLength={200}
        placeholder={placeholder}
        aria-label="Nouvelle tâche"
        className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}
