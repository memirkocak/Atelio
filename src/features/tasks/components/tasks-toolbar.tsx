"use client";

import { Eye, EyeOff, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  NO_PROJECT,
  TASK_DUE_FILTERS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskDueFilter,
  type TaskPriority,
  type TaskStatus,
} from "../constants";
import type { ProjectOption } from "../types";

const ALL = "all";

/** Recherche et filtres des tâches, synchronisés avec l'URL. */
export function TasksToolbar({ projectOptions }: { projectOptions: ProjectOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const status = searchParams.get("status") ?? ALL;
  const priority = searchParams.get("priority") ?? ALL;
  const project = searchParams.get("project") ?? ALL;
  const due = searchParams.get("due") ?? ALL;
  const showDone = searchParams.get("done") === "1";

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function onQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: value.trim() || null }), 300);
  }

  useEffect(() => () => clearTimeout(debounce.current), []);

  const projectLabel =
    project === ALL
      ? "Tous les projets"
      : project === NO_PROJECT
        ? "Sans projet"
        : (projectOptions.find((p) => p.id === project)?.label ?? "Projet");

  return (
    <div className={cn("flex flex-col gap-2", pending && "opacity-80 transition-opacity")} aria-busy={pending}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher une tâche…"
          aria-label="Rechercher une tâche"
          className="bg-background pr-9 pl-9"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
        <Select value={status} onValueChange={(v) => update({ status: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par statut" className="w-full bg-background lg:w-36">
            <SelectValue>{status === ALL ? "Tous les statuts" : TASK_STATUS_LABELS[status as TaskStatus]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(v) => update({ priority: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par priorité" className="w-full bg-background lg:w-40">
            <SelectValue>
              {priority === ALL ? "Toutes priorités" : TASK_PRIORITY_LABELS[priority as TaskPriority]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes priorités</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={project} onValueChange={(v) => update({ project: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par projet" className="w-full bg-background lg:w-48">
            <SelectValue>{projectLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les projets</SelectItem>
            <SelectItem value={NO_PROJECT}>Sans projet</SelectItem>
            {projectOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={due} onValueChange={(v) => update({ due: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par échéance" className="w-full bg-background lg:w-40">
            <SelectValue>{due === ALL ? "Toutes échéances" : TASK_DUE_FILTERS[due as TaskDueFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes échéances</SelectItem>
            {(Object.keys(TASK_DUE_FILTERS) as TaskDueFilter[]).map((d) => (
              <SelectItem key={d} value={d}>
                {TASK_DUE_FILTERS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          aria-pressed={showDone}
          onClick={() => update({ done: showDone ? null : "1" })}
          className={cn("col-span-2 bg-background lg:col-span-1 lg:ml-auto", showDone && "bg-accent text-foreground")}
        >
          {showDone ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          {showDone ? "Masquer les terminées" : "Afficher les terminées"}
        </Button>
      </div>
    </div>
  );
}
