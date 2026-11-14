import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientsSection } from "@/features/clients/components/clients-section";
import {
  NewClientButton,
  NewClientButtonFallback,
} from "@/features/clients/components/new-client-button";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ params, searchParams }: PageProps<"/w/[slug]/clients">) {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Vos clients, leurs coordonnées et leur historique."
        actions={
          <Suspense fallback={<NewClientButtonFallback />}>
            <NewClientButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsSection params={params} searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

function ClientsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-9 w-full" />
      <div className="overflow-hidden rounded-lg border bg-background">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
