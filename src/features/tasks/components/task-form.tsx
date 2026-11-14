"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormError } from "@/components/shared/form-alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useServerActionForm } from "@/hooks/use-server-action-form";
import type { ActionResult } from "@/lib/action-result";

import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "../constants";
import { taskFormSchema, type TaskFormInput, type TaskFormValues } from "../schemas";
import type { ProjectOption } from "../types";

const NO_PROJECT = "none";

type TaskFormProps = {
  defaultValues: TaskFormInput;
  projectOptions: ProjectOption[];
  action: (values: TaskFormInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess: (id: string) => void;
  footer: (pending: boolean) => ReactNode;
};

/** Formulaire tâche (création et modification), conçu pour un panneau latéral. */
export function TaskForm({ defaultValues, projectOptions, action, onSuccess, footer }: TaskFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const form = useForm<TaskFormInput, unknown, TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });
  const { onSubmit, pending, error } = useServerActionForm(form, action, (data) => onSuccess(data.id));
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          <FormError message={error} />

          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor={id("title")}>Titre</FieldLabel>
            <Input id={id("title")} aria-invalid={!!errors.title} {...form.register("title")} />
            <FieldError errors={[errors.title]} />
          </Field>

          <Field data-invalid={!!errors.projectId}>
            <FieldLabel htmlFor={id("project")}>Projet</FieldLabel>
            <Controller
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <Select value={field.value || NO_PROJECT} onValueChange={(v) => field.onChange(v === NO_PROJECT ? "" : v)}>
                  <SelectTrigger id={id("project")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PROJECT}>Aucun projet</SelectItem>
                    {projectOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.projectId]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={id("status")}>Statut</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={id("status")} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={id("priority")}>Priorité</FieldLabel>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={id("priority")} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {TASK_PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel htmlFor={id("dueDate")}>Échéance</FieldLabel>
              <Input id={id("dueDate")} type="date" aria-invalid={!!errors.dueDate} {...form.register("dueDate")} />
              <FieldError errors={[errors.dueDate]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor={id("description")}>Description</FieldLabel>
            <Textarea id={id("description")} rows={5} aria-invalid={!!errors.description} {...form.register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>
        </FieldGroup>
      </div>
      {footer(pending)}
    </form>
  );
}
