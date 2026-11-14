import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/money";

import { clientLabel, type ProjectListItem } from "../types";

import { ProgressBar, ProjectDueDate, ProjectStatusBadge } from "./project-display";

const dash = <span className="text-muted-foreground">—</span>;

/** Vue tableau des projets : tableau sur ordinateur, cartes sur mobile. */
export function ProjectsTable({ projects, slug }: { projects: ProjectListItem[]; slug: string }) {
  const href = (id: string) => `/w/${slug}/projets/${id}`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Projet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Budget</TableHead>
              <TableHead className="w-40 pr-4">Avancement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id} className="relative">
                <TableCell className="max-w-72 pl-4">
                  <Link
                    href={href(p.id)}
                    className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {clientLabel(p.client) ?? "Sans client"}
                  </span>
                </TableCell>
                <TableCell>
                  <ProjectStatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <ProjectDueDate project={p} />
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {p.budget_cents !== null ? formatCents(p.budget_cents) : dash}
                </TableCell>
                <TableCell className="pr-4">
                  <ProgressBar value={p.progress} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y overflow-hidden rounded-lg border bg-background md:hidden">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={href(p.id)}
              className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{clientLabel(p.client) ?? "Sans client"}</span>
                  <ProjectDueDate project={p} className="text-xs" />
                </div>
                <ProgressBar value={p.progress} />
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
