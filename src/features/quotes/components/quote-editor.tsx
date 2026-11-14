"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-alert";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { formatCents, parseEuroInput } from "@/lib/money";
import { cn } from "@/lib/utils";

import { saveQuoteAction } from "../actions";
import { computeQuoteTotals, formatVatRate } from "../calculations";
import { QUOTE_MAX_ITEMS, QUOTE_UNITS, VAT_EXEMPT_MENTION, VAT_RATES } from "../constants";
import { emptyQuoteItem, quoteFormSchema, type QuoteFormInput } from "../schemas";

type Option = { id: string; label: string };
const NO_PROJECT = "none";

export type QuoteEditorProps = {
  slug: string;
  quoteId: string | null;
  number: string | null;
  defaultValues: QuoteFormInput;
  clientOptions: Option[];
  projectOptions: Option[];
  vatExempt: boolean;
  defaultVatRateBp: number;
};

/**
 * Éditeur de devis (brouillon). Les totaux affichés sont un APERÇU : la base de données
 * recalcule tout à l'enregistrement (public.save_quote) avec la même règle d'arrondi.
 */
export function QuoteEditor({
  slug,
  quoteId,
  number,
  defaultValues,
  clientOptions,
  projectOptions,
  vatExempt,
  defaultVatRateBp,
}: QuoteEditorProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const router = useRouter();
  const form = useForm<QuoteFormInput>({ resolver: zodResolver(quoteFormSchema), defaultValues });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });
  const { onSubmit, pending, error } = useServerActionForm(
    form,
    (values) => saveQuoteAction(slug, quoteId, values),
    ({ id: savedId }) => {
      toast.success(quoteId ? "Devis enregistré" : "Brouillon créé");
      router.push(`/w/${slug}/devis/${savedId}`);
    },
  );
  const { errors } = form.formState;

  const items = useWatch({ control: form.control, name: "items" }) ?? [];
  const totals = computeQuoteTotals(
    items.map((i) => {
      const price = parseEuroInput(i?.unitPrice ?? "");
      return {
        quantity: i?.quantity ?? "",
        unitPriceCents: price !== null && Number.isFinite(price) ? price : 0,
        vatRateBp: i?.vatRateBp ?? 0,
      };
    }),
    vatExempt,
  );

  const backHref = quoteId ? `/w/${slug}/devis/${quoteId}` : `/w/${slug}/devis`;
  const itemErrors = errors.items as (FieldErrors<QuoteFormInput["items"][number]> | undefined)[] | undefined;
  const itemsRootError = (errors.items as { message?: string; root?: { message?: string } } | undefined)?.root?.message
    ?? (errors.items as { message?: string } | undefined)?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={error} />

      {/* En-tête du devis */}
      <section className="grid gap-4 rounded-lg border bg-background p-5 md:grid-cols-2">
        <Field data-invalid={!!errors.clientId}>
          <FieldLabel htmlFor={id("client")}>Client</FieldLabel>
          <Controller
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id={id("client")} className="w-full" aria-invalid={!!errors.clientId}>
                  <SelectValue placeholder="Choisir un client">
                    {clientOptions.find((c) => c.id === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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

        <Field>
          <FieldLabel htmlFor={id("project")}>Projet (facultatif)</FieldLabel>
          <Controller
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <Select value={field.value || NO_PROJECT} onValueChange={(v) => field.onChange(v === NO_PROJECT ? "" : v)}>
                <SelectTrigger id={id("project")} className="w-full">
                  <SelectValue>
                    {field.value ? projectOptions.find((p) => p.id === field.value)?.label : "Aucun projet"}
                  </SelectValue>
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
        </Field>

        <Field data-invalid={!!errors.title} className="md:col-span-2">
          <FieldLabel htmlFor={id("title")}>Objet du devis</FieldLabel>
          <Input
            id={id("title")}
            placeholder="Ex. : Refonte du site vitrine"
            aria-invalid={!!errors.title}
            {...form.register("title")}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={!!errors.issueDate}>
          <FieldLabel htmlFor={id("issueDate")}>Date d’émission</FieldLabel>
          <Input id={id("issueDate")} type="date" aria-invalid={!!errors.issueDate} {...form.register("issueDate")} />
          <FieldError errors={[errors.issueDate]} />
        </Field>
        <Field data-invalid={!!errors.validUntil}>
          <FieldLabel htmlFor={id("validUntil")}>Valable jusqu’au</FieldLabel>
          <Input id={id("validUntil")} type="date" aria-invalid={!!errors.validUntil} {...form.register("validUntil")} />
          <FieldError errors={[errors.validUntil]} />
        </Field>
      </section>

      {/* Lignes */}
      <section aria-labelledby={id("lines")} className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 id={id("lines")} className="text-sm font-semibold">
            Prestations
          </h2>
          {vatExempt ? <span className="text-xs text-muted-foreground">{VAT_EXEMPT_MENTION}</span> : null}
        </div>

        <div className="hidden grid-cols-[1fr_5.5rem_6.5rem_7.5rem_6rem_7rem_4.5rem] gap-2 border-b bg-muted/40 px-5 py-2 text-xs font-medium text-muted-foreground lg:grid">
          <span>Désignation</span>
          <span>Qté</span>
          <span>Unité</span>
          <span>PU HT</span>
          <span>TVA</span>
          <span className="text-right">Total HT</span>
          <span className="sr-only">Actions</span>
        </div>

        <ol className="divide-y">
          {fields.map((field, index) => {
            const e = itemErrors?.[index];
            const line = totals.lines[index];
            const n = index + 1;
            return (
              <li key={field.id} data-line={n} className="grid gap-2 px-5 py-3 lg:grid-cols-[1fr_5.5rem_6.5rem_7.5rem_6rem_7rem_4.5rem] lg:items-start">
                <div className="space-y-2">
                  <Input
                    aria-label={`Désignation de la ligne ${n}`}
                    placeholder="Désignation"
                    aria-invalid={!!e?.label}
                    {...form.register(`items.${index}.label`)}
                  />
                  <Textarea
                    aria-label={`Description de la ligne ${n}`}
                    placeholder="Description (facultatif)"
                    rows={1}
                    className="min-h-9 resize-y text-muted-foreground"
                    {...form.register(`items.${index}.description`)}
                  />
                  <FieldError errors={[e?.label]} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:contents">
                  <div>
                    <Input
                      aria-label={`Quantité de la ligne ${n}`}
                      inputMode="decimal"
                      className="tabular-nums"
                      aria-invalid={!!e?.quantity}
                      {...form.register(`items.${index}.quantity`)}
                    />
                    <FieldError errors={[e?.quantity]} className="mt-1 text-xs" />
                  </div>
                  <Input
                    aria-label={`Unité de la ligne ${n}`}
                    placeholder="Unité"
                    list={id("units")}
                    {...form.register(`items.${index}.unit`)}
                  />
                  <div>
                    <div className="relative">
                      <Input
                        aria-label={`Prix unitaire HT de la ligne ${n}`}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="pr-7 tabular-nums"
                        aria-invalid={!!e?.unitPrice}
                        {...form.register(`items.${index}.unitPrice`)}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">€</span>
                    </div>
                    <FieldError errors={[e?.unitPrice]} className="mt-1 text-xs" />
                  </div>
                  <Controller
                    control={form.control}
                    name={`items.${index}.vatRateBp`}
                    render={({ field: f }) => (
                      <Select value={String(vatExempt ? 0 : f.value)} onValueChange={(v) => f.onChange(Number(v))} disabled={vatExempt}>
                        <SelectTrigger aria-label={`TVA de la ligne ${n}`} className="w-full">
                          <SelectValue>{formatVatRate(vatExempt ? 0 : f.value)}</SelectValue>
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
                </div>
                <p className="flex h-9 items-center justify-between text-sm tabular-nums lg:justify-end" data-testid={`line-total-${n}`}>
                  <span className="text-muted-foreground lg:hidden">Total HT</span>
                  {formatCents(line?.subtotalCents ?? 0)}
                </p>
                <div className="flex justify-end gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Monter la ligne ${n}`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Descendre la ligne ${n}`}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer la ligne ${n}`}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
        <datalist id={id("units")}>
          {QUOTE_UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>

        <div className="flex flex-col gap-4 border-t px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              disabled={fields.length >= QUOTE_MAX_ITEMS}
              onClick={() => append(emptyQuoteItem(vatExempt ? 0 : defaultVatRateBp))}
            >
              <Plus aria-hidden />
              Ajouter une ligne
            </Button>
            {itemsRootError ? <p className="text-sm text-destructive">{itemsRootError}</p> : null}
          </div>

          <dl className="w-full space-y-1.5 text-sm md:w-72" aria-label="Totaux (aperçu)">
            <TotalRow label="Total HT" value={formatCents(totals.subtotalCents)} testId="total-ht" />
            {vatExempt ? (
              <TotalRow label="TVA" value={formatCents(0)} />
            ) : (
              totals.vatBreakdown.map((v) => (
                <TotalRow key={v.rateBp} label={`TVA ${formatVatRate(v.rateBp)}`} value={formatCents(v.vatCents)} />
              ))
            )}
            <TotalRow label="Total TTC" value={formatCents(totals.totalCents)} strong testId="total-ttc" />
          </dl>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <Field data-invalid={!!errors.terms}>
          <FieldLabel htmlFor={id("terms")}>Conditions (paiement, délais…)</FieldLabel>
          <Textarea id={id("terms")} rows={3} {...form.register("terms")} />
          <FieldError errors={[errors.terms]} />
        </Field>
      </section>

      {/* Barre d'actions collante en bas de l'écran */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 backdrop-blur-sm md:-mx-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {number ? `${number} · brouillon` : "Nouveau devis"} · Total TTC{" "}
            <span className="font-semibold text-foreground tabular-nums">{formatCents(totals.totalCents)}</span>
          </p>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link href={backHref}>Annuler</Link>
            </Button>
            <SubmitButton pending={pending} className="w-auto">
              Enregistrer le brouillon
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}

function TotalRow({ label, value, strong, testId }: { label: string; value: string; strong?: boolean; testId?: string }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "border-t pt-2 text-base font-semibold")}>
      <dt className={cn(!strong && "text-muted-foreground")}>{label}</dt>
      <dd className="tabular-nums" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}
