import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
