import type { StatusTone } from "@/components/shared/status-badge";
import type { Database } from "@/types/database.types";

export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
/** Statut affiché : « expired » est dérivé (envoyé + validité dépassée), jamais stocké. */
export type QuoteDisplayStatus = QuoteStatus | "expired";

export const QUOTE_STATUSES: readonly QuoteStatus[] = ["draft", "sent", "accepted", "refused"];
export const QUOTE_DISPLAY_STATUSES: readonly QuoteDisplayStatus[] = ["draft", "sent", "expired", "accepted", "refused"];

export const QUOTE_STATUS_LABELS: Record<QuoteDisplayStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  expired: "Expiré",
  accepted: "Accepté",
  refused: "Refusé",
};

export const QUOTE_STATUS_TONES: Record<QuoteDisplayStatus, StatusTone> = {
  draft: "neutral",
  sent: "info",
  expired: "warning",
  accepted: "success",
  refused: "danger",
};

/** Taux de TVA proposés (points de base). */
export const VAT_RATES: readonly number[] = [2000, 1000, 550, 210, 0];

export const QUOTE_UNITS = ["heure", "jour", "unité", "forfait", "mois", "page"] as const;

export const QUOTES_PAGE_SIZE = 25;
export const QUOTE_MAX_ITEMS = 100;
/** Garde-fous applicatifs (plus stricts que la base) : montants sûrs en JavaScript. */
export const MAX_UNIT_PRICE_CENTS = 1_000_000_000; // 10 000 000 €
export const MAX_QUANTITY = 100_000;

export const VAT_EXEMPT_MENTION = "TVA non applicable, art. 293 B du CGI";

export const QUOTE_FIELD_LABELS: Record<string, string> = {
  client_id: "client",
  project_id: "projet",
  title: "objet",
  status: "statut",
  issue_date: "date d’émission",
  valid_until: "date de validité",
  terms: "conditions",
  subtotal_cents: "total HT",
  vat_cents: "TVA",
  total_cents: "total TTC",
  vat_exempt: "franchise de TVA",
  client_snapshot: "coordonnées client",
  issuer_snapshot: "coordonnées émetteur",
  sent_at: "date d’envoi",
  accepted_at: "date d’acceptation",
  refused_at: "date de refus",
};
