"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Case ronde « terminée » (zone tactile de 32 px, case visible de 18 px). */
export function TaskCheckbox({
  checked,
  onToggle,
  label,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="group/check -m-1.5 flex size-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <span
        className={cn(
          "flex size-[18px] items-center justify-center rounded-full border transition-colors",
          checked
            ? "border-status-success-foreground bg-status-success-foreground text-white"
            : "border-muted-foreground/50 group-hover/check:border-primary",
        )}
      >
        {checked ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
      </span>
    </button>
  );
}
