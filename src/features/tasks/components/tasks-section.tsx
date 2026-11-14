import { CircleCheckBig, ListChecks, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { Button } from "@/components/ui/button";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { TASKS_PAGE_SIZE } from "../constants";
import { getTaskCounts, listProjectOptions, listTasks } from "../queries";
import { includesDone, parseTaskListParams } from "../schemas";

import { TaskList } from "./task-list";
import { TaskQuickAdd } from "./task-quick-add";
import { TasksToolbar } from "./tasks-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

/** Contenu de la page Tâches (données d'exécution : à placer dans <Suspense>). */
export async function TasksSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const listParams = parseTaskListParams(rawSearch);
  const [counts, projectOptions, { tasks, total, pageCount }] = await Promise.all([
    getTaskCounts(workspace.id),
    listProjectOptions(workspace.id),
    listTasks(workspace.id, listParams),
  ]);

  const baseUrl = `/w/${slug}/taches`;
  const filtered = Boolean(
    listParams.q || listParams.status || listParams.priority || listParams.project || listParams.due,
  );

  const hrefForPage = (page: number) => {
    const qs = new URLSearchParams();
    for (const key of ["q", "status", "priority", "project", "due", "done"] as const) {
      const value = listParams[key];
      if (value) qs.set(key, value);
    }
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `${baseUrl}?${s}` : baseUrl;
  };

  return (
    <div className="flex flex-col gap-4">
      {counts.total > 0 ? (
        <p className="text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">{counts.open}</span>{" "}
          {counts.open > 1 ? "tâches à terminer" : "tâche à terminer"}
          {counts.overdue > 0 ? (
            <>
              {" · "}
              <Link href={`${baseUrl}?due=overdue`} className="font-medium text-status-danger-foreground hover:underline">
                {counts.overdue} en retard
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <TaskQuickAdd slug={slug} />

      {counts.total === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Aucune tâche pour l’instant"
          description="Ajoutez une tâche ci-dessus : un titre suffit, vous pourrez préciser le projet, la priorité et l’échéance ensuite."
        />
      ) : (
        <>
          <TasksToolbar projectOptions={projectOptions} />
          {tasks.length === 0 ? (
            filtered || includesDone(listParams) ? (
              <EmptyState
                icon={SearchX}
                title="Aucune tâche ne correspond"
                description="Modifiez votre recherche ou vos filtres."
                action={
                  <Button asChild variant="outline">
                    <Link href={baseUrl}>Réinitialiser les filtres</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={CircleCheckBig}
                title="Tout est terminé"
                description="Aucune tâche en cours. Affichez les tâches terminées pour les retrouver."
              />
            )
          ) : (
            <>
              <TaskList tasks={tasks} slug={slug} projectOptions={projectOptions} />
              <PaginationNav
                page={Math.min(listParams.page, pageCount)}
                pageCount={pageCount}
                total={total}
                pageSize={TASKS_PAGE_SIZE}
                hrefForPage={hrefForPage}
                itemLabel={{ one: "tâche", many: "tâches" }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
