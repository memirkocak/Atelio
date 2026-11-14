import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSection, DashboardSkeleton } from "@/features/dashboard/components/dashboard-section";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage({ params }: PageProps<"/w/[slug]/tableau-de-bord">) {
  return (
    <PageContainer>
      <PageHeader title="Tableau de bord" description="Vue d’ensemble de votre activité." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSection params={params} />
      </Suspense>
    </PageContainer>
  );
}
