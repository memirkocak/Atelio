import { describe, expect, it } from "vitest";

import { changePasswordSchema, deleteAccountSchema, profileSchema } from "@/features/account/schemas";

describe("profil", () => {
  it("nettoie et valide le nom", () => {
    expect(profileSchema.parse({ fullName: "  Camille Durand " })).toEqual({ fullName: "Camille Durand" });
    expect(profileSchema.safeParse({ fullName: "A" }).success).toBe(false);
    expect(profileSchema.safeParse({ fullName: "x".repeat(81) }).success).toBe(false);
  });
});

describe("changement de mot de passe", () => {
  const valid = { currentPassword: "Ancien-2026", password: "Nouveau-2027", confirmPassword: "Nouveau-2027" };

  it("accepte un changement valide", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("exige le mot de passe actuel", () => {
    const r = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });
    expect(r.error?.issues[0]?.path).toEqual(["currentPassword"]);
  });

  it("applique la règle de mot de passe (8 caractères, lettre et chiffre)", () => {
    expect(changePasswordSchema.safeParse({ ...valid, password: "court1", confirmPassword: "court1" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...valid, password: "sanschiffre", confirmPassword: "sanschiffre" }).success).toBe(false);
  });

  it("refuse une confirmation différente ou un mot de passe identique à l'actuel", () => {
    const mismatch = changePasswordSchema.safeParse({ ...valid, confirmPassword: "Autre-2027" });
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    const same = changePasswordSchema.safeParse({ ...valid, password: "Ancien-2026", confirmPassword: "Ancien-2026" });
    expect(same.error?.issues.map((i) => i.path[0])).toContain("password");
  });
});

describe("suppression du compte", () => {
  it("exige le mot de passe", () => {
    expect(deleteAccountSchema.safeParse({ password: "" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: "Secret-2026" }).success).toBe(true);
  });
});
