import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIsoDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

import { clientRefLabel, type QuoteListItem } from "../types";

import { QuoteStatusBadge } from "./quote-display";

/** Liste des devis : tableau sur ordinateur, cartes sur mobile. */
export function QuotesTable({ quotes, slug }: { quotes: QuoteListItem[]; slug: string }) {
  const href = (id: string) => `/w/${slug}/devis/${id}`;
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Numéro</TableHead>
              <TableHead>Client / objet</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="pr-4 text-right">Total TTC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id} className="relative">
                <TableCell className="pl-4 font-medium tabular-nums">
                  <Link href={href(q.id)} className="outline-none after:absolute after:inset-0 focus-visible:underline">
                    {q.number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-80">
                  <span className="block truncate">{clientRefLabel(q.client)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{q.title}</span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatIsoDate(q.issue_date)}</TableCell>
                <TableCell>
                  <QuoteStatusBadge quote={q} />
                </TableCell>
                <TableCell className="pr-4 text-right font-medium tabular-nums">{formatCents(q.total_cents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y overflow-hidden rounded-lg border bg-background md:hidden">
        {quotes.map((q) => (
          <li key={q.id}>
            <Link href={href(q.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium tabular-nums">{q.number}</span>
                  <QuoteStatusBadge quote={q} />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {clientRefLabel(q.client)} · {q.title}
                  </span>
                  <span className="shrink-0 font-medium text-foreground tabular-nums">{formatCents(q.total_cents)}</span>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
