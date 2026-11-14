import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { quoteParties } from "@/features/quotes/document";
import { renderQuotePdf } from "@/features/quotes/pdf/quote-pdf";
import { getQuote } from "@/features/quotes/queries";
import { getWorkspaceBySlug, getWorkspaceSettings } from "@/features/workspaces/queries";
import { getCurrentUser } from "@/lib/auth/session";

/*
 * Le rendu PDF utilise des API Node (Buffer, polices) : runtime Node.js, celui par défaut
 * (l'option `runtime` n'est pas autorisée avec cacheComponents).
 */

/**
 * Téléchargement du PDF d'un devis. Accès vérifié comme pour les pages :
 * session + appartenance à l'espace (RLS) ; 404 identique si le devis est introuvable ou inaccessible.
 */
export async function GET(_request: NextRequest, { params }: RouteContext<"/w/[slug]/devis/[id]/pdf">) {
  const { slug, id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Non authentifié", { status: 401 });
  if (!z.uuid().safeParse(id).success) return new NextResponse("Devis introuvable", { status: 404 });

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) return new NextResponse("Devis introuvable", { status: 404 });
  const quote = await getQuote(workspace.id, id);
  if (!quote) return new NextResponse("Devis introuvable", { status: 404 });

  const settings = await getWorkspaceSettings(workspace.id);
  const pdf = await renderQuotePdf(quote, quoteParties(quote, quote.client, settings));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
