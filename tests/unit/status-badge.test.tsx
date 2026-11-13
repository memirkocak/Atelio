import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge, statusToneClasses, type StatusTone } from "@/components/shared/status-badge";

const tones: StatusTone[] = ["neutral", "info", "progress", "warning", "success", "danger"];

describe("StatusBadge", () => {
  it("associe chaque tonalité à ses tokens de couleur", () => {
    for (const tone of tones) {
      expect(statusToneClasses[tone]).toBe(
        `bg-status-${tone} text-status-${tone}-foreground`,
      );
    }
  });

  it("affiche le libellé avec la tonalité demandée", () => {
    render(<StatusBadge tone="success">Terminé</StatusBadge>);
    const badge = screen.getByText("Terminé");
    expect(badge).toHaveAttribute("data-tone", "success");
    expect(badge).toHaveClass("bg-status-success");
  });
});
