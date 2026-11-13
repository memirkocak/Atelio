import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

import { PageContainer } from "./page-container";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

/** Page provisoire d'un module pas encore développé (phase 2). */
export function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Module en cours de développement"
        description="Cette section sera disponible dans une prochaine version d’Atelio."
      />
    </PageContainer>
  );
}
