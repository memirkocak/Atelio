import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Calendrier" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Calendrier"
      description="Rendez-vous, échéances et dates importantes."
      icon={CalendarDays}
    />
  );
}
