import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Tableau de bord"
      description="Vue d’ensemble de votre activité."
      icon={LayoutDashboard}
    />
  );
}
