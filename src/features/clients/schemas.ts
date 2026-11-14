import { z } from "zod";

import { CLIENT_SORTS, type ClientSort } from "./constants";

/** Champ texte facultatif : espaces retirés, chaîne vide → null. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .transform((v) => (v === "" ? null : v));

/**
 * Formulaire client. Les champs arrivent en chaînes (formulaire) et ressortent
 * prêts pour la base (null pour les champs vides). Règles alignées sur la migration 0002.
 */
export const clientFormSchema = z
  .object({
    kind: z.enum(["company", "individual"], { error: "Choisissez un type de client." }),
    contactName: z
      .string()
      .trim()
      .min(1, "Saisissez le nom du contact.")
      .max(120, "120 caractères maximum."),
    companyName: optionalText(120, "Entreprise"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "254 caractères maximum.")
      .refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide.")
      .transform((v) => (v === "" ? null : v)),
    phone: optionalText(40, "Téléphone").refine(
      // Chiffres, espaces, + ( ) . - ; au moins 4 chiffres
      (v) => v === null || (/^[+(\d][\d\s().-]*$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 4),
      "Numéro de téléphone invalide.",
    ),
    addressLine: optionalText(200, "Adresse"),
    postalCode: optionalText(20, "Code postal"),
    city: optionalText(100, "Ville"),
    country: z
      .string()
      .trim()
      .min(1, "Saisissez le pays.")
      .max(80, "80 caractères maximum."),
    notes: optionalText(5000, "Notes"),
  })
  .refine((v) => v.kind !== "company" || v.companyName !== null, {
    path: ["companyName"],
    message: "Saisissez le nom de l’entreprise.",
  });

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;

export const emptyClientForm: ClientFormInput = {
  kind: "company",
  contactName: "",
  companyName: "",
  email: "",
  phone: "",
  addressLine: "",
  postalCode: "",
  city: "",
  country: "France",
  notes: "",
};

/** Colonnes SQL correspondant au formulaire. */
export function toClientRow(values: ClientFormValues) {
  return {
    kind: values.kind,
    contact_name: values.contactName,
    company_name: values.companyName,
    email: values.email,
    phone: values.phone,
    address_line: values.addressLine,
    postal_code: values.postalCode,
    city: values.city,
    country: values.country,
    notes: values.notes,
  };
}

/** Valeurs du formulaire à partir d'une ligne de la base (modification). */
export function toClientFormInput(row: {
  kind: "company" | "individual";
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  notes: string | null;
}): ClientFormInput {
  return {
    kind: row.kind,
    contactName: row.contact_name,
    companyName: row.company_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    addressLine: row.address_line ?? "",
    postalCode: row.postal_code ?? "",
    city: row.city ?? "",
    country: row.country,
    notes: row.notes ?? "",
  };
}

/* ----------------------------------------------------------------------------
 * Paramètres de la liste (URL) : toute valeur invalide retombe sur la valeur par défaut.
 * -------------------------------------------------------------------------- */
const sortKeys = Object.keys(CLIENT_SORTS) as [ClientSort, ...ClientSort[]];

export const clientListParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .catch("")
    .default(""),
  type: z.enum(["company", "individual"]).optional().catch(undefined),
  sort: z.enum(sortKeys).catch("recent").default("recent"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type ClientListParams = z.output<typeof clientListParamsSchema>;

/** Lit les searchParams Next (valeurs simples ou tableaux). */
export function parseClientListParams(
  searchParams: Record<string, string | string[] | undefined>,
): ClientListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return clientListParamsSchema.parse({
    q: first(searchParams.q),
    type: first(searchParams.type),
    sort: first(searchParams.sort),
    page: first(searchParams.page),
  });
}
