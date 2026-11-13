import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Devis" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Devis"
      description="Créez, envoyez et suivez vos devis."
      icon={FileText}
    />
  );
}
