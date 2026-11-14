import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { Panel } from "@/components/shared/panel";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";
import { getEntityActivity } from "@/features/activity/queries";
import { getWorkspaceBySlug, getWorkspaceSettings } from "@/features/workspaces/queries";
import { formatDateTime } from "@/lib/format";

import { QUOTE_FIELD_LABELS } from "../constants";
import { quoteParties } from "../document";
import { getQuote } from "../queries";

import { QuoteActions } from "./quote-actions";
import { QuoteStatusBadge } from "./quote-display";
import { QuoteDocument } from "./quote-document";

/** Fiche devis : aperçu du document, actions, historique. À placer dans <Suspense>. */
export async function QuoteDetailSection({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const quote = await getQuote(workspace.id, id);
  if (!quote) notFound();
  const [settings, activity] = await Promise.all([
    getWorkspaceSettings(workspace.id),
    getEntityActivity(workspace.id, "quote", id),
  ]);
  const parties = quoteParties(quote, quote.client, settings);

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/w/${slug}/devis`} className="inline-flex w-fit items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Devis
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight tabular-nums">{quote.number}</h1>
            <QuoteStatusBadge quote={quote} />
          </div>
          <p className="text-muted-foreground">
            {quote.title}
            {" · "}
            <Link href={`/w/${slug}/clients/${quote.client.id}`} className="text-info hover:underline">
              {parties.client.name}
            </Link>
            {quote.project ? (
              <>
                {" · "}
                <Link href={`/w/${slug}/projets/${quote.project.id}`} className="text-info hover:underline">
                  {quote.project.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <QuoteActions slug={slug} quoteId={quote.id} number={quote.number} status={quote.status} />
      </div>

      {quote.status !== "draft" && quote.sent_at ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden />
          Devis figé depuis son envoi le {formatDateTime(quote.sent_at)} : les coordonnées affichées sont celles de cette date.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <QuoteDocument quote={quote} parties={parties} />
        <Panel title="Historique" className="h-fit">
          <ActivityTimeline items={activity} fieldLabels={QUOTE_FIELD_LABELS} />
        </Panel>
      </div>
    </div>
  );
}
