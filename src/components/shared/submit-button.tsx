import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  pending: boolean;
  children: ReactNode;
  className?: string;
  /** Associe le bouton à un formulaire situé ailleurs dans le DOM (ex. pied de panneau). */
  form?: string;
};

export function SubmitButton({ pending, children, className, form }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      form={form}
      className={cn("w-full", className)}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
