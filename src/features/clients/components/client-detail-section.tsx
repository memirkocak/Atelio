import { ArrowLeft, FileText, FolderKanban, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

import { StatusBadge } from "@/components/shared/status-badge";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { formatDate } from "@/lib/format";

import { CLIENT_KIND_LABELS } from "../constants";
import { getClient, getClientActivity } from "../queries";
import { toClientFormInput } from "../schemas";

import { ClientActions } from "./client-actions";
import { ClientActivity } from "./client-activity";
import { ClientAvatar, clientDisplayName } from "./client-identity";

/** Fiche client (données d'exécution : à placer dans <Suspense>). */
export async function ClientDetailSection({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const client = await getClient(workspace.id, id);
  if (!client) notFound();
  const activity = await getClientActivity(workspace.id, id);

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
            defaultValues={toClientFormInput(client)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Coordonnées">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info icon={Mail} label="E-mail">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="text-info hover:underline">
                    {client.email}
                  </a>
                ) : null}
              </Info>
              <Info icon={Phone} label="Téléphone">
                {client.phone ? (
                  <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="text-info tabular-nums hover:underline">
                    {client.phone}
                  </a>
                ) : null}
              </Info>
              <Info icon={MapPin} label="Adresse" className="sm:col-span-2">
                {address ? <span className="whitespace-pre-line">{address}</span> : null}
              </Info>
            </dl>
          </Panel>

          <Panel title="Notes internes">
            {client.notes ? (
              <p className="whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-muted-foreground">Aucune note.</p>
            )}
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Projets">
              <Upcoming icon={FolderKanban} text="Les projets de ce client apparaîtront ici avec le module Projets." />
            </Panel>
            <Panel title="Devis">
              <Upcoming icon={FileText} text="Les devis de ce client apparaîtront ici avec le module Devis." />
            </Panel>
          </div>
        </div>

        <Panel title="Historique">
          <ClientActivity items={activity} />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-background p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof Mail;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd>{children ?? <span className="text-muted-foreground">Non renseigné</span>}</dd>
    </div>
  );
}

function Upcoming({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-start gap-3 text-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{text}</p>
    </div>
  );
}
