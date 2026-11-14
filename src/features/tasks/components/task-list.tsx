import type { ProjectOption, TaskListItem } from "../types";

import { TaskRow } from "./task-row";

/** Liste de tâches (lignes séparées, dans une carte). */
export function TaskList({
  tasks,
  slug,
  projectOptions,
  showProject = true,
}: {
  tasks: TaskListItem[];
  slug: string;
  projectOptions: ProjectOption[];
  showProject?: boolean;
}) {
  return (
    <ul aria-label="Tâches" className="divide-y overflow-hidden rounded-lg border bg-background">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} slug={slug} projectOptions={projectOptions} showProject={showProject} />
      ))}
    </ul>
  );
}
