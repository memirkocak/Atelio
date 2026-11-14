import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientDetailSection } from "@/features/clients/components/client-detail-section";

export const metadata: Metadata = { title: "Fiche client" };

export default function ClientPage({ params }: PageProps<"/w/[slug]/clients/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<ClientSkeleton />}>
        <ClientDetailSection params={params} />
      </Suspense>
    </PageContainer>
  );
}

function ClientSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-4 w-20" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-lg lg:col-span-2" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
