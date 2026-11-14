import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteEditorSection } from "@/features/quotes/components/quote-editor-section";

export const metadata: Metadata = { title: "Nouveau devis" };

export default function NewQuotePage({ params, searchParams }: PageProps<"/w/[slug]/devis/nouveau">) {
  return (
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-lg" />}>
        <QuoteEditorSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}
