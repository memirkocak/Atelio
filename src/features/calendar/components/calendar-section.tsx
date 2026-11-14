import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { listClientOptions } from "@/features/clients/queries";
import { listProjectOptions } from "@/features/tasks/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { todayIso } from "@/lib/dates";

import { calendarRange, itemsByDay } from "../grid";
import { getCalendarItems } from "../queries";
import { parseCalendarParams } from "../schemas";

import { CalendarBoard } from "./calendar-board";
import { CalendarToolbar } from "./calendar-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

/** Contenu de la page Calendrier (données d'exécution : à placer dans <Suspense>). */
export async function CalendarSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const today = todayIso();
  const calendarParams = parseCalendarParams(rawSearch, today);
  const range = calendarRange(calendarParams.view, calendarParams.date);
  const [items, clientOptions, projectOptions] = await Promise.all([
    getCalendarItems(workspace.id, slug, range, calendarParams.hidden),
    listClientOptions(workspace.id),
    listProjectOptions(workspace.id),
  ]);
  const baseUrl = `/w/${slug}/calendrier`;

  return (
    <CalendarBoard
      slug={slug}
      baseUrl={baseUrl}
      view={calendarParams.view}
      date={calendarParams.date}
      today={today}
      hidden={calendarParams.hidden}
      days={range.days}
      byDay={itemsByDay(items, range.days)}
      clientOptions={clientOptions}
      projectOptions={projectOptions}
      toolbar={<CalendarToolbar baseUrl={baseUrl} params={calendarParams} range={range} today={today} />}
    />
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-6 w-36" />
      </div>
      <Skeleton className="h-7 w-80" />
      <Skeleton className="h-[560px] w-full rounded-lg" />
    </div>
  );
}
