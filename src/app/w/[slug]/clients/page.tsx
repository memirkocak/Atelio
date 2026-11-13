import { Users } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Clients" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Clients"
      description="Vos clients, leurs coordonnées et leur historique."
      icon={Users}
    />
  );
}
