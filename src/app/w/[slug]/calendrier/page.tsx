import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarSection, CalendarSkeleton } from "@/features/calendar/components/calendar-section";

export const metadata: Metadata = { title: "Calendrier" };

export default function CalendarPage({ params, searchParams }: PageProps<"/w/[slug]/calendrier">) {
  return (
    <PageContainer>
      <PageHeader title="Calendrier" description="Rendez-vous, échéances et dates importantes (heure de Paris)." />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}
