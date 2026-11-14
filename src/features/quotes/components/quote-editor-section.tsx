import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { listClientOptions } from "@/features/clients/queries";
import { listProjectOptions } from "@/features/tasks/queries";
import { getWorkspaceBySlug, getWorkspaceSettings } from "@/features/workspaces/queries";
import { todayIso } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import { addDaysIso } from "@/features/tasks/status";

import { getQuote } from "../queries";
import { emptyQuoteItem, toQuoteFormInput, type QuoteFormInput } from "../schemas";

import { QuoteEditor } from "./quote-editor";

/**
 * Chargement de l'éditeur : création (quoteId absent) ou modification d'un brouillon.
 * Données d'exécution : à placer dans <Suspense>.
 */
export async function QuoteEditorSection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id?: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug, id }, search] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const [settings, clientOptions, projectOptions] = await Promise.all([
    getWorkspaceSettings(workspace.id),
    listClientOptions(workspace.id),
    listProjectOptions(workspace.id),
  ]);

  const header = (title: string, back: string) => (
    <div className="space-y-3">
      <Link href={back} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {id ? "Retour au devis" : "Devis"}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </div>
  );

  // Modification d'un brouillon existant
  if (id) {
    if (!z.uuid().safeParse(id).success) notFound();
    const quote = await getQuote(workspace.id, id);
    if (!quote) notFound();
    if (quote.status !== "draft") redirect(`/w/${slug}/devis/${id}`);
    return (
      <div className="flex flex-col gap-6">
        {header(`Modifier ${quote.number}`, `/w/${slug}/devis/${id}`)}
        <QuoteEditor
          slug={slug}
          quoteId={quote.id}
          number={quote.number}
          defaultValues={toQuoteFormInput(quote, centsToInput)}
          clientOptions={clientOptions}
          projectOptions={projectOptions}
          vatExempt={settings.vat_exempt}
          defaultVatRateBp={settings.default_vat_rate_bp}
        />
      </div>
    );
  }

  if (clientOptions.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header("Nouveau devis", `/w/${slug}/devis`)}
        <EmptyState
          icon={Users}
          title="Ajoutez d’abord un client"
          description="Un devis est toujours adressé à un client de votre espace."
          action={
            <Button asChild>
              <Link href={`/w/${slug}/clients`}>Aller aux clients</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const requestedClient = first((search as Record<string, string | string[] | undefined>).client);
  const today = todayIso();
  const defaults: QuoteFormInput = {
    clientId: clientOptions.some((c) => c.id === requestedClient) ? requestedClient! : "",
    projectId: "",
    title: "",
    issueDate: today,
    validUntil: addDaysIso(today, settings.quote_validity_days),
    terms: settings.quote_terms ?? "",
    items: [emptyQuoteItem(settings.vat_exempt ? 0 : settings.default_vat_rate_bp)],
  };

  return (
    <div className="flex flex-col gap-6">
      {header("Nouveau devis", `/w/${slug}/devis`)}
      <QuoteEditor
        slug={slug}
        quoteId={null}
        number={null}
        defaultValues={defaults}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        vatExempt={settings.vat_exempt}
        defaultVatRateBp={settings.default_vat_rate_bp}
      />
    </div>
  );
}
