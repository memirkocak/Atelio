import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Statistiques" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Statistiques"
      description="Indicateurs et évolution de votre activité."
      icon={BarChart3}
    />
  );
}
