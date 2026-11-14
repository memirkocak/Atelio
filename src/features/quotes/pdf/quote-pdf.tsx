import "server-only";

import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import { formatIsoDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

import { formatVatRate } from "../calculations";
import { VAT_EXEMPT_MENTION } from "../constants";
import type { quoteParties } from "../document";
import type { QuoteDetail } from "../queries";
import { quantityToInput } from "../schemas";
import type { PartyDetails } from "../types";
import { vatBreakdownFromItems } from "../vat";

/*
 * PDF du devis (@react-pdf/renderer, DT-009). Police Helvetica intégrée au générateur :
 * jeu de caractères WinAnsi (accents, €, ’). L'espace fine insécable (U+202F) produite par
 * Intl fr-FR n'y figure pas : elle est remplacée par une espace insécable (U+00A0).
 */
const t = (value: string) => value.replace(/ /g, " ");

// Pas de césure automatique (règles anglaises par défaut : « con-tact ») : retour à la ligne entre les mots.
Font.registerHyphenationCallback((word) => [word]);
const money = (cents: number) => t(formatCents(cents));

const INDIGO = "#4f46e5";
const MUTED = "#5b6170";
const BORDER = "#e3e6ed";

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 64, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, color: "#1e2330", lineHeight: 1.4 },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { width: 26, height: 26, borderRadius: 5, backgroundColor: INDIGO, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13, textAlign: "center", paddingTop: 5, marginBottom: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: MUTED },
  title: { fontFamily: "Helvetica-Bold", fontSize: 20, textAlign: "right" },
  number: { fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "right", marginTop: 2 },
  right: { textAlign: "right" },
  label: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  clientBox: { backgroundColor: "#f5f6f9", borderRadius: 4, padding: 12, width: "48%" },
  table: { marginTop: 22 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 5, color: MUTED, fontSize: 8 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 7 },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 62, textAlign: "right" },
  cPrice: { width: 72, textAlign: "right" },
  cVat: { width: 44, textAlign: "right" },
  cTotal: { width: 78, textAlign: "right" },
  totals: { marginTop: 14, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1e2330", marginTop: 4, paddingTop: 6, fontFamily: "Helvetica-Bold", fontSize: 11 },
  section: { marginTop: 22 },
  signature: { marginTop: 22, marginLeft: "auto", width: "48%", borderWidth: 1, borderStyle: "dashed", borderColor: "#b8bdc9", borderRadius: 4, padding: 10, height: 92 },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, fontSize: 7.5, color: MUTED, textAlign: "center", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6 },
  draft: { position: "absolute", top: 18, right: 44, fontSize: 8, color: MUTED, borderWidth: 1, borderColor: "#b8bdc9", borderStyle: "dashed", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
});

function Party({ party, legal = false, align = "left" }: { party: PartyDetails; legal?: boolean; align?: "left" | "right" }) {
  const style = align === "right" ? s.right : {};
  return (
    <View>
      <Text style={[s.bold, style]}>{t(party.name)}</Text>
      {party.secondary ? <Text style={[s.muted, style]}>{t(party.secondary)}</Text> : null}
      {party.lines.map((l) => (
        <Text key={l} style={[s.muted, style]}>
          {t(l)}
        </Text>
      ))}
      {party.email ? <Text style={[s.muted, style]}>{party.email}</Text> : null}
      {party.phone ? <Text style={[s.muted, style]}>{t(party.phone)}</Text> : null}
      {legal && party.siret ? <Text style={[s.muted, style]}>SIRET {party.siret}</Text> : null}
      {legal && party.vatNumber ? <Text style={[s.muted, style]}>TVA {party.vatNumber}</Text> : null}
    </View>
  );
}

