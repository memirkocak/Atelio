"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/shared/form-alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import { useServerActionForm } from "@/hooks/use-server-action-form";
import { cn } from "@/lib/utils";

import { CLIENT_KIND_LABELS, type ClientKind } from "../constants";
import { clientFormSchema, type ClientFormInput, type ClientFormValues } from "../schemas";

type ClientFormProps = {
  defaultValues: ClientFormInput;
  action: (values: ClientFormInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess: (id: string) => void;
  /** Pied du panneau (boutons), qui reçoit l'état d'envoi. */
  footer: (pending: boolean) => ReactNode;
};

const KIND_ICONS: Record<ClientKind, typeof Building2> = { company: Building2, individual: User };

/** Formulaire client (création et modification), conçu pour un panneau latéral. */
export function ClientForm({ defaultValues, action, onSuccess, footer }: ClientFormProps) {
  const uid = useId();
  const form = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });
  const { onSubmit, pending, error } = useServerActionForm(form, action, (data) => onSuccess(data.id));
  const { errors } = form.formState;
  const kind = useWatch({ control: form.control, name: "kind" });
  const id = (name: string) => `${uid}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
      <FieldGroup>
        <FormError message={error} />

        <FieldSet>
          <FieldLegend variant="label">Type de client</FieldLegend>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Type de client" className="grid grid-cols-2 gap-2">
                {(Object.keys(CLIENT_KIND_LABELS) as ClientKind[]).map((value) => {
                  const Icon = KIND_ICONS[value];
                  const checked = field.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        checked
                          ? "border-primary bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className={cn("size-4", checked && "text-primary")} aria-hidden />
                      {CLIENT_KIND_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </FieldSet>

        {kind === "company" ? (
          <Field data-invalid={!!errors.companyName}>
            <FieldLabel htmlFor={id("companyName")}>Entreprise</FieldLabel>
            <Input
              id={id("companyName")}
              autoComplete="organization"
              aria-invalid={!!errors.companyName}
              {...form.register("companyName")}
            />
            <FieldError errors={[errors.companyName]} />
          </Field>
        ) : null}

        <Field data-invalid={!!errors.contactName}>
          <FieldLabel htmlFor={id("contactName")}>
            {kind === "company" ? "Nom du contact" : "Nom complet"}
          </FieldLabel>
          <Input
            id={id("contactName")}
            autoComplete="name"
            aria-invalid={!!errors.contactName}
            {...form.register("contactName")}
          />
          <FieldError errors={[errors.contactName]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor={id("email")}>E-mail</FieldLabel>
            <Input
              id={id("email")}
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor={id("phone")}>Téléphone</FieldLabel>
            <Input
              id={id("phone")}
              type="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
          </Field>
        </div>

        <FieldSet>
          <FieldLegend variant="label">Adresse</FieldLegend>
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.addressLine}>
              <FieldLabel htmlFor={id("addressLine")} className="sr-only">
                Rue
              </FieldLabel>
              <Input
                id={id("addressLine")}
                placeholder="Rue"
                autoComplete="street-address"
                aria-invalid={!!errors.addressLine}
                {...form.register("addressLine")}
              />
              <FieldError errors={[errors.addressLine]} />
            </Field>
            <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-4">
              <Field data-invalid={!!errors.postalCode}>
                <FieldLabel htmlFor={id("postalCode")} className="sr-only">
                  Code postal
                </FieldLabel>
                <Input
                  id={id("postalCode")}
                  placeholder="Code postal"
                  autoComplete="postal-code"
                  aria-invalid={!!errors.postalCode}
                  {...form.register("postalCode")}
                />
                <FieldError errors={[errors.postalCode]} />
              </Field>
              <Field data-invalid={!!errors.city}>
                <FieldLabel htmlFor={id("city")} className="sr-only">
                  Ville
                </FieldLabel>
                <Input
                  id={id("city")}
                  placeholder="Ville"
                  autoComplete="address-level2"
                  aria-invalid={!!errors.city}
                  {...form.register("city")}
                />
                <FieldError errors={[errors.city]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.country}>
              <FieldLabel htmlFor={id("country")} className="sr-only">
                Pays
              </FieldLabel>
              <Input
                id={id("country")}
                placeholder="Pays"
                autoComplete="country-name"
                aria-invalid={!!errors.country}
                {...form.register("country")}
              />
              <FieldError errors={[errors.country]} />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor={id("notes")}>Notes internes</FieldLabel>
          <Textarea
            id={id("notes")}
            rows={4}
            placeholder="Visibles uniquement par votre équipe"
            aria-invalid={!!errors.notes}
            {...form.register("notes")}
          />
          <FieldError errors={[errors.notes]} />
        </Field>
      </FieldGroup>
      </div>
      {footer(pending)}
    </form>
  );
}
