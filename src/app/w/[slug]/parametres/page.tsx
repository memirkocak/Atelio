import { Settings } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Paramètres"
      description="Profil, espace de travail et préférences."
      icon={Settings}
    />
  );
}