function QuotePdf({ quote, parties }: { quote: QuoteDetail; parties: ReturnType<typeof quoteParties> }) {
  const exempt = quote.vat_exempt;
  const breakdown = vatBreakdownFromItems(quote.items);
  const footer = [parties.footer, exempt ? VAT_EXEMPT_MENTION : null].filter(Boolean).join(" — ");

  return (
    <Document title={`Devis ${quote.number}`} author={parties.issuer.name} creator="Atelio" producer="Atelio" language="fr-FR">
      <Page size="A4" style={s.page}>
        {quote.status === "draft" ? <Text style={s.draft} fixed>BROUILLON</Text> : null}

        <View style={s.header}>
          <View style={{ width: "55%" }}>
            <Text style={s.brand}>{(parties.issuer.name[0] ?? "A").toUpperCase()}</Text>
            <Party party={parties.issuer} legal />
          </View>
          <View>
            <Text style={s.title}>Devis</Text>
            <Text style={s.number}>{quote.number}</Text>
            <Text style={[s.muted, s.right, { marginTop: 6 }]}>Date : {t(formatIsoDate(quote.issue_date))}</Text>
            <Text style={[s.muted, s.right]}>Valable jusqu’au : {t(formatIsoDate(quote.valid_until))}</Text>
          </View>
        </View>

        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View style={{ width: "48%" }}>
            <Text style={s.label}>Objet</Text>
            <Text style={s.bold}>{t(quote.title)}</Text>
          </View>
          <View style={s.clientBox}>
            <Text style={s.label}>Client</Text>
            <Party party={parties.client} />
          </View>
        </View>

        <View style={s.table}>
          <View style={s.th} fixed>
            <Text style={s.cDesc}>Désignation</Text>
            <Text style={s.cQty}>Qté</Text>
            <Text style={s.cPrice}>PU HT</Text>
            {!exempt ? <Text style={s.cVat}>TVA</Text> : null}
            <Text style={s.cTotal}>Total HT</Text>
          </View>
          {quote.items.map((item) => (
            <View key={item.id} style={s.tr} wrap={false}>
              <View style={s.cDesc}>
                <Text style={s.bold}>{t(item.label)}</Text>
                {item.description ? <Text style={s.muted}>{t(item.description)}</Text> : null}
              </View>
              <Text style={s.cQty}>
                {quantityToInput(item.quantity)}
                {item.unit ? ` ${t(item.unit)}` : ""}
              </Text>
              <Text style={s.cPrice}>{money(item.unit_price_cents)}</Text>
              {!exempt ? <Text style={s.cVat}>{t(formatVatRate(item.vat_rate_bp))}</Text> : null}
              <Text style={s.cTotal}>{money(item.line_subtotal_cents)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Total HT</Text>
            <Text>{money(quote.subtotal_cents)}</Text>
          </View>
          {exempt ? (
            <View style={s.totalRow}>
              <Text style={s.muted}>TVA</Text>
              <Text>{money(0)}</Text>
            </View>
          ) : (
            breakdown.map((b) => (
              <View key={b.rateBp} style={s.totalRow}>
                <Text style={s.muted}>
                  TVA {t(formatVatRate(b.rateBp))} (base {money(b.baseCents)})
                </Text>
                <Text>{money(b.vatCents)}</Text>
              </View>
            ))
          )}
          <View style={s.grandTotal}>
            <Text>Total TTC</Text>
            <Text>{money(quote.total_cents)}</Text>
          </View>
          {exempt ? <Text style={[s.muted, s.right, { fontSize: 8, marginTop: 4 }]}>{VAT_EXEMPT_MENTION}</Text> : null}
        </View>

        {quote.terms ? (
          <View style={s.section} wrap={false}>
            <Text style={s.label}>Conditions</Text>
            <Text>{t(quote.terms)}</Text>
          </View>
        ) : null}

        <View style={s.signature} wrap={false}>
          <Text style={s.bold}>Bon pour accord</Text>
          <Text style={[s.muted, { fontSize: 8 }]}>Date, signature et mention « Bon pour accord »</Text>
        </View>

        <View style={s.footer} fixed>
          {footer ? <Text>{t(footer)}</Text> : null}
          <Text render={({ pageNumber, totalPages }) => `${quote.number} — page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Génère le PDF du devis (Buffer). */
export async function renderQuotePdf(quote: QuoteDetail, parties: ReturnType<typeof quoteParties>) {
  return renderToBuffer(<QuotePdf quote={quote} parties={parties} />);
}
