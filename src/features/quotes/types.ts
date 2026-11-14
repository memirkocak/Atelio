import type { Database } from "@/types/database.types";

/* Types partagés serveur / navigateur (aucun import serveur ici). */

export type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteItemRow = Database["public"]["Tables"]["quote_items"]["Row"];

export type ClientRef = {
  id: string;
  kind: Database["public"]["Enums"]["client_kind"];
  contact_name: string;
  company_name: string | null;
};

export type QuoteListItem = Pick<
  QuoteRow,
  "id" | "number" | "title" | "status" | "issue_date" | "valid_until" | "total_cents" | "subtotal_cents"
> & { client: ClientRef | null };

/** Coordonnées d'une partie (client ou émetteur), en direct ou figées à l'envoi. */
export type PartyDetails = {
  name: string;
  secondary: string | null;
  lines: string[];
  email: string | null;
  phone: string | null;
  siret?: string | null;
  vatNumber?: string | null;
};

export function clientRefLabel(client: ClientRef | null): string {
  if (!client) return "—";
  return client.kind === "company" && client.company_name ? client.company_name : client.contact_name;
}
