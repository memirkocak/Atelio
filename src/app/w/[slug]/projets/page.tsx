import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Projets" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Projets"
      description="Suivez vos projets, leurs échéances et leur avancement."
      icon={FolderKanban}
    />
  );
}
