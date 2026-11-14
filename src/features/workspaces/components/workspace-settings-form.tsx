"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-alert";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatVatRate } from "@/features/quotes/calculations";
import { VAT_EXEMPT_MENTION, VAT_RATES } from "@/features/quotes/constants";
import { useServerActionForm } from "@/hooks/use-server-action-form";
import { cn } from "@/lib/utils";

import { updateWorkspaceSettingsAction } from "../actions";
import {
  workspaceSettingsSchema,
  type WorkspaceSettingsInput,
  type WorkspaceSettingsValues,
} from "../settings-schema";

/** Paramètres de l'espace et informations de l'entreprise (utilisées sur les devis). */
export function WorkspaceSettingsForm({
  slug,
  defaultValues,
  canEdit,
}: {
  slug: string;
  defaultValues: WorkspaceSettingsInput;
  canEdit: boolean;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const form = useForm<WorkspaceSettingsInput, unknown, WorkspaceSettingsValues>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues,
  });
  const { onSubmit, pending, error } = useServerActionForm(
    form,
    (values) => updateWorkspaceSettingsAction(slug, values),
    () => {
      toast.success("Paramètres enregistrés");
      form.reset(form.getValues());
    },
  );
  const { errors, isDirty } = form.formState;
  const vatExempt = useWatch({ control: form.control, name: "vatExempt" });

  const text = (name: keyof WorkspaceSettingsInput, label: string, props: React.ComponentProps<"input"> = {}) => (
    <Field data-invalid={!!errors[name]}>
      <FieldLabel htmlFor={id(name)}>{label}</FieldLabel>
      <Input id={id(name)} aria-invalid={!!errors[name]} disabled={!canEdit} {...props} {...form.register(name)} />
      <FieldError errors={[errors[name]]} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={error} />

      <Section title="Espace de travail" description="Le nom affiché dans la barre latérale.">
        {text("name", "Nom de l’espace")}
      </Section>

      <Section
        title="Informations de l’entreprise"
        description="Elles figurent en en-tête de vos devis. Elles sont figées dans chaque devis au moment de son envoi."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("companyName", "Raison sociale ou nom commercial", { autoComplete: "organization" })}
          {text("email", "E-mail", { type: "email", autoComplete: "email" })}
          {text("phone", "Téléphone", { type: "tel", autoComplete: "tel" })}
          {text("addressLine", "Adresse", { autoComplete: "street-address" })}
          <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-4">
            {text("postalCode", "Code postal", { autoComplete: "postal-code" })}
            {text("city", "Ville", { autoComplete: "address-level2" })}
          </div>
          {text("country", "Pays", { autoComplete: "country-name" })}
          {text("siret", "SIRET", { inputMode: "numeric", placeholder: "14 chiffres" })}
          {text("vatNumber", "N° de TVA intracommunautaire", { placeholder: "FR…" })}
        </div>
      </Section>

      <Section title="Devis" description="Valeurs utilisées par défaut pour les nouveaux devis.">
        <FieldGroup>
          <Controller
            control={form.control}
            name="vatExempt"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <p id={id("vatExempt")} className="font-medium">
                    Franchise en base de TVA
                  </p>
                  <p className="text-muted-foreground">
                    Pour les micro-entrepreneurs non assujettis : toutes les lignes sont à 0 % et la mention « {VAT_EXEMPT_MENTION} » est ajoutée aux devis.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-labelledby={id("vatExempt")}
                  disabled={!canEdit}
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                    field.value ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-5 rounded-full bg-background shadow transition-transform",
                      field.value ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={id("defaultVatRateBp")}>Taux de TVA par défaut</FieldLabel>
              <Controller
                control={form.control}
                name="defaultVatRateBp"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={!canEdit || vatExempt}
                  >
                    <SelectTrigger id={id("defaultVatRateBp")} className="w-full">
                      <SelectValue>{formatVatRate(field.value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {formatVatRate(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {vatExempt ? <FieldDescription>Sans effet en franchise de TVA.</FieldDescription> : null}
            </Field>
            <Field data-invalid={!!errors.quoteValidityDays}>
              <FieldLabel htmlFor={id("quoteValidityDays")}>Durée de validité (jours)</FieldLabel>
              <Input
                id={id("quoteValidityDays")}
                type="number"
                min={1}
                max={365}
                disabled={!canEdit}
                aria-invalid={!!errors.quoteValidityDays}
                {...form.register("quoteValidityDays", { valueAsNumber: true })}
              />
              <FieldError errors={[errors.quoteValidityDays]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.quoteTerms}>
            <FieldLabel htmlFor={id("quoteTerms")}>Conditions par défaut</FieldLabel>
            <Textarea
              id={id("quoteTerms")}
              rows={3}
              disabled={!canEdit}
              placeholder="Ex. : acompte de 30 % à la commande, solde à la livraison. Paiement à 30 jours."
              {...form.register("quoteTerms")}
            />
            <FieldError errors={[errors.quoteTerms]} />
          </Field>

          <Field data-invalid={!!errors.quoteFooter}>
            <FieldLabel htmlFor={id("quoteFooter")}>Mentions de bas de page</FieldLabel>
            <Textarea
              id={id("quoteFooter")}
              rows={2}
              disabled={!canEdit}
              placeholder="Ex. : forme juridique, capital, RCS, assurance professionnelle…"
              {...form.register("quoteFooter")}
            />
            <FieldError errors={[errors.quoteFooter]} />
          </Field>
        </FieldGroup>
      </Section>

      {canEdit ? (
        <div className="flex justify-end">
          <SubmitButton pending={pending} className="w-auto">
            {isDirty ? "Enregistrer les modifications" : "Enregistrer"}
          </SubmitButton>
        </div>
      ) : (
        <p className="text-muted-foreground">Seuls le propriétaire et les administrateurs peuvent modifier ces paramètres.</p>
      )}
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 rounded-lg border bg-background p-5 md:grid-cols-[16rem_1fr] md:p-6">
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
