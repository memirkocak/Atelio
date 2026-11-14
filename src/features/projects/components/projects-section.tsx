import { FolderKanban, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { Button } from "@/components/ui/button";
import { listClientOptions } from "@/features/clients/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { PROJECTS_KANBAN_LIMIT, PROJECTS_PAGE_SIZE } from "../constants";
import { countProjects, listProjects, listProjectsForBoard } from "../queries";
import { parseProjectListParams, type ProjectListParams } from "../schemas";

import { NewProjectButton } from "./new-project-button";
import { ProjectsBoard } from "./projects-board";
import { ProjectsTable } from "./projects-table";
import { ProjectsToolbar } from "./projects-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

/** Contenu de la page Projets (données d'exécution : à placer dans <Suspense>). */
export async function ProjectsSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const listParams = parseProjectListParams(rawSearch);
  const [workspaceTotal, clientOptions] = await Promise.all([
    countProjects(workspace.id),
    listClientOptions(workspace.id),
  ]);

  if (workspaceTotal === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucun projet pour l’instant"
        description="Créez un projet pour suivre son budget, ses échéances et son avancement, en tableau ou en Kanban."
        action={<NewProjectButton slug={slug} clientOptions={clientOptions} label="Créer votre premier projet" />}
      />
    );
  }

  const baseUrl = `/w/${slug}/projets`;
  const noResult = (
    <EmptyState
      icon={SearchX}
      title="Aucun projet ne correspond"
      description="Modifiez votre recherche ou vos filtres."
      action={
        <Button asChild variant="outline">
          <Link href={listParams.view === "kanban" ? `${baseUrl}?view=kanban` : baseUrl}>Réinitialiser les filtres</Link>
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <ProjectsToolbar clientOptions={clientOptions} />
      {listParams.view === "kanban" ? (
        <BoardView workspaceId={workspace.id} slug={slug} listParams={listParams} empty={noResult} />
      ) : (
        <TableView workspaceId={workspace.id} slug={slug} listParams={listParams} empty={noResult} baseUrl={baseUrl} />
      )}
    </div>
  );
}

async function TableView({
  workspaceId,
  slug,
  listParams,
  empty,
  baseUrl,
}: {
  workspaceId: string;
  slug: string;
  listParams: ProjectListParams;
  empty: React.ReactNode;
  baseUrl: string;
}) {
  const { projects, total, pageCount } = await listProjects(workspaceId, listParams);
  if (projects.length === 0) return empty;

  const hrefForPage = (page: number) => {
    const qs = new URLSearchParams();
    if (listParams.q) qs.set("q", listParams.q);
    if (listParams.status) qs.set("status", listParams.status);
    if (listParams.client) qs.set("client", listParams.client);
    if (listParams.sort !== "due") qs.set("sort", listParams.sort);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `${baseUrl}?${s}` : baseUrl;
  };

  return (
    <>
      <ProjectsTable projects={projects} slug={slug} />
      <PaginationNav
        page={Math.min(listParams.page, pageCount)}
        pageCount={pageCount}
        total={total}
        pageSize={PROJECTS_PAGE_SIZE}
        hrefForPage={hrefForPage}
        itemLabel={{ one: "projet", many: "projets" }}
      />
    </>
  );
}

async function BoardView({
  workspaceId,
  slug,
  listParams,
  empty,
}: {
  workspaceId: string;
  slug: string;
  listParams: ProjectListParams;
  empty: React.ReactNode;
}) {
  const projects = await listProjectsForBoard(workspaceId, listParams);
  if (projects.length === 0 && (listParams.q || listParams.client)) return empty;
  return (
    <>
      <ProjectsBoard projects={projects} slug={slug} />
      {projects.length >= PROJECTS_KANBAN_LIMIT ? (
        <p className="text-xs text-muted-foreground">
          Affichage limité à {PROJECTS_KANBAN_LIMIT} projets : utilisez la recherche ou les filtres.
        </p>
      ) : null}
    </>
  );
}
