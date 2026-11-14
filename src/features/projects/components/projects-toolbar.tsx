"use client";

import { Columns3, Search, Table2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientOption } from "@/features/clients/queries";
import { cn } from "@/lib/utils";

import {
  PROJECT_SORTS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectSort,
  type ProjectView,
} from "../constants";

const ALL = "all";

/** Recherche, filtres, tri et vue (tableau / Kanban), synchronisés avec l'URL. */
export function ProjectsToolbar({ clientOptions }: { clientOptions: ClientOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const view: ProjectView = searchParams.get("view") === "kanban" ? "kanban" : "tableau";
  const status = searchParams.get("status") ?? ALL;
  const client = searchParams.get("client") ?? ALL;
  const sort = (searchParams.get("sort") as ProjectSort | null) ?? "due";

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

  return (
    <div
      className={cn("flex flex-col gap-2 lg:flex-row lg:items-center", pending && "opacity-80 transition-opacity")}
      aria-busy={pending}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher un projet…"
          aria-label="Rechercher un projet"
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

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {view === "tableau" ? (
          <Select value={status} onValueChange={(v) => update({ status: v === ALL ? null : v })}>
            <SelectTrigger aria-label="Filtrer par statut" className="w-full bg-background sm:w-40">
              {/* Libellé fourni : évite un champ vide avant l'hydratation */}
              <SelectValue>
                {status === ALL ? "Tous les statuts" : PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select value={client} onValueChange={(v) => update({ client: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par client" className="w-full bg-background sm:w-44">
            <SelectValue>
              {client === ALL ? "Tous les clients" : (clientOptions.find((c) => c.id === client)?.label ?? "Client")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les clients</SelectItem>
            {clientOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {view === "tableau" ? (
          <Select value={sort} onValueChange={(v) => update({ sort: v === "due" ? null : v })}>
            <SelectTrigger aria-label="Trier" className="w-full bg-background sm:w-52">
              <SelectValue>{PROJECT_SORTS[sort] ?? PROJECT_SORTS.due}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROJECT_SORTS) as ProjectSort[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {PROJECT_SORTS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div role="radiogroup" aria-label="Affichage" className="col-span-2 flex rounded-md border bg-background p-0.5 sm:col-span-1">
          {(
            [
              { value: "tableau", label: "Tableau", icon: Table2 },
              { value: "kanban", label: "Kanban", icon: Columns3 },
            ] as const
          ).map(({ value, label, icon: Icon }) => {
            const checked = view === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => update({ view: value === "tableau" ? null : value, status: null, sort: null })}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  checked ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4", checked && "text-primary")} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
