import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProjectAction } from "@/features/projects/components/new-project-action";
import { NewProjectButtonFallback } from "@/features/projects/components/new-project-button";
import { ProjectsSection } from "@/features/projects/components/projects-section";

export const metadata: Metadata = { title: "Projets" };

export default function ProjectsPage({ params, searchParams }: PageProps<"/w/[slug]/projets">) {
  return (
    <PageContainer className="max-w-7xl">
      <PageHeader
        title="Projets"
        description="Suivez vos projets, leurs échéances et leur avancement."
        actions={
          <Suspense fallback={<NewProjectButtonFallback />}>
            <NewProjectAction params={params} />
          </Suspense>
        }
      />
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-9 w-full" />
      <div className="overflow-hidden rounded-lg border bg-background">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="ml-auto h-2 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
