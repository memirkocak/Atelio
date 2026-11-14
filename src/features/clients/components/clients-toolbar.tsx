"use client";

import { Search, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { CLIENT_KIND_LABELS, CLIENT_SORTS, type ClientKind, type ClientSort } from "../constants";

const ALL = "all";

/**
 * Recherche, filtre et tri, synchronisés avec l'URL (?q=&type=&sort=).
 * Toute modification ramène à la page 1. La saisie est temporisée (300 ms).
 */
export function ClientsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const type = searchParams.get("type") ?? ALL;
  const sort = (searchParams.get("sort") as ClientSort | null) ?? "recent";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        pending && "opacity-80 transition-opacity",
      )}
      aria-busy={pending}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher un nom, une entreprise, un e-mail, une ville…"
          aria-label="Rechercher un client"
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

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select value={type} onValueChange={(v) => update({ type: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par type" className="w-full bg-background sm:w-40">
            {/* Libellé fourni : évite un champ vide avant l'hydratation */}
            <SelectValue>
              {type === ALL ? "Tous les types" : CLIENT_KIND_LABELS[type as ClientKind]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les types</SelectItem>
            {(Object.keys(CLIENT_KIND_LABELS) as ClientKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {CLIENT_KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => update({ sort: v === "recent" ? null : v })}>
          <SelectTrigger aria-label="Trier" className="w-full bg-background sm:w-44">
            <SelectValue>{CLIENT_SORTS[sort] ?? CLIENT_SORTS.recent}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CLIENT_SORTS) as ClientSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {CLIENT_SORTS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
