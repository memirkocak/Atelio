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

import { QUOTE_DISPLAY_STATUSES, QUOTE_STATUS_LABELS, type QuoteDisplayStatus } from "../constants";

const ALL = "all";

/** Recherche (numéro, objet) et filtres (statut, client), synchronisés avec l'URL. */
export function QuotesToolbar({ clientOptions }: { clientOptions: { id: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const status = searchParams.get("status") ?? ALL;
  const client = searchParams.get("client") ?? ALL;

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
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", pending && "opacity-80")} aria-busy={pending}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher un numéro ou un objet…"
          aria-label="Rechercher un devis"
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
        <Select value={status} onValueChange={(v) => update({ status: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par statut" className="w-full bg-background sm:w-40">
            <SelectValue>{status === ALL ? "Tous les statuts" : QUOTE_STATUS_LABELS[status as QuoteDisplayStatus]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {QUOTE_DISPLAY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {QUOTE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={client} onValueChange={(v) => update({ client: v === ALL ? null : v })}>
          <SelectTrigger aria-label="Filtrer par client" className="w-full bg-background sm:w-48">
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
      </div>
    </div>
  );
}
