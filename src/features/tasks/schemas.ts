import { z } from "zod";

import { isIsoDate } from "@/lib/dates";

import {
  NO_PROJECT,
  TASK_DUE_FILTERS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskDueFilter,
  type TaskPriority,
  type TaskStatus,
} from "./constants";

const statusEnum = z.enum(TASK_STATUSES as [TaskStatus, ...TaskStatus[]]);
const priorityEnum = z.enum(TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]]);

const title = z.string().trim().min(1, "Saisissez le titre de la tâche.").max(200, "200 caractères maximum.");
const projectId = z
  .string()
  .refine((v) => v === "" || z.uuid().safeParse(v).success, "Projet invalide.")
  .transform((v) => (v === "" ? null : v));

/** Formulaire complet (panneau). Règles alignées sur la migration 0005. */
export const taskFormSchema = z.object({
  title,
  projectId,
  status: statusEnum,
  priority: priorityEnum,
  dueDate: z
    .string()
    .trim()
    .refine((v) => v === "" || isIsoDate(v), "Échéance invalide.")
    .transform((v) => (v === "" ? null : v)),
  description: z
    .string()
    .trim()
    .max(5000, "Description : 5000 caractères maximum.")
    .transform((v) => (v === "" ? null : v)),
});

export type TaskFormInput = z.input<typeof taskFormSchema>;
export type TaskFormValues = z.output<typeof taskFormSchema>;

export const emptyTaskForm: TaskFormInput = {
  title: "",
  projectId: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  description: "",
};

/** Ajout rapide : un titre, et éventuellement le projet courant. */
export const quickAddSchema = z.object({ title, projectId });

export function toTaskRow(values: TaskFormValues) {
  return {
    title: values.title,
    project_id: values.projectId,
    status: values.status,
    priority: values.priority,
    due_date: values.dueDate,
    description: values.description,
  };
}

export function toTaskFormInput(row: {
  title: string;
  project_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  description: string | null;
}): TaskFormInput {
  return {
    title: row.title,
    projectId: row.project_id ?? "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? "",
    description: row.description ?? "",
  };
}

/* ----------------------------------------------------------------------------
 * Paramètres de la liste (URL) — toute valeur invalide retombe sur la valeur par défaut.
 * -------------------------------------------------------------------------- */
const dueKeys = Object.keys(TASK_DUE_FILTERS) as [TaskDueFilter, ...TaskDueFilter[]];

export const taskListParamsSchema = z.object({
  q: z.string().trim().max(100).catch("").default(""),
  status: statusEnum.optional().catch(undefined),
  priority: priorityEnum.optional().catch(undefined),
  project: z.union([z.uuid(), z.literal(NO_PROJECT)]).optional().catch(undefined),
  due: z.enum(dueKeys).optional().catch(undefined),
  /** Afficher aussi les tâches terminées (masquées par défaut). */
  done: z.literal("1").optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type TaskListParams = z.output<typeof taskListParamsSchema>;

export function parseTaskListParams(searchParams: Record<string, string | string[] | undefined>): TaskListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return taskListParamsSchema.parse({
    q: first(searchParams.q),
    status: first(searchParams.status),
    priority: first(searchParams.priority),
    project: first(searchParams.project),
    due: first(searchParams.due),
    done: first(searchParams.done),
    page: first(searchParams.page),
  });
}

/** Les tâches terminées sont-elles incluses dans la liste ? */
export function includesDone(params: TaskListParams): boolean {
  return params.done === "1" || params.status === "done";
}
