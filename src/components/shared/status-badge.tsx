import { cn } from "@/lib/utils";

/**
 * Tonalités de statut, partagées par tous les modules :
 * - neutral  : brouillon, à venir, annulé
 * - info     : envoyé
 * - progress : en cours
 * - warning  : en attente, expiré
 * - success  : terminé, accepté
 * - danger   : en retard, refusé
 */
export type StatusTone = "neutral" | "info" | "progress" | "warning" | "success" | "danger";

export const statusToneClasses: Record<StatusTone, string> = {
  neutral: "bg-status-neutral text-status-neutral-foreground",
  info: "bg-status-info text-status-info-foreground",
  progress: "bg-status-progress text-status-progress-foreground",
  warning: "bg-status-warning text-status-warning-foreground",
  success: "bg-status-success text-status-success-foreground",
  danger: "bg-status-danger text-status-danger-foreground",
};

type StatusBadgeProps = {
  tone: StatusTone;
  children: string;
  className?: string;
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        statusToneClasses[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
