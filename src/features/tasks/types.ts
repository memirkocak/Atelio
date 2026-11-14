import type { Database } from "@/types/database.types";

/* Types partagés serveur / navigateur (aucun import serveur ici). */

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskListItem = Pick<
  TaskRow,
  "id" | "title" | "description" | "status" | "priority" | "due_date" | "project_id" | "completed_at" | "created_at"
> & { project: { id: string; name: string } | null };

export type ProjectOption = { id: string; label: string };
