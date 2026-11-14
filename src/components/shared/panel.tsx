import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Carte de section d'une fiche (titre + contenu, action facultative). */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-background p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Ligne « libellé / valeur » d'une liste de définitions, avec repli « Non renseigné ». */
export function InfoItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
        {label}
      </dt>
      <dd>{children ?? <span className="text-muted-foreground">Non renseigné</span>}</dd>
    </div>
  );
}

/** Message « disponible avec un module ultérieur ». */
export function UpcomingNotice({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-start gap-3 text-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{text}</p>
    </div>
  );
}
