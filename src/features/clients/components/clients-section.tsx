import { SearchX, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { Button } from "@/components/ui/button";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";

import { CLIENTS_PAGE_SIZE } from "../constants";
import { countClients, listClients } from "../queries";
import { parseClientListParams } from "../schemas";

import { ClientsList } from "./clients-list";
import { ClientsToolbar } from "./clients-toolbar";
import { NewClientButton, NewClientButtonFallback } from "./new-client-button";

type SearchParams = Record<string, string | string[] | undefined>;

/** Contenu de la page Clients (données d'exécution : à placer dans <Suspense>). */
export async function ClientsSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const listParams = parseClientListParams(rawSearch);
  const [{ clients, total, pageCount }, workspaceTotal] = await Promise.all([
    listClients(workspace.id, listParams),
    countClients(workspace.id),
  ]);

  if (workspaceTotal === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun client pour l’instant"
        description="Ajoutez vos clients pour retrouver leurs coordonnées, leurs projets et leurs devis au même endroit."
        action={
          <Suspense fallback={<NewClientButtonFallback label="Ajouter votre premier client" />}>
            <NewClientButton label="Ajouter votre premier client" />
          </Suspense>
        }
      />
    );
  }

  const baseUrl = `/w/${slug}/clients`;
  const hrefForPage = (page: number) => {
    const qs = new URLSearchParams();
    if (listParams.q) qs.set("q", listParams.q);
    if (listParams.type) qs.set("type", listParams.type);
    if (listParams.sort !== "recent") qs.set("sort", listParams.sort);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `${baseUrl}?${s}` : baseUrl;
  };

  return (
    <div className="flex flex-col gap-4">
      <ClientsToolbar />
      {clients.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun client ne correspond"
          description="Modifiez votre recherche ou vos filtres."
          action={
            <Button asChild variant="outline">
              <Link href={baseUrl}>Réinitialiser les filtres</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ClientsList clients={clients} slug={slug} />
          <PaginationNav
            page={Math.min(listParams.page, pageCount)}
            pageCount={pageCount}
            total={total}
            pageSize={CLIENTS_PAGE_SIZE}
            hrefForPage={hrefForPage}
            itemLabel={{ one: "client", many: "clients" }}
          />
        </>
      )}
    </div>
  );
}
