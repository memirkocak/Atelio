import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatsSection, StatsSkeleton } from "@/features/stats/components/stats-section";

export const metadata: Metadata = { title: "Statistiques" };

export default function StatsPage({ params, searchParams }: PageProps<"/w/[slug]/statistiques">) {
  return (
    <PageContainer>
      <PageHeader title="Statistiques" description="Évolution de votre activité, calculée sur vos données réelles." />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}
