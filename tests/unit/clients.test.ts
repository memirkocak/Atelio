import { describe, expect, it } from "vitest";

import {
  clientFormSchema,
  emptyClientForm,
  parseClientListParams,
  toClientFormInput,
  toClientRow,
} from "@/features/clients/schemas";
import { containsPattern, normalizeSearch } from "@/lib/search";

describe("recherche", () => {
  it("normalise comme la colonne SQL search_text", () => {
    expect(normalizeSearch("  Élodie   LEFÈVRE ")).toBe("elodie lefevre");
    expect(normalizeSearch("Nîmes-Çà")).toBe("nimes-ca");
  });

  it("échappe les jokers SQL", () => {
    expect(containsPattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
});

describe("formulaire client", () => {
  const valid = { ...emptyClientForm, kind: "individual" as const, contactName: "Jean Dupont" };

  it("transforme les champs vides en null et normalise l'e-mail", () => {
    const r = clientFormSchema.parse({ ...valid, email: "  Jean@Exemple.FR ", city: " Paris " });
    expect(r.email).toBe("jean@exemple.fr");
    expect(r.city).toBe("Paris");
    expect(r.phone).toBeNull();
    expect(r.notes).toBeNull();
    expect(toClientRow(r)).toMatchObject({ contact_name: "Jean Dupont", company_name: null, country: "France" });
  });

  it("exige le nom de l'entreprise pour une entreprise", () => {
    const r = clientFormSchema.safeParse({ ...valid, kind: "company", companyName: "  " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ["companyName"], message: "Saisissez le nom de l’entreprise." });
  });

  it.each([
    ["e-mail invalide", { email: "pas-un-email" }, "Adresse e-mail invalide."],
    ["téléphone invalide", { phone: "abc" }, "Numéro de téléphone invalide."],
    ["nom manquant", { contactName: " " }, "Saisissez le nom du contact."],
    ["notes trop longues", { notes: "x".repeat(5001) }, "Notes : 5000 caractères maximum."],
  ])("refuse : %s", (_label, patch, message) => {
    const r = clientFormSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(message);
  });

  it("accepte les formats de téléphone usuels", () => {
    for (const phone of ["06 12 34 56 78", "+33 6 12 34 56 78", "01.23.45.67.89", "(555) 123-4567"]) {
      expect(clientFormSchema.safeParse({ ...valid, phone }).success).toBe(true);
    }
  });

  it("reconstruit les valeurs du formulaire depuis la base (aller-retour)", () => {
    const row = toClientRow(clientFormSchema.parse({ ...valid, city: "Lyon" }));
    expect(toClientFormInput(row)).toEqual({ ...valid, city: "Lyon" });
  });
});

describe("paramètres de la liste (URL)", () => {
  it("applique les valeurs par défaut", () => {
    expect(parseClientListParams({})).toEqual({ q: "", type: undefined, sort: "recent", page: 1 });
  });

  it("lit des valeurs valides", () => {
    expect(parseClientListParams({ q: " dupont ", type: "company", sort: "name", page: "3" })).toEqual({
      q: "dupont",
      type: "company",
      sort: "name",
      page: 3,
    });
  });

  it("ignore les valeurs invalides ou malveillantes", () => {
    expect(
      parseClientListParams({ type: "admin", sort: "drop table", page: "-4", q: ["a", "b"] }),
    ).toEqual({ q: "a", type: undefined, sort: "recent", page: 1 });
    expect(parseClientListParams({ page: "abc" }).page).toBe(1);
  });
});
