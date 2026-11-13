import { describe, expect, it } from "vitest";

import {
  allNavItems,
  findActiveNavItem,
  workspaceHref,
} from "@/components/layout/navigation";

describe("navigation", () => {
  it("contient les 8 modules avec des segments uniques", () => {
    expect(allNavItems).toHaveLength(8);
    const segments = allNavItems.map((item) => item.segment);
    expect(new Set(segments).size).toBe(segments.length);
  });

  it("construit les URLs d'espace en encodant le slug", () => {
    expect(workspaceHref("mon-agence", "clients")).toBe("/w/mon-agence/clients");
    expect(workspaceHref("a b", "devis")).toBe("/w/a%20b/devis");
  });

  it("trouve l'élément actif, y compris sur une sous-page", () => {
    expect(findActiveNavItem("/w/demo/clients")?.title).toBe("Clients");
    expect(findActiveNavItem("/w/demo/devis/123")?.title).toBe("Devis");
  });

  it("ne trouve rien hors d'un espace ou sur un segment inconnu", () => {
    expect(findActiveNavItem("/")).toBeUndefined();
    expect(findActiveNavItem("/w/demo")).toBeUndefined();
    expect(findActiveNavItem("/w/demo/inconnu")).toBeUndefined();
    expect(findActiveNavItem("/clients")).toBeUndefined();
  });
});
