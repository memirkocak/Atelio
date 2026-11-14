"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/shared/form-alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientOption } from "@/features/clients/queries";
import { useServerActionForm } from "@/hooks/use-server-action-form";
import type { ActionResult } from "@/lib/action-result";

import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../constants";
import { projectFormSchema, type ProjectFormInput, type ProjectFormValues } from "../schemas";

const NO_CLIENT = "none";

type ProjectFormProps = {
  defaultValues: ProjectFormInput;
  clientOptions: ClientOption[];
  action: (values: ProjectFormInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess: (id: string) => void;
  footer: (pending: boolean) => ReactNode;
};

/** Formulaire projet (création et modification), conçu pour un panneau latéral. */
export function ProjectForm({ defaultValues, clientOptions, action, onSuccess, footer }: ProjectFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const form = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });
  const { onSubmit, pending, error } = useServerActionForm(form, action, (data) => onSuccess(data.id));
  const { errors } = form.formState;
  const progress = useWatch({ control: form.control, name: "progress" });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          <FormError message={error} />

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor={id("name")}>Nom du projet</FieldLabel>
            <Input id={id("name")} aria-invalid={!!errors.name} {...form.register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.clientId}>
              <FieldLabel htmlFor={id("client")}>Client</FieldLabel>
              <Controller
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_CLIENT}
                    onValueChange={(v) => field.onChange(v === NO_CLIENT ? "" : v)}
                  >
                    <SelectTrigger id={id("client")} className="w-full" aria-invalid={!!errors.clientId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CLIENT}>Aucun client</SelectItem>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.clientId]} />
            </Field>

            <Field data-invalid={!!errors.status}>
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
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROJECT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.startDate}>
              <FieldLabel htmlFor={id("startDate")}>Date de début</FieldLabel>
              <Input id={id("startDate")} type="date" aria-invalid={!!errors.startDate} {...form.register("startDate")} />
              <FieldError errors={[errors.startDate]} />
            </Field>
            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel htmlFor={id("dueDate")}>Échéance</FieldLabel>
              <Input id={id("dueDate")} type="date" aria-invalid={!!errors.dueDate} {...form.register("dueDate")} />
              <FieldError errors={[errors.dueDate]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.budget}>
              <FieldLabel htmlFor={id("budget")}>Budget (HT)</FieldLabel>
              <div className="relative">
                <Input
                  id={id("budget")}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pr-8 tabular-nums"
                  aria-invalid={!!errors.budget}
                  {...form.register("budget")}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
              <FieldError errors={[errors.budget]} />
            </Field>

            <Field data-invalid={!!errors.progress}>
              <FieldLabel htmlFor={id("progress")}>Avancement</FieldLabel>
              <div className="flex h-9 items-center gap-3">
                <input
                  id={id("progress")}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  className="w-full accent-primary"
                  aria-valuetext={`${progress} %`}
                  {...form.register("progress", { valueAsNumber: true })}
                />
                <span className="w-10 text-right tabular-nums">{progress} %</span>
              </div>
              <FieldError errors={[errors.progress]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor={id("description")}>Description</FieldLabel>
            <Textarea
              id={id("description")}
              rows={4}
              aria-invalid={!!errors.description}
              {...form.register("description")}
            />
            <FieldDescription>Objectifs, livrables, informations utiles…</FieldDescription>
            <FieldError errors={[errors.description]} />
          </Field>
        </FieldGroup>
      </div>
      {footer(pending)}
    </form>
  );
}
