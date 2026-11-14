import { CalendarClock } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES, type ProjectStatus } from "../constants";
import { isProjectOverdue } from "../status";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusBadge tone={PROJECT_STATUS_TONES[status]}>{PROJECT_STATUS_LABELS[status]}</StatusBadge>;
}

/** Échéance, en rouge avec la mention « en retard » si le projet actif est dépassé. */
export function ProjectDueDate({
  project,
  className,
}: {
  project: { status: ProjectStatus; due_date: string | null };
  className?: string;
}) {
  if (!project.due_date) return <span className={cn("text-muted-foreground", className)}>—</span>;
  const overdue = isProjectOverdue(project);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        overdue ? "font-medium text-status-danger-foreground" : "text-foreground",
        className,
      )}
    >
      {overdue ? <CalendarClock className="size-3.5" aria-hidden /> : null}
      {formatIsoDate(project.due_date)}
      {overdue ? <span className="sr-only sm:not-sr-only">· en retard</span> : null}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avancement"
        className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{value} %</span>
    </div>
  );
}
