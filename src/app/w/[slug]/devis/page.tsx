import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewQuoteLink } from "@/features/quotes/components/new-quote-link";
import { QuotesSection } from "@/features/quotes/components/quotes-section";

export const metadata: Metadata = { title: "Devis" };

export default function QuotesPage({ params, searchParams }: PageProps<"/w/[slug]/devis">) {
  return (
    <PageContainer>
      <PageHeader
        title="Devis"
        description="Créez, envoyez et suivez vos devis."
        actions={
          <Suspense
            fallback={
              <Button disabled>
                <Plus aria-hidden />
                Nouveau devis
              </Button>
            }
          >
            <NewQuoteLink />
          </Suspense>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <QuotesSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}
