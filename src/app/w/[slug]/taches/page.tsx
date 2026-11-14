import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { NewTaskAction, NewTaskButtonFallback } from "@/features/tasks/components/new-task-action";
import { TasksSection } from "@/features/tasks/components/tasks-section";

export const metadata: Metadata = { title: "Tâches" };

export default function TasksPage({ params, searchParams }: PageProps<"/w/[slug]/taches">) {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Tâches"
        description="Organisez votre travail et repérez les tâches en retard."
        actions={
          <Suspense fallback={<NewTaskButtonFallback />}>
            <NewTaskAction params={params} />
          </Suspense>
        }
      />
      <Suspense fallback={<TasksSkeleton />}>
        <TasksSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="overflow-hidden rounded-lg border bg-background">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-3 py-3 last:border-0">
            <Skeleton className="size-[18px] rounded-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
