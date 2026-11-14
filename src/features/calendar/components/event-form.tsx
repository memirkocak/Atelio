"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/shared/form-alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useServerActionForm } from "@/hooks/use-server-action-form";
import type { ActionResult } from "@/lib/action-result";

import { eventFormSchema, type EventFormInput, type EventFormValues } from "../schemas";
import type { Option } from "../types";

const NONE = "none";

type EventFormProps = {
  defaultValues: EventFormInput;
  clientOptions: Option[];
  projectOptions: Option[];
  action: (values: EventFormInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess: (id: string) => void;
  footer: (pending: boolean) => ReactNode;
};

function OptionSelect({
  id,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  emptyLabel: string;
}) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{emptyLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Formulaire rendez-vous (création et modification), conçu pour un panneau latéral. */
export function EventForm({ defaultValues, clientOptions, projectOptions, action, onSuccess, footer }: EventFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const form = useForm<EventFormInput, unknown, EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });
  const { onSubmit, pending, error } = useServerActionForm(form, action, (data) => onSuccess(data.id));
  const { errors } = form.formState;
  const allDay = useWatch({ control: form.control, name: "allDay" });

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

          <Field orientation="horizontal">
            <Controller
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <Switch id={id("allDay")} checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <FieldLabel htmlFor={id("allDay")}>Journée entière</FieldLabel>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.startDate}>
              <FieldLabel htmlFor={id("startDate")}>Début</FieldLabel>
              <Input id={id("startDate")} type="date" aria-invalid={!!errors.startDate} {...form.register("startDate")} />
              <FieldError errors={[errors.startDate]} />
            </Field>
            {allDay ? null : (
              <Field data-invalid={!!errors.startTime}>
                <FieldLabel htmlFor={id("startTime")}>Heure de début</FieldLabel>
                <Input id={id("startTime")} type="time" aria-invalid={!!errors.startTime} {...form.register("startTime")} />
                <FieldError errors={[errors.startTime]} />
              </Field>
            )}
            <Field data-invalid={!!errors.endDate}>
              <FieldLabel htmlFor={id("endDate")}>Fin</FieldLabel>
              <Input id={id("endDate")} type="date" aria-invalid={!!errors.endDate} {...form.register("endDate")} />
              <FieldError errors={[errors.endDate]} />
            </Field>
            {allDay ? null : (
              <Field data-invalid={!!errors.endTime}>
                <FieldLabel htmlFor={id("endTime")}>Heure de fin</FieldLabel>
                <Input id={id("endTime")} type="time" aria-invalid={!!errors.endTime} {...form.register("endTime")} />
                <FieldError errors={[errors.endTime]} />
              </Field>
            )}
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">Heure de Paris.</p>

          <Field data-invalid={!!errors.location}>
            <FieldLabel htmlFor={id("location")}>Lieu</FieldLabel>
            <Input
              id={id("location")}
              placeholder="Adresse, visioconférence…"
              aria-invalid={!!errors.location}
              {...form.register("location")}
            />
            <FieldError errors={[errors.location]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.clientId}>
              <FieldLabel htmlFor={id("client")}>Client</FieldLabel>
              <Controller
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <OptionSelect
                    id={id("client")}
                    value={field.value}
                    onChange={field.onChange}
                    options={clientOptions}
                    emptyLabel="Aucun client"
                  />
                )}
              />
              <FieldError errors={[errors.clientId]} />
            </Field>
            <Field data-invalid={!!errors.projectId}>
              <FieldLabel htmlFor={id("project")}>Projet</FieldLabel>
              <Controller
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <OptionSelect
                    id={id("project")}
                    value={field.value}
                    onChange={field.onChange}
                    options={projectOptions}
                    emptyLabel="Aucun projet"
                  />
                )}
              />
              <FieldError errors={[errors.projectId]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor={id("description")}>Description</FieldLabel>
            <Textarea id={id("description")} rows={4} aria-invalid={!!errors.description} {...form.register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>
        </FieldGroup>
      </div>
      {footer(pending)}
    </form>
  );
}
