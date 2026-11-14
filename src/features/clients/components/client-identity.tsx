import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

import type { ClientKind } from "../constants";

/** Libellé principal d'un client : l'entreprise si c'en est une, sinon le nom du contact. */
export function clientDisplayName(client: {
  kind: ClientKind;
  company_name: string | null;
  contact_name: string;
}): string {
  return client.kind === "company" && client.company_name ? client.company_name : client.contact_name;
}

export function ClientAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-8 rounded-md", className)}>
      <AvatarFallback className="rounded-md bg-accent text-xs font-medium text-primary">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
