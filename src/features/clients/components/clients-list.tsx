import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

import { CLIENT_KIND_LABELS } from "../constants";
import type { ClientListItem } from "../queries";

import { ClientAvatar, clientDisplayName } from "./client-identity";

const dash = <span className="text-muted-foreground">—</span>;

/** Liste des clients : tableau sur ordinateur, cartes sur mobile. */
export function ClientsList({ clients, slug }: { clients: ClientListItem[]; slug: string }) {
  const href = (id: string) => `/w/${slug}/clients/${id}`;

  return (
    <>
      {/* Ordinateur et tablette */}
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
              <TableHead className="hidden lg:table-cell">Ville</TableHead>
              <TableHead className="pr-4 text-right">Ajouté le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => {
              const name = clientDisplayName(c);
              return (
                <TableRow key={c.id} className="group relative">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={name} />
                      <div className="min-w-0">
                        {/* Le lien couvre toute la ligne (after:absolute) */}
                        <Link
                          href={href(c.id)}
                          className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                        >
                          {name}
                        </Link>
                        {c.kind === "company" ? (
                          <span className="block truncate text-xs text-muted-foreground">{c.contact_name}</span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={c.kind === "company" ? "progress" : "neutral"}>
                      {CLIENT_KIND_LABELS[c.kind]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate">{c.email ?? dash}</TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">{c.phone ?? dash}</TableCell>
                  <TableCell className="hidden lg:table-cell">{c.city ?? dash}</TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                    {formatDate(c.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="divide-y overflow-hidden rounded-lg border bg-background md:hidden">
        {clients.map((c) => {
          const name = clientDisplayName(c);
          return (
            <li key={c.id}>
              <Link
                href={href(c.id)}
                className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <ClientAvatar name={name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[c.kind === "company" ? c.contact_name : null, c.email, c.city].filter(Boolean).join(" · ") ||
                      CLIENT_KIND_LABELS[c.kind]}
                  </span>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
