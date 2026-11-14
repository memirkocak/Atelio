import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteDetailSection } from "@/features/quotes/components/quote-detail-section";

export const metadata: Metadata = { title: "Devis" };

export default function QuotePage({ params }: PageProps<"/w/[slug]/devis/[id]">) {
  return (
    <PageContainer className="max-w-7xl">
      <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-lg" />}>
        <QuoteDetailSection params={params} />
      </Suspense>
    </PageContainer>
  );
}
