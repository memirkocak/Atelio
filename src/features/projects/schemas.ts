import { z } from "zod";

import { isIsoDate } from "@/lib/dates";
import { centsToInput, parseEuroInput } from "@/lib/money";

import {
  PROJECT_SORTS,
  PROJECT_STATUSES,
  PROJECT_VIEWS,
  type ProjectSort,
  type ProjectStatus,
  type ProjectView,
} from "./constants";

const statusEnum = z.enum(PROJECT_STATUSES as [ProjectStatus, ...ProjectStatus[]]);

const optionalDate = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || isIsoDate(v), `${label} invalide.`)
    .transform((v) => (v === "" ? null : v));

/**
 * Formulaire projet : champs saisis en chaînes (budget en euros, dates « AAAA-MM-JJ »),
 * ressortis prêts pour la base (budget en centimes, null pour les champs vides).
 * Règles alignées sur la migration 0004.
 */
export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, "Saisissez le nom du projet.").max(120, "120 caractères maximum."),
    clientId: z
      .string()
      .refine((v) => v === "" || z.uuid().safeParse(v).success, "Client invalide.")
      .transform((v) => (v === "" ? null : v)),
    status: statusEnum,
    budget: z
      .string()
      .transform((v) => parseEuroInput(v))
      .refine((v) => v === null || Number.isFinite(v), "Montant invalide (ex. 1 500,50).")
      .refine((v) => v === null || v <= 100_000_000_000, "Montant trop élevé."),
    startDate: optionalDate("Date de début"),
    dueDate: optionalDate("Échéance"),
    progress: z
      .number({ error: "Avancement invalide." })
      .int("Avancement invalide.")
      .min(0, "Entre 0 et 100 %.")
      .max(100, "Entre 0 et 100 %."),
    description: z
      .string()
      .trim()
      .max(5000, "Description : 5000 caractères maximum.")
      .transform((v) => (v === "" ? null : v)),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ["dueDate"],
    message: "L’échéance ne peut pas précéder la date de début.",
  });

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;

export const emptyProjectForm: ProjectFormInput = {
  name: "",
  clientId: "",
  status: "upcoming",
  budget: "",
  startDate: "",
  dueDate: "",
  progress: 0,
  description: "",
};

export function toProjectRow(values: ProjectFormValues) {
  return {
    name: values.name,
    client_id: values.clientId,
    status: values.status,
    budget_cents: values.budget,
    start_date: values.startDate,
    due_date: values.dueDate,
    progress: values.progress,
    description: values.description,
  };
}

export function toProjectFormInput(row: {
  name: string;
  client_id: string | null;
  status: ProjectStatus;
  budget_cents: number | null;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  description: string | null;
}): ProjectFormInput {
  return {
    name: row.name,
    clientId: row.client_id ?? "",
    status: row.status,
    budget: centsToInput(row.budget_cents),
    startDate: row.start_date ?? "",
    dueDate: row.due_date ?? "",
    progress: row.progress,
    description: row.description ?? "",
  };
}

export const projectStatusSchema = statusEnum;

/* ----------------------------------------------------------------------------
 * Paramètres de la liste (URL) — toute valeur invalide retombe sur la valeur par défaut.
 * -------------------------------------------------------------------------- */
const sortKeys = Object.keys(PROJECT_SORTS) as [ProjectSort, ...ProjectSort[]];

export const projectListParamsSchema = z.object({
  q: z.string().trim().max(100).catch("").default(""),
  status: statusEnum.optional().catch(undefined),
  client: z.uuid().optional().catch(undefined),
  sort: z.enum(sortKeys).catch("due").default("due"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
  view: z.enum(PROJECT_VIEWS as unknown as [ProjectView, ...ProjectView[]]).catch("tableau").default("tableau"),
});

export type ProjectListParams = z.output<typeof projectListParamsSchema>;

export function parseProjectListParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProjectListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return projectListParamsSchema.parse({
    q: first(searchParams.q),
    status: first(searchParams.status),
    client: first(searchParams.client),
    sort: first(searchParams.sort),
    page: first(searchParams.page),
    view: first(searchParams.view),
  });
}
