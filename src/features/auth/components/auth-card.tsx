import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border bg-background p-6 shadow-xs sm:p-8">
        <div className="mb-6 space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
      {footer ? <div className="mt-6 text-center text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
