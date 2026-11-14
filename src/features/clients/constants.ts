import type { Database } from "@/types/database.types";

export type ClientKind = Database["public"]["Enums"]["client_kind"];

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  company: "Entreprise",
  individual: "Particulier",
};

export const CLIENTS_PAGE_SIZE = 25;

export const CLIENT_SORTS = {
  recent: "Plus récents",
  oldest: "Plus anciens",
  name: "Nom (A → Z)",
} as const;

export type ClientSort = keyof typeof CLIENT_SORTS;

/** Libellés des champs (formulaire, historique). */
export const CLIENT_FIELD_LABELS: Record<string, string> = {
  kind: "type",
  contact_name: "nom du contact",
  company_name: "entreprise",
  email: "e-mail",
  phone: "téléphone",
  address_line: "adresse",
  postal_code: "code postal",
  city: "ville",
  country: "pays",
  notes: "notes",
};
