import { FileText, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { Button } from "@/components/ui/button";
import { listClientOptions } from "@/features/clients/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { QUOTES_PAGE_SIZE } from "../constants";
import { countQuotes, listQuotes } from "../queries";
import { parseQuoteListParams } from "../schemas";

import { QuotesTable } from "./quotes-table";
import { QuotesToolbar } from "./quotes-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

/** Contenu de la page Devis (données d'exécution : à placer dans <Suspense>). */
export async function QuotesSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const listParams = parseQuoteListParams(raw);
  const [workspaceTotal, clientOptions, { quotes, total, pageCount }] = await Promise.all([
    countQuotes(workspace.id),
    listClientOptions(workspace.id),
    listQuotes(workspace.id, listParams),
  ]);
  const baseUrl = `/w/${slug}/devis`;

  if (workspaceTotal === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun devis pour l’instant"
        description="Créez un devis pour un client : lignes de prestation, TVA et totaux calculés, PDF prêt à envoyer."
        action={
          <Button asChild>
            <Link href={`${baseUrl}/nouveau`}>
              <Plus aria-hidden />
              Créer votre premier devis
            </Link>
          </Button>
        }
      />
    );
  }

  const hrefForPage = (page: number) => {
    const qs = new URLSearchParams();
    if (listParams.q) qs.set("q", listParams.q);
    if (listParams.status) qs.set("status", listParams.status);
    if (listParams.client) qs.set("client", listParams.client);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `${baseUrl}?${s}` : baseUrl;
  };

  return (
    <div className="flex flex-col gap-4">
      <QuotesToolbar clientOptions={clientOptions} />
      {quotes.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun devis ne correspond"
          description="Modifiez votre recherche ou vos filtres."
          action={
            <Button asChild variant="outline">
              <Link href={baseUrl}>Réinitialiser les filtres</Link>
            </Button>
          }
        />
      ) : (
        <>
          <QuotesTable quotes={quotes} slug={slug} />
          <PaginationNav
            page={Math.min(listParams.page, pageCount)}
            pageCount={pageCount}
            total={total}
            pageSize={QUOTES_PAGE_SIZE}
            hrefForPage={hrefForPage}
            itemLabel={{ one: "devis", many: "devis" }}
          />
        </>
      )}
    </div>
  );
}
