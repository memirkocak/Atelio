import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { InfoItem, Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";
import { getEntityActivity } from "@/features/activity/queries";
import { NewProjectButton } from "@/features/projects/components/new-project-button";
import { ProjectDueDate, ProjectStatusBadge } from "@/features/projects/components/project-display";
import { listProjectsForClient } from "@/features/projects/queries";
import { NewQuoteLink } from "@/features/quotes/components/new-quote-link";
import { QuoteStatusBadge } from "@/features/quotes/components/quote-display";
import { listQuotesForClient } from "@/features/quotes/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { formatIsoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/money";

import { CLIENT_FIELD_LABELS, CLIENT_KIND_LABELS } from "../constants";
import { getClient, listClientOptions } from "../queries";
import { toClientFormInput } from "../schemas";

import { ClientActions } from "./client-actions";
import { ClientAvatar, clientDisplayName } from "./client-identity";

/** Fiche client (données d'exécution : à placer dans <Suspense>). */
export async function ClientDetailSection({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const client = await getClient(workspace.id, id);
  if (!client) notFound();
  const [activity, projects, clientOptions, quotes] = await Promise.all([
    getEntityActivity(workspace.id, "client", id),
    listProjectsForClient(workspace.id, id),
    listClientOptions(workspace.id),
    listQuotesForClient(workspace.id, id),
  ]);

  const name = clientDisplayName(client);
  const address = [client.address_line, [client.postal_code, client.city].filter(Boolean).join(" "), client.country]
    .filter((part) => part && part.trim())
    .join("\n");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/w/${slug}/clients`}
        className="inline-flex w-fit items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Clients
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ClientAvatar name={name} className="size-12 text-base" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
              <StatusBadge tone={client.kind === "company" ? "progress" : "neutral"}>
                {CLIENT_KIND_LABELS[client.kind]}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground">
              {client.kind === "company" ? `${client.contact_name} · ` : ""}
              Client depuis le {formatDate(client.created_at)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <ClientActions
            slug={slug}
            clientId={client.id}
            clientLabel={name}
            projectCount={projects.length}
            quoteCount={quotes.length}
            defaultValues={toClientFormInput(client)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Coordonnées">
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Mail} label="E-mail">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="text-info hover:underline">
                    {client.email}
                  </a>
                ) : null}
              </InfoItem>
              <InfoItem icon={Phone} label="Téléphone">
                {client.phone ? (
                  <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="text-info tabular-nums hover:underline">
                    {client.phone}
                  </a>
                ) : null}
              </InfoItem>
              <InfoItem icon={MapPin} label="Adresse" className="sm:col-span-2">
                {address ? <span className="whitespace-pre-line">{address}</span> : null}
              </InfoItem>
            </dl>
          </Panel>

          <Panel title="Notes internes">
            {client.notes ? (
              <p className="whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-muted-foreground">Aucune note.</p>
            )}
          </Panel>

          <Panel
            title={projects.length > 0 ? `Projets (${projects.length})` : "Projets"}
            action={
              <NewProjectButton
                slug={slug}
                clientOptions={clientOptions}
                defaultClientId={client.id}
                label="Nouveau projet"
                variant="outline"
              />
            }
          >
            {projects.length === 0 ? (
              <p className="text-muted-foreground">Aucun projet pour ce client.</p>
            ) : (
              <ul className="-mx-2 divide-y">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/w/${slug}/projets/${p.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md px-2 py-2.5 hover:bg-muted/50"
                    >
                      <span className="min-w-0 truncate font-medium">{p.name}</span>
                      <span className="flex items-center gap-3 text-xs">
                        <ProjectDueDate project={p} className="text-xs" />
                        <ProjectStatusBadge status={p.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={quotes.length > 0 ? `Devis (${quotes.length})` : "Devis"}
            action={<NewQuoteLink clientId={client.id} variant="outline" />}
          >
            {quotes.length === 0 ? (
              <p className="text-muted-foreground">Aucun devis pour ce client.</p>
            ) : (
              <ul className="-mx-2 divide-y">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/w/${slug}/devis/${q.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md px-2 py-2.5 hover:bg-muted/50"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium tabular-nums">{q.number}</span>
                        <span className="text-muted-foreground"> · {q.title}</span>
                      </span>
                      <span className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground tabular-nums">{formatIsoDate(q.issue_date)}</span>
                        <span className="font-medium tabular-nums">{formatCents(q.total_cents)}</span>
                        <QuoteStatusBadge quote={q} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Historique">
          <ActivityTimeline items={activity} fieldLabels={CLIENT_FIELD_LABELS} />
        </Panel>
      </div>
    </div>
  );
}
