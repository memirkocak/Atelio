import type { Database } from "@/types/database.types";

/* Types et utilitaires partagés serveur / navigateur (aucun import serveur ici). */

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ClientRef = {
  id: string;
  kind: Database["public"]["Enums"]["client_kind"];
  contact_name: string;
  company_name: string | null;
};

export type ProjectListItem = Pick<
  ProjectRow,
  "id" | "name" | "status" | "budget_cents" | "start_date" | "due_date" | "progress" | "client_id" | "created_at"
> & { client: ClientRef | null };

/** Libellé d'un client lié : l'entreprise si c'en est une, sinon le contact. */
export function clientLabel(client: ClientRef | null): string | null {
  if (!client) return null;
  return client.kind === "company" && client.company_name ? client.company_name : client.contact_name;
}
