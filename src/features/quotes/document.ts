import type { PartyDetails, QuoteRow } from "./types";

/* Préparation des coordonnées affichées sur le devis (aperçu HTML et PDF). Module pur. */

type ClientSource = {
  kind: "company" | "individual";
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
};

type IssuerSource = {
  name: string;
  company_name: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  siret: string | null;
  vat_number: string | null;
  vat_exempt: boolean;
  quote_footer: string | null;
};

function addressLines(src: { address_line: string | null; postal_code: string | null; city: string | null; country: string | null }) {
  const cityLine = [src.postal_code, src.city].filter(Boolean).join(" ");
  return [src.address_line, cityLine, src.country].filter((l): l is string => !!l && l.trim() !== "");
}

function asClient(snapshot: unknown, live: ClientSource): ClientSource {
  return snapshot && typeof snapshot === "object" ? ({ ...live, ...(snapshot as Partial<ClientSource>) } as ClientSource) : live;
}

function asIssuer(snapshot: unknown, live: IssuerSource): IssuerSource {
  return snapshot && typeof snapshot === "object" ? ({ ...live, ...(snapshot as Partial<IssuerSource>) } as IssuerSource) : live;
}

/**
 * Parties du devis : instantanés figés à l'envoi s'ils existent, sinon données actuelles
 * (brouillon). Un devis envoyé ne change donc plus si le client ou l'entreprise sont modifiés.
 */
export function quoteParties(
  quote: Pick<QuoteRow, "client_snapshot" | "issuer_snapshot">,
  liveClient: ClientSource,
  liveIssuer: IssuerSource,
): { client: PartyDetails; issuer: PartyDetails; vatExemptIssuer: boolean; footer: string | null } {
  const c = asClient(quote.client_snapshot, liveClient);
  const i = asIssuer(quote.issuer_snapshot, liveIssuer);
  const company = c.kind === "company" && c.company_name;
  return {
    client: {
      name: company ? c.company_name! : c.contact_name,
      secondary: company ? `À l’attention de ${c.contact_name}` : null,
      lines: addressLines(c),
      email: c.email,
      phone: c.phone,
    },
    issuer: {
      name: i.company_name || i.name,
      secondary: null,
      lines: addressLines(i),
      email: i.email,
      phone: i.phone,
      siret: i.siret,
      vatNumber: i.vat_number,
    },
    vatExemptIssuer: i.vat_exempt,
    footer: i.quote_footer,
  };
}
