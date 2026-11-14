"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

import { setTaskDoneAction } from "../actions";
import { TASK_STATUS_LABELS, TASK_STATUS_TONES } from "../constants";
import { toTaskFormInput } from "../schemas";
import type { ProjectOption, TaskListItem } from "../types";

import { TaskCheckbox } from "./task-checkbox";
import { TaskDueDate, TaskPriorityLabel } from "./task-display";
import { TaskSheet } from "./task-sheet";

/**
 * Ligne de tâche : case « terminée » (mise à jour optimiste), titre ouvrant le panneau
 * de modification, projet, priorité, échéance.
 */
export function TaskRow({
  task,
  slug,
  projectOptions,
  showProject = true,
}: {
  task: TaskListItem;
  slug: string;
  projectOptions: ProjectOption[];
  showProject?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic(task.status);
  const done = status === "done";

  function toggle() {
    const next = !done;
    startTransition(async () => {
      setOptimisticStatus(next ? "done" : "todo");
      const result = await setTaskDoneAction(slug, task.id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (next) {
        // La tâche peut disparaître de la liste (terminées masquées) : annulation possible.
        toast.success("Tâche terminée", {
          action: {
            label: "Annuler",
            onClick: () => {
              void setTaskDoneAction(slug, task.id, false).then((r) => !r.ok && toast.error(r.error));
            },
          },
        });
      }
    });
  }

  const display = { ...task, status };

  return (
    <li data-task={task.title} className="flex items-start gap-3 px-3 py-2.5 sm:items-center">
      <TaskCheckbox
        checked={done}
        onToggle={toggle}
        label={done ? `Rouvrir « ${task.title} »` : `Marquer « ${task.title} » comme terminée`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <TaskSheet
          mode="edit"
          slug={slug}
          taskId={task.id}
          taskTitle={task.title}
          defaultValues={toTaskFormInput(task)}
          projectOptions={projectOptions}
          trigger={
            <button
              type="button"
              className={cn(
                "min-w-0 truncate text-left outline-none hover:underline focus-visible:underline sm:flex-1",
                done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </button>
          }
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {status === "in_progress" ? (
            <StatusBadge tone={TASK_STATUS_TONES.in_progress}>{TASK_STATUS_LABELS.in_progress}</StatusBadge>
          ) : null}
          {showProject && task.project ? (
            <Link
              href={`/w/${slug}/projets/${task.project.id}`}
              className="max-w-48 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {task.project.name}
            </Link>
          ) : null}
          <TaskPriorityLabel priority={task.priority} compact />
          <TaskDueDate task={display} />
        </div>
      </div>
    </li>
  );
}
