import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .transform((v) => (v === "" ? null : v));

/** Paramètres de l'espace et informations de l'entreprise (émetteur des devis). Règles alignées sur les migrations 0001 et 0006. */
export const workspaceSettingsSchema = z.object({
  name: z.string().trim().min(1, "Saisissez le nom de l’espace.").max(80, "80 caractères maximum."),
  companyName: optionalText(120, "Raison sociale"),
  addressLine: optionalText(200, "Adresse"),
  postalCode: optionalText(20, "Code postal"),
  city: optionalText(100, "Ville"),
  country: z.string().trim().min(1, "Saisissez le pays.").max(80, "80 caractères maximum."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide.")
    .transform((v) => (v === "" ? null : v)),
  phone: optionalText(40, "Téléphone"),
  siret: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => v === "" || /^\d{14}$/.test(v), "Le SIRET comporte 14 chiffres.")
    .transform((v) => (v === "" ? null : v)),
  vatNumber: optionalText(20, "N° de TVA").transform((v) => (v ? v.replace(/\s/g, "").toUpperCase() : v)),
  vatExempt: z.boolean(),
  defaultVatRateBp: z.number().int().min(0).max(10000),
  quoteValidityDays: z
    .number({ error: "Durée invalide." })
    .int("Durée invalide.")
    .min(1, "Entre 1 et 365 jours.")
    .max(365, "Entre 1 et 365 jours."),
  quoteTerms: optionalText(2000, "Conditions"),
  quoteFooter: optionalText(1000, "Mentions"),
});

export type WorkspaceSettingsInput = z.input<typeof workspaceSettingsSchema>;
export type WorkspaceSettingsValues = z.output<typeof workspaceSettingsSchema>;

export type WorkspaceSettingsRow = {
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
  default_vat_rate_bp: number;
  quote_validity_days: number;
  quote_terms: string | null;
  quote_footer: string | null;
};

export function toSettingsInput(row: WorkspaceSettingsRow): WorkspaceSettingsInput {
  return {
    name: row.name,
    companyName: row.company_name ?? "",
    addressLine: row.address_line ?? "",
    postalCode: row.postal_code ?? "",
    city: row.city ?? "",
    country: row.country,
    email: row.email ?? "",
    phone: row.phone ?? "",
    siret: row.siret ?? "",
    vatNumber: row.vat_number ?? "",
    vatExempt: row.vat_exempt,
    defaultVatRateBp: row.default_vat_rate_bp,
    quoteValidityDays: row.quote_validity_days,
    quoteTerms: row.quote_terms ?? "",
    quoteFooter: row.quote_footer ?? "",
  };
}

export function toSettingsRow(v: WorkspaceSettingsValues) {
  return {
    name: v.name,
    company_name: v.companyName,
    address_line: v.addressLine,
    postal_code: v.postalCode,
    city: v.city,
    country: v.country,
    email: v.email,
    phone: v.phone,
    siret: v.siret,
    vat_number: v.vatNumber,
    vat_exempt: v.vatExempt,
    default_vat_rate_bp: v.defaultVatRateBp,
    quote_validity_days: v.quoteValidityDays,
    quote_terms: v.quoteTerms,
    quote_footer: v.quoteFooter,
  };
}
