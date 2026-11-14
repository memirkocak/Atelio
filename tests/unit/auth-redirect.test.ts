import { describe, expect, it } from "vitest";

import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth/redirect";
import { isGuestOnlyPath, isProtectedPath } from "@/lib/auth/routes";

describe("safeNextPath (protection contre les redirections ouvertes)", () => {
  it("accepte un chemin interne, avec paramètres", () => {
    expect(safeNextPath("/w/demo/clients")).toBe("/w/demo/clients");
    expect(safeNextPath("/w/demo/devis?statut=envoye#haut")).toBe("/w/demo/devis?statut=envoye#haut");
  });

  it.each([
    ["absent", null],
    ["vide", ""],
    ["URL absolue", "https://evil.example/phishing"],
    ["URL sans protocole", "//evil.example"],
    ["barre oblique inversée", "/\\evil.example"],
    ["schéma javascript", "javascript:alert(1)"],
    ["chemin relatif", "w/demo"],
  ])("refuse : %s", (_label, value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("utilise le repli fourni", () => {
    expect(safeNextPath("https://evil.example", "/connexion")).toBe("/connexion");
  });
});

describe("routes", () => {
  it("identifie les routes protégées", () => {
    expect(isProtectedPath("/demarrage")).toBe(true);
    expect(isProtectedPath("/w/demo/clients")).toBe(true);
    expect(isProtectedPath("/reinitialiser-mot-de-passe")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/connexion")).toBe(false);
    expect(isProtectedPath("/auth/confirm")).toBe(false);
  });

  it("identifie les pages réservées aux visiteurs", () => {
    expect(isGuestOnlyPath("/connexion")).toBe(true);
    expect(isGuestOnlyPath("/inscription")).toBe(true);
    expect(isGuestOnlyPath("/mot-de-passe-oublie")).toBe(true);
    expect(isGuestOnlyPath("/reinitialiser-mot-de-passe")).toBe(false);
  });
});
