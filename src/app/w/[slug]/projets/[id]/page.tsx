import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetailSection } from "@/features/projects/components/project-detail-section";

export const metadata: Metadata = { title: "Projet" };

export default function ProjectPage({ params }: PageProps<"/w/[slug]/projets/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectDetailSection params={params} />
      </Suspense>
    </PageContainer>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-4 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-lg lg:col-span-2" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}
