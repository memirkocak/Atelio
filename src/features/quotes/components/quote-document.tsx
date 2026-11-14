import { formatIsoDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import { formatVatRate } from "../calculations";
import { VAT_EXEMPT_MENTION } from "../constants";
import type { quoteParties } from "../document";
import type { QuoteDetail } from "../queries";
import { quantityToInput } from "../schemas";
import type { PartyDetails } from "../types";
import { vatBreakdownFromItems } from "../vat";

type Parties = ReturnType<typeof quoteParties>;

/**
 * Aperçu HTML du devis, fidèle au PDF (mêmes données, mêmes montants enregistrés).
 */
export function QuoteDocument({ quote, parties }: { quote: QuoteDetail; parties: Parties }) {
  const breakdown = vatBreakdownFromItems(quote.items);
  const exempt = quote.vat_exempt;

  return (
    <article
      aria-label={`Aperçu du devis ${quote.number}`}
      className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-xs sm:p-10"
    >
      {quote.status === "draft" ? (
        <span className="absolute top-4 right-4 rounded-md border border-dashed px-2 py-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Brouillon
        </span>
      ) : null}

      <header className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <Party party={parties.issuer} showLegal />
        <div className="sm:text-right">
          <p className="text-2xl font-semibold tracking-tight">Devis</p>
          <p className="font-medium tabular-nums">{quote.number}</p>
          <dl className="mt-2 space-y-0.5 text-muted-foreground">
            <div>
              <dt className="inline">Date : </dt>
              <dd className="inline tabular-nums">{formatIsoDate(quote.issue_date)}</dd>
            </div>
            <div>
              <dt className="inline">Valable jusqu’au : </dt>
              <dd className="inline tabular-nums">{formatIsoDate(quote.valid_until)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Objet</p>
          <p className="font-medium">{quote.title}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-4">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Client</p>
          <Party party={parties.client} />
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Désignation</th>
              <th className="py-2 pr-3 text-right font-medium">Qté</th>
              <th className="py-2 pr-3 text-right font-medium">PU HT</th>
              {!exempt ? <th className="py-2 pr-3 text-right font-medium">TVA</th> : null}
              <th className="py-2 text-right font-medium">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b align-top last:border-0">
                <td className="py-3 pr-3">
                  <p className="font-medium">{item.label}</p>
                  {item.description ? (
                    <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{item.description}</p>
                  ) : null}
                </td>
                <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">
                  {quantityToInput(item.quantity)}
                  {item.unit ? ` ${item.unit}` : ""}
                </td>
                <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">{formatCents(item.unit_price_cents)}</td>
                {!exempt ? (
                  <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums">{formatVatRate(item.vat_rate_bp)}</td>
                ) : null}
                <td className="py-3 text-right whitespace-nowrap tabular-nums">{formatCents(item.line_subtotal_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Total HT" value={formatCents(quote.subtotal_cents)} />
          {exempt ? (
            <Row label="TVA" value={formatCents(0)} />
          ) : (
            breakdown.map((b) => (
              <Row
                key={b.rateBp}
                label={`TVA ${formatVatRate(b.rateBp)} (base ${formatCents(b.baseCents)})`}
                value={formatCents(b.vatCents)}
              />
            ))
          )}
          <Row label="Total TTC" value={formatCents(quote.total_cents)} strong />
        </dl>
      </div>
      {exempt ? <p className="mt-2 text-right text-xs text-muted-foreground">{VAT_EXEMPT_MENTION}</p> : null}

      {quote.terms ? (
        <section className="mt-8">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Conditions</p>
          <p className="whitespace-pre-line">{quote.terms}</p>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-md border border-dashed p-4 text-muted-foreground sm:col-start-2">
          <p className="font-medium text-foreground">Bon pour accord</p>
          <p className="mt-1 text-xs">Date, signature et mention « Bon pour accord »</p>
          <div className="h-16" />
        </div>
      </section>

      {parties.footer ? (
        <footer className="mt-8 border-t pt-4 text-center text-xs whitespace-pre-line text-muted-foreground">
          {parties.footer}
        </footer>
      ) : null}
    </article>
  );
}

function Party({ party, showLegal = false }: { party: PartyDetails; showLegal?: boolean }) {
  return (
    <address className="space-y-0.5 not-italic">
      <p className="font-semibold">{party.name}</p>
      {party.secondary ? <p className="text-muted-foreground">{party.secondary}</p> : null}
      {party.lines.map((l) => (
        <p key={l} className="text-muted-foreground">
          {l}
        </p>
      ))}
      {party.email ? <p className="text-muted-foreground">{party.email}</p> : null}
      {party.phone ? <p className="text-muted-foreground">{party.phone}</p> : null}
      {showLegal && party.siret ? <p className="text-muted-foreground">SIRET {party.siret}</p> : null}
      {showLegal && party.vatNumber ? <p className="text-muted-foreground">TVA {party.vatNumber}</p> : null}
    </address>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "border-t pt-2 text-base font-semibold")}>
      <dt className={cn(!strong && "text-muted-foreground")}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
