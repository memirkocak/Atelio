import { ArrowDown, ArrowUp, CalendarClock, ChevronsUp, Minus, type LucideIcon } from "lucide-react";

import { formatIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { TASK_PRIORITY_LABELS, type TaskPriority, type TaskStatus } from "../constants";
import { isTaskOverdue } from "../status";

const PRIORITY_STYLES: Record<TaskPriority, { icon: LucideIcon; className: string }> = {
  urgent: { icon: ChevronsUp, className: "text-status-danger-foreground" },
  high: { icon: ArrowUp, className: "text-status-warning-foreground" },
  medium: { icon: Minus, className: "text-muted-foreground" },
  low: { icon: ArrowDown, className: "text-muted-foreground/70" },
};

/** Priorité : icône colorée + libellé (libellé masqué si `compact`). */
export function TaskPriorityLabel({ priority, compact = false }: { priority: TaskPriority; compact?: boolean }) {
  const { icon: Icon, className } = PRIORITY_STYLES[priority];
  const label = TASK_PRIORITY_LABELS[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)} title={`Priorité ${label.toLowerCase()}`}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className={cn(compact && "sr-only")}>{label}</span>
    </span>
  );
}

/** Échéance d'une tâche, en rouge avec « en retard » si elle est dépassée et non terminée. */
export function TaskDueDate({
  task,
  className,
}: {
  task: { status: TaskStatus; due_date: string | null };
  className?: string;
}) {
  if (!task.due_date) return null;
  const overdue = isTaskOverdue(task);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        overdue ? "font-medium text-status-danger-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {overdue ? <CalendarClock className="size-3.5" aria-hidden /> : null}
      {formatIsoDate(task.due_date)}
      {overdue ? <span>· en retard</span> : null}
    </span>
  );
}
