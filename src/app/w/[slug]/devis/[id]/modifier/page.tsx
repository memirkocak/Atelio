import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteEditorSection } from "@/features/quotes/components/quote-editor-section";

export const metadata: Metadata = { title: "Modifier le devis" };

export default function EditQuotePage({ params }: PageProps<"/w/[slug]/devis/[id]/modifier">) {
  return (
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-lg" />}>
        <QuoteEditorSection params={params} />
      </Suspense>
    </PageContainer>
  );
}
