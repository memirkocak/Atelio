import { ArrowLeft, CalendarDays, CircleCheck, ListChecks, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { InfoItem, Panel, UpcomingNotice } from "@/components/shared/panel";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";
import { getEntityActivity } from "@/features/activity/queries";
import { listClientOptions } from "@/features/clients/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { formatIsoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/money";

import { PROJECT_FIELD_LABELS } from "../constants";
import { clientLabel, getProject } from "../queries";
import { toProjectFormInput } from "../schemas";

import { ProjectActions } from "./project-actions";
import { ProgressBar, ProjectDueDate, ProjectStatusBadge } from "./project-display";

/** Fiche projet (données d'exécution : à placer dans <Suspense>). */
export async function ProjectDetailSection({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const project = await getProject(workspace.id, id);
  if (!project) notFound();

  const [activity, clientOptions] = await Promise.all([
    getEntityActivity(workspace.id, "project", id),
    listClientOptions(workspace.id),
  ]);
  const client = clientLabel(project.client);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/w/${slug}/projets`}
        className="inline-flex w-fit items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Projets
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground">
            {project.client ? (
              <Link href={`/w/${slug}/clients/${project.client.id}`} className="text-info hover:underline">
                {client}
              </Link>
            ) : (
              "Sans client"
            )}
            {" · "}Créé le {formatDate(project.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ProjectActions
            slug={slug}
            projectId={project.id}
            projectName={project.name}
            defaultValues={toProjectFormInput(project)}
            clientOptions={clientOptions}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Informations">
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Users} label="Client">
                {client}
              </InfoItem>
              <InfoItem icon={Wallet} label="Budget (HT)">
                {project.budget_cents !== null ? (
                  <span className="tabular-nums">{formatCents(project.budget_cents)}</span>
                ) : null}
              </InfoItem>
              <InfoItem icon={CalendarDays} label="Début">
                {project.start_date ? formatIsoDate(project.start_date) : null}
              </InfoItem>
              <InfoItem icon={CalendarDays} label="Échéance">
                {project.due_date ? <ProjectDueDate project={project} /> : null}
              </InfoItem>
              {project.completed_at ? (
                <InfoItem icon={CircleCheck} label="Terminé le">
                  {formatDate(project.completed_at)}
                </InfoItem>
              ) : null}
              <InfoItem label="Avancement" className="sm:col-span-2">
                <ProgressBar value={project.progress} className="max-w-sm" />
              </InfoItem>
            </dl>
          </Panel>

          <Panel title="Description">
            {project.description ? (
              <p className="whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-muted-foreground">Aucune description.</p>
            )}
          </Panel>

          <Panel title="Tâches">
            <UpcomingNotice icon={ListChecks} text="Les tâches de ce projet apparaîtront ici avec le module Tâches." />
          </Panel>
        </div>

        <Panel title="Historique">
          <ActivityTimeline items={activity} fieldLabels={PROJECT_FIELD_LABELS} />
        </Panel>
      </div>
    </div>
  );
}
