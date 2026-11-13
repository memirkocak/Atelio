import { ListChecks } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Tâches" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Tâches"
      description="Organisez votre travail et repérez les tâches en retard."
      icon={ListChecks}
    />
  );
}
