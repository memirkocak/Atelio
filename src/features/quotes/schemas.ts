import { z } from "zod";

import { isIsoDate } from "@/lib/dates";
import { parseEuroInput } from "@/lib/money";

import { parseQuantity } from "./calculations";
import {
  MAX_QUANTITY,
  MAX_UNIT_PRICE_CENTS,
  QUOTE_DISPLAY_STATUSES,
  QUOTE_MAX_ITEMS,
  type QuoteDisplayStatus,
} from "./constants";

const requiredDate = (label: string) =>
  z.string().trim().refine((v) => isIsoDate(v), `${label} invalide.`);

export const quoteItemSchema = z.object({
  label: z.string().trim().min(1, "Saisissez une désignation.").max(200, "200 caractères maximum."),
  description: z.string().trim().max(2000, "2000 caractères maximum."),
  quantity: z
    .string()
    .trim()
    .refine((v) => parseQuantity(v) !== null, "Quantité invalide (ex. 1,5).")
    .refine((v) => {
      const q = parseQuantity(v);
      return q === null || q <= BigInt(MAX_QUANTITY) * 1000n;
    }, "Quantité trop élevée."),
  unit: z.string().trim().max(20, "20 caractères maximum."),
  unitPrice: z
    .string()
    .refine((v) => v.trim() !== "", "Saisissez un prix.")
    .refine((v) => Number.isFinite(parseEuroInput(v)), "Prix invalide (ex. 450,00).")
    .refine((v) => (parseEuroInput(v) ?? 0) <= MAX_UNIT_PRICE_CENTS, "Prix trop élevé."),
  vatRateBp: z.number().int().min(0).max(10000),
});

/**
 * Éditeur de devis. Le serveur (public.save_quote) revalide tout et recalcule les montants ;
 * aucun montant n'est transmis.
 */
export const quoteFormSchema = z
  .object({
    clientId: z.uuid("Choisissez un client."),
    projectId: z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "Projet invalide."),
    title: z.string().trim().min(1, "Saisissez l’objet du devis.").max(200, "200 caractères maximum."),
    issueDate: requiredDate("Date d’émission"),
    validUntil: requiredDate("Date de validité"),
    terms: z.string().trim().max(5000, "5000 caractères maximum."),
    items: z
      .array(quoteItemSchema)
      .min(1, "Ajoutez au moins une ligne.")
      .max(QUOTE_MAX_ITEMS, `${QUOTE_MAX_ITEMS} lignes maximum.`),
  })
  .refine((v) => !isIsoDate(v.issueDate) || !isIsoDate(v.validUntil) || v.validUntil >= v.issueDate, {
    path: ["validUntil"],
    message: "La validité ne peut pas précéder la date d’émission.",
  });

export type QuoteFormInput = z.input<typeof quoteFormSchema>;
export type QuoteItemInput = z.input<typeof quoteItemSchema>;

export function emptyQuoteItem(vatRateBp: number): QuoteItemInput {
  return { label: "", description: "", quantity: "1", unit: "", unitPrice: "", vatRateBp };
}

/** Paramètres de la fonction SQL public.save_quote (montants exclus : recalculés côté base). */
export function toSaveQuotePayload(v: z.output<typeof quoteFormSchema>) {
  return {
    quote: {
      client_id: v.clientId,
      project_id: v.projectId || null,
      title: v.title,
      issue_date: v.issueDate,
      valid_until: v.validUntil,
      terms: v.terms,
    },
    items: v.items.map((i) => ({
      label: i.label,
      description: i.description,
      quantity: i.quantity.replace(",", "."),
      unit: i.unit,
      unit_price_cents: parseEuroInput(i.unitPrice),
      vat_rate_bp: i.vatRateBp,
    })),
  };
}

/** Quantité stockée (« 1.500 ») → saisie (« 1,5 »). */
export function quantityToInput(value: number | string): string {
  const s = String(value);
  const trimmed = s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  return trimmed.replace(".", ",");
}

/** Valeurs de l'éditeur à partir d'un devis enregistré (modification d'un brouillon). */
export function toQuoteFormInput(quote: {
  client_id: string;
  project_id: string | null;
  title: string;
  issue_date: string;
  valid_until: string;
  terms: string | null;
  items: {
    label: string;
    description: string | null;
    quantity: number | string;
    unit: string | null;
    unit_price_cents: number;
    vat_rate_bp: number;
  }[];
}, centsToInput: (cents: number | null) => string): QuoteFormInput {
  return {
    clientId: quote.client_id,
    projectId: quote.project_id ?? "",
    title: quote.title,
    issueDate: quote.issue_date,
    validUntil: quote.valid_until,
    terms: quote.terms ?? "",
    items: quote.items.map((i) => ({
      label: i.label,
      description: i.description ?? "",
      quantity: quantityToInput(i.quantity),
      unit: i.unit ?? "",
      unitPrice: centsToInput(i.unit_price_cents),
      vatRateBp: i.vat_rate_bp,
    })),
  };
}

/* ----------------------------------------------------------------------------
 * Paramètres de la liste (URL)
 * -------------------------------------------------------------------------- */
export const quoteListParamsSchema = z.object({
  q: z.string().trim().max(100).catch("").default(""),
  status: z
    .enum(QUOTE_DISPLAY_STATUSES as [QuoteDisplayStatus, ...QuoteDisplayStatus[]])
    .optional()
    .catch(undefined),
  client: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type QuoteListParams = z.output<typeof quoteListParamsSchema>;

export function parseQuoteListParams(searchParams: Record<string, string | string[] | undefined>): QuoteListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return quoteListParamsSchema.parse({
    q: first(searchParams.q),
    status: first(searchParams.status),
    client: first(searchParams.client),
    page: first(searchParams.page),
  });
}
