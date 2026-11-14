import { CircleAlert, CircleCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="border-status-success bg-status-success text-status-success-foreground">
      <CircleCheck aria-hidden />
      <AlertDescription className="text-status-success-foreground">{children}</AlertDescription>
    </Alert>
  );
}
