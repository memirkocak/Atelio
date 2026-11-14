import { describe, expect, it } from "vitest";

import { authErrorMessage, GENERIC_AUTH_ERROR } from "@/lib/auth/errors";
import { initials } from "@/lib/initials";
import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas";

describe("schémas d'authentification", () => {
  it("normalise l'e-mail (espaces, majuscules)", () => {
    const r = signInSchema.parse({ email: "  Jean@Exemple.FR ", password: "x" });
    expect(r.email).toBe("jean@exemple.fr");
  });

  it("refuse un e-mail invalide avec un message français", () => {
    const r = signInSchema.safeParse({ email: "pas-un-email", password: "x" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Adresse e-mail invalide.");
  });

  it.each([
    ["trop court", "abc12", "Au moins 8 caractères."],
    ["sans chiffre", "abcdefgh", "Au moins un chiffre."],
    ["sans lettre", "12345678", "Au moins une lettre."],
  ])("refuse un mot de passe %s", (_label, password, message) => {
    const r = signUpSchema.safeParse({ fullName: "Jean Dupont", email: "a@b.fr", password });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(message);
  });

  it("accepte une inscription valide", () => {
    const r = signUpSchema.safeParse({ fullName: " Jean Dupont ", email: "a@b.fr", password: "motdepasse1" });
    expect(r.success).toBe(true);
    expect(r.data?.fullName).toBe("Jean Dupont");
  });

  it("vérifie la confirmation du nouveau mot de passe", () => {
    const r = resetPasswordSchema.safeParse({ password: "motdepasse1", confirmPassword: "autre12345" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("authErrorMessage", () => {
  it("traduit les codes connus", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou mot de passe incorrect.");
    expect(authErrorMessage({ code: "user_already_exists" })).toMatch(/existe déjà/);
  });

  it("traite le statut 429 comme une limitation de débit", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Trop de tentatives/);
  });

  it("n'expose jamais le message technique brut", () => {
    expect(authErrorMessage({ code: "unexpected_failure", message: "db error xyz" })).toBe(
      GENERIC_AUTH_ERROR,
    );
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR);
  });
});

describe("initials", () => {
  it.each([
    ["Jean Dupont", "JD"],
    ["marie", "MA"],
    ["jean.dupont@exemple.fr", "JD"],
    ["", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
